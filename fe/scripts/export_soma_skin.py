"""
Export SOMA 77 skin mesh to a Three.js-ready binary format.

Output files (written to fe/public/models/):
  soma_skin.bin   — binary blob with all geometry + skinning data
  soma_skin.json  — manifest with byte offsets, counts, and joint names

Usage:
  python fe/scripts/export_soma_skin.py

Requires: numpy (no other dependencies).
"""

import json
import struct
from pathlib import Path

import numpy as np

SKIN_NPZ = Path(__file__).parents[3] / "kimodo/kimodo/assets/skeletons/somaskel77/skin_standard.npz"
OUT_DIR = Path(__file__).parents[1] / "public/models"

# ── Load ────────────────────────────────────────────────────────────────────

print(f"Loading {SKIN_NPZ} …")
data = np.load(SKIN_NPZ, allow_pickle=True)

bind_vertices = data["bind_vertices"].astype(np.float32)       # (V, 3)
faces = data["faces"].astype(np.uint32)                        # (F, 3)
bind_rig_transform = data["bind_rig_transform"].astype(np.float32)  # (J, 4, 4)
lbs_indices = data["lbs_indices"].astype(np.int32)             # (V, 8)
lbs_weights = data["lbs_weights"].astype(np.float32)           # (V, 8)
joint_names = list(data["rig_joint_names"])                    # list[str], len=77

V = bind_vertices.shape[0]
F = faces.shape[0]
J = bind_rig_transform.shape[0]
print(f"  vertices={V}, faces={F}, joints={J}")

# ── Truncate to 4 weights per vertex (Three.js skinning standard) ────────────

# Sort each vertex's influences by descending weight, keep top 4
order = np.argsort(-lbs_weights, axis=1)          # (V, 8) descending
skin_indices_4 = np.take_along_axis(lbs_indices, order[:, :4], axis=1).astype(np.uint16)  # (V, 4)
skin_weights_4 = np.take_along_axis(lbs_weights, order[:, :4], axis=1)                   # (V, 4)

# Re-normalise so weights sum to 1.0
row_sums = skin_weights_4.sum(axis=1, keepdims=True)
skin_weights_4 = (skin_weights_4 / np.maximum(row_sums, 1e-6)).astype(np.float32)

# ── Inverse bind matrices (column-major for Three.js fromArray) ──────────────
#
# bind_rig_transform[j] is the 4x4 world-space transform of joint j in bind pose.
# Three.js SkinnedMesh shader: deformed = sum_j( weight_j * boneMatrix_j * invBind_j * vertex )
# where boneMatrix_j = bone.matrixWorld (updated each frame by AnimationMixer).
#
# We export inv_bind[j] = inverse(bind_rig_transform[j]).
# THREE.Matrix4.fromArray() expects column-major order, so we transpose each matrix.

inv_bind = np.linalg.inv(bind_rig_transform)              # (J, 4, 4) row-major
inv_bind_cm = inv_bind.transpose(0, 2, 1).astype(np.float32)  # (J, 4, 4) col-major for Three.js

# ── Pack binary buffer ───────────────────────────────────────────────────────

# bind_rig_transform in column-major order for THREE.Matrix4.fromArray()
bind_rig_cm = bind_rig_transform.transpose(0, 2, 1).astype(np.float32)  # (J, 4, 4) col-major

sections = {
    "bind_vertices":      bind_vertices.tobytes(),            # float32, (V*3)
    "faces":              faces.tobytes(),                    # uint32,  (F*3)
    "skin_indices":       skin_indices_4.tobytes(),           # uint16,  (V*4)
    "skin_weights":       skin_weights_4.tobytes(),           # float32, (V*4)
    "bind_rig_transform": bind_rig_cm.reshape(J, 16).tobytes(),  # float32, (J*16) col-major
}

OUT_DIR.mkdir(parents=True, exist_ok=True)
bin_path = OUT_DIR / "soma_skin.bin"

soma_body_height = float(bind_vertices[:, 1].max() - bind_vertices[:, 1].min())

manifest = {
    "version": 1,
    "counts": {"vertices": V, "faces": F, "joints": J},
    "soma_body_height": soma_body_height,
    "joint_names": joint_names,
    "sections": {},
}

offset = 0
buf = bytearray()
for name, blob in sections.items():
    manifest["sections"][name] = {"byteOffset": offset, "byteLength": len(blob)}
    buf.extend(blob)
    offset += len(blob)

bin_path.write_bytes(buf)
print(f"Wrote {bin_path}  ({len(buf) / 1024:.1f} KB)")

json_path = OUT_DIR / "soma_skin.json"
json_path.write_text(json.dumps(manifest, indent=2))
print(f"Wrote {json_path}")

print("\nSection layout:")
for name, info in manifest["sections"].items():
    print(f"  {name:20s}  offset={info['byteOffset']:>8}  bytes={info['byteLength']:>8}")
print(f"\nFirst 5 joint names: {joint_names[:5]}")
print("Done.")
