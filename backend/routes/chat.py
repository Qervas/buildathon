import os
import httpx
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

router = APIRouter()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are a creative animation assistant. You help users generate skeletal animations from text descriptions.

When ready to generate, output EXACTLY this format (use the word "generate" after the triple backticks, NOT "json"):

```generate
{"action": "text2motion", "prompt": "description here", "duration": 4}
```

Rules:
- The code fence MUST use the language tag "generate" — never "json" or anything else
- Keep the prompt descriptive but concise (under 20 words)
- Duration: 2-8 seconds
- Do NOT explain the JSON block — just output it after your conversational text
- Be conversational and creative. Help users refine their motion descriptions.
- Keep responses concise — 2-3 sentences max before the generate block."""


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
