"""BaseService — shared foundation for all buildathon GPU services.

Handles R2 upload, error wrapping, GPU timing, and webhook delivery.
Ported from niua.ohao.tech.
"""

import io
import os
import time
import traceback
from uuid import uuid4


class BaseService:
    """Override load_model() and generate() in your subclass."""

    def load_model(self):
        raise NotImplementedError

    def generate(self, request: dict) -> dict:
        raise NotImplementedError

    # ── R2 Storage ────────────────────────────────────────────────

    def upload_result(self, data: bytes, filename: str, content_type: str, job_id: str = None) -> str:
        from shared_r2 import upload_bytes_to_r2
        key = f"outputs/{job_id or uuid4()}/{filename}"
        upload_bytes_to_r2(data, key, content_type)
        return key

    def fetch_from_r2(self, key: str) -> bytes:
        from shared_r2 import _get_client
        s3 = _get_client()
        bucket = os.environ.get("R2_BUCKET_NAME", "buildathon")
        obj = s3.get_object(Bucket=bucket, Key=key)
        data = obj["Body"].read()
        print(f"R2: fetched {key} ({len(data)} bytes)")
        return data

    # ── Webhook Delivery ───────────────────────────────────────────

    def send_webhook(self, request: dict, result: dict):
        import httpx

        webhook_url = request.get("webhook_url")
        job_id = request.get("job_id")
        if not webhook_url or not job_id:
            return

        status = "completed" if "error" not in result else "failed"
        payload = {
            "job_id": job_id,
            "status": status,
            "output_key": result.get("output_key"),
            "gpu_seconds": result.get("gpu_seconds"),
            "error": result.get("error"),
        }
        for key in ("frames", "fps", "person_count"):
            if key in result:
                payload[key] = result[key]

        for attempt in range(3):
            try:
                with httpx.Client(timeout=30) as client:
                    resp = client.post(webhook_url, json=payload)
                    resp.raise_for_status()
                print(f"Webhook delivered (attempt {attempt + 1})")
                return
            except Exception as e:
                print(f"Webhook attempt {attempt + 1} failed: {e}")
                if attempt < 2:
                    time.sleep(2 ** attempt)

    # ── Safe Execution Wrapper ────────────────────────────────────

    def safe_generate(self, fn) -> dict:
        start = time.perf_counter()
        try:
            result = fn() if callable(fn) else self.generate(fn)
            result["gpu_seconds"] = round(time.perf_counter() - start, 2)
            return result
        except Exception as e:
            gpu_seconds = round(time.perf_counter() - start, 2)
            tb = traceback.format_exc()[-500:]
            print(f"Generation error ({gpu_seconds:.1f}s): {e}")
            return {
                "error": str(e),
                "gpu_seconds": gpu_seconds,
                "traceback": tb,
            }


def strip_reference_root(bvh_bytes: bytes) -> bytes:
    """Remove the SOMA reference bone from BVH output.

    SOMA BVH has two ROOT entries: a static reference frame (1 joint)
    and the actual body skeleton (77 joints). The frontend BVH viewer
    only reads the first ROOT. Strip the reference bone so the
    body skeleton becomes the first (and only) ROOT.

    Also strips the corresponding motion data columns.
    """
    text = bvh_bytes.decode("utf-8")
    lines = text.split("\n")

    root_indices = [i for i, line in enumerate(lines) if line.strip().startswith("ROOT ")]
    if len(root_indices) < 2:
        return bvh_bytes

    first_root_channels = 0
    brace_depth = 0
    for i in range(root_indices[0], root_indices[1]):
        line = lines[i].strip()
        if "{" in line:
            brace_depth += 1
        if "}" in line:
            brace_depth -= 1
        if line.startswith("CHANNELS"):
            first_root_channels += int(line.split()[1])

    hierarchy_lines = ["HIERARCHY"]
    hierarchy_lines.extend(lines[root_indices[1]:])

    motion_idx = next(i for i, line in enumerate(hierarchy_lines) if line.strip() == "MOTION")
    new_hierarchy = hierarchy_lines[:motion_idx]

    orig_motion_idx = next(i for i, line in enumerate(lines) if line.strip() == "MOTION")
    motion_header = lines[orig_motion_idx:orig_motion_idx + 3]

    frame_lines = []
    for line in lines[orig_motion_idx + 3:]:
        line = line.strip()
        if not line:
            continue
        values = line.split()
        if len(values) > first_root_channels:
            frame_lines.append(" ".join(values[first_root_channels:]))

    result = "\n".join(new_hierarchy + motion_header + frame_lines) + "\n"
    return result.encode("utf-8")


def scale_bvh_to_meters(bvh_bytes: bytes) -> bytes:
    """Scale BVH from SOMA centimeters to meters (divide positions by 100).

    Scales OFFSET values in the hierarchy and position channels in motion data.
    Rotation channels are left unchanged.
    """
    text = bvh_bytes.decode("utf-8")
    lines = text.split("\n")
    result = []

    # Track which motion columns are position (not rotation)
    channel_types: list[str] = []  # 'pos' or 'rot' per column
    in_hierarchy = True

    for line in lines:
        stripped = line.strip()

        # Scale OFFSET values
        if stripped.startswith("OFFSET"):
            parts = stripped.split()
            scaled = [f"{float(v) / 100.0:.6f}" for v in parts[1:]]
            indent = line[:len(line) - len(line.lstrip())]
            result.append(f"{indent}OFFSET {' '.join(scaled)}")
            continue

        # Track channel types for motion data scaling
        if stripped.startswith("CHANNELS"):
            parts = stripped.split()
            count = int(parts[1])
            names = parts[2:2 + count]
            for name in names:
                if "position" in name.lower():
                    channel_types.append("pos")
                else:
                    channel_types.append("rot")
            result.append(line)
            continue

        if stripped == "MOTION":
            in_hierarchy = False
            result.append(line)
            continue

        # Scale position columns in motion data
        if not in_hierarchy and stripped and not stripped.startswith("Frames:") and not stripped.startswith("Frame Time:"):
            values = stripped.split()
            if len(values) >= len(channel_types):
                scaled_values = []
                for i, v in enumerate(values):
                    if i < len(channel_types) and channel_types[i] == "pos":
                        scaled_values.append(f"{float(v) / 100.0:.6f}")
                    else:
                        scaled_values.append(v)
                result.append(" ".join(scaled_values))
                continue

        result.append(line)

    return "\n".join(result).encode("utf-8")
