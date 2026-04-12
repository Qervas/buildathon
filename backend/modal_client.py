import httpx
import os

MODAL_TEXT2MOTION_URL = os.environ.get("MODAL_TEXT2MOTION_URL")
MODAL_MOTION_URL = os.environ.get("MODAL_MOTION_URL")

async def text2motion(prompt: str, duration: float, job_id: str, webhook_url: str) -> dict:
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(MODAL_TEXT2MOTION_URL, json={
            "prompt": prompt,
            "duration": duration,
            "num_denoising_steps": 150,
            "job_id": job_id,
            "webhook_url": webhook_url,
        })
        return resp.json()

async def motion(video_key: str, job_id: str, webhook_url: str) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(MODAL_MOTION_URL, json={
                "video_key": video_key,
                "job_id": job_id,
                "webhook_url": webhook_url,
                "options": {"fps": 30},
            })
            return resp.json()
        except httpx.ReadTimeout:
            # Expected — Modal is processing, will call webhook when done
            return {"status": "processing"}
