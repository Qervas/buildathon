from fastapi import APIRouter
from fastapi.responses import RedirectResponse
from r2 import r2_presigned_url

router = APIRouter()

@router.get("/api/media/{key:path}")
async def get_media(key: str):
    url = r2_presigned_url(key, expires=3600)
    return RedirectResponse(url)
