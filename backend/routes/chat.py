import os
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are a creative animation assistant for a game development platform. You help users generate skeletal animations from text descriptions and extract motion capture from videos.

When the user wants to create an animation, extract:
1. A motion description (what the character should do)
2. Duration in seconds (default 3-5s)

Respond with a JSON block when you're ready to generate:
```generate
{"action": "text2motion", "prompt": "<motion description>", "duration": <seconds>}
```

For video motion capture:
```generate
{"action": "motion", "video": true}
```

Be conversational and creative. Help users refine their motion descriptions. Suggest interesting animations. Keep responses concise."""


class ChatRequest(BaseModel):
    messages: list[dict]


@router.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *req.messages]

    async def stream():
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": GROQ_MODEL,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 1024,
                },
            ) as resp:
                async for line in resp.aiter_lines():
                    if line.strip():
                        yield f"{line}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
