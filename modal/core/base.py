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
