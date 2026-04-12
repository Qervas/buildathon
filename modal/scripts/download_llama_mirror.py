"""Download ungated Llama-3-8B mirror and symlink for meta-llama namespace."""
import os
from huggingface_hub import snapshot_download

print("Downloading NousResearch/Meta-Llama-3-8B-Instruct...")
path = snapshot_download("NousResearch/Meta-Llama-3-8B-Instruct")
print(f"Downloaded to: {path}")

cache_dir = os.path.expanduser("~/.cache/huggingface/hub")
meta_dir = os.path.join(cache_dir, "models--meta-llama--Meta-Llama-3-8B-Instruct")
nous_dir = os.path.join(cache_dir, "models--NousResearch--Meta-Llama-3-8B-Instruct")

if not os.path.exists(meta_dir) and os.path.exists(nous_dir):
    os.symlink(nous_dir, meta_dir)
    print(f"Symlinked: meta-llama -> NousResearch")
else:
    print(f"meta-llama dir already exists or NousResearch dir not found")

print("Done!")
