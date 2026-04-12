# Pitch Deck — Buildathon LiU 2026

> **Product:** AI Animation Generation Platform
> **Team:** 3 people, 1 day
> **Track:** Open

---

## Slide Structure (aim for 8-10 slides, ~4 min talk + live demo)

---

### Slide 1: Hook

**"What if you could create motion capture quality animation — without cameras, suits, or studios?"**

One line. Big text. Let it land.

---

### Slide 2: The Problem

**Game developers and creators spend weeks on animation.**

- Professional motion capture: $10,000-50,000 per session
- Manual animation: days per character action
- Indie developers: stuck with asset store or stiff procedural animation
- The tools exist for AAA studios, not for everyone else

---

### Slide 3: The Solution

**Type a sentence. Get a skeleton animation.**

Show a simple before/after:
- **Before:** "a person walking confidently" (text)
- **After:** 3D skeleton animation playing in browser (screenshot/GIF from our viewer)

Also:
- **Upload a video → get motion capture data** (no suit, no studio, just your phone)

---

### Slide 4: Live Demo

**[SWITCH TO LIVE DEMO — see demo script below]**

---

### Slide 5: How It Works

Architecture diagram (simplified version of what we built):

```
User prompt → Our API → NVIDIA Kimodo (GPU) → BVH Animation
User video  → Our API → NVIDIA GEM-X  (GPU) → BVH Animation
```

**Key tech:**
- **Kimodo** (NVIDIA) — state-of-the-art text-to-motion model
- **GEM-X + SOMA** (NVIDIA) — video motion capture, no body suit needed
- **77-78 joint SOMA skeleton** — production-quality bone structure
- **BVH format** — industry standard, works in Blender, Unity, Unreal

---

### Slide 6: Why Now

- Open-source AI models have reached production quality (NVIDIA open-sourced these in 2025)
- Serverless GPU (Modal.com) makes inference affordable — pay per second, not per server
- Game industry is $200B+ and growing — indie developers are the fastest-growing segment
- AI coding agents (Claude Code, Cursor) are becoming the primary dev tool — they need specialized capabilities they don't have natively

---

### Slide 7: Business Model

**API-as-a-Service**

- **Free tier:** X generations/month (developer adoption)
- **Pro:** $29/month — unlimited text-to-motion, 100 video captures
- **Enterprise:** Custom pricing — bulk API access, priority GPU, SLA

**Distribution channels:**
- Direct API (developers integrate into their pipelines)
- MCP server (AI coding agents call our API as a tool)
- Blender/Unity plugins (creators use inside their existing workflow)

---

### Slide 8: The Team + ohao.tech

- **Frank Yin** — Founder of ohao.tech, built niua.ohao.tech (AI game asset platform: music, images, 3D mesh, rigging, animation)
- **[Teammate 1]** — [background]
- **[Teammate 2]** — [background]

**This isn't our first product.** niua.ohao.tech already generates game assets for humans via a web UI. Today we proved the same technology works as an API service — a new distribution channel, same domain expertise.

---

### Slide 9: What We Built Today

In one day, we:
- Deployed 2 GPU inference services (Kimodo + GEM-X) on Modal.com
- Built a FastAPI backend with PostgreSQL on Railway
- Built a React frontend with 3D BVH viewer on Cloudflare Pages
- End-to-end tested: text → animation, video → motion capture

**All open-source models. All serverless. All works.**

---

### Slide 10: Ask / Next Steps

- **Next:** Add more animation models (dance, fighting, sports-specific)
- **Next:** Unity/Unreal plugin for direct import
- **Next:** MCP server for AI coding agents (the "GameForge" vision)
- **Looking for:** Early beta users, API feedback, partnerships with game studios

---

## Live Demo Script

**This is the most important part. Practice this 2-3 times before presenting.**

### Setup (before going on stage)
- Have the frontend open in a browser tab
- Have a second tab ready for the BVH viewer
- Have a short video on your phone or desktop ready to upload

### Demo Flow (~2 minutes)

**1. Text-to-Motion (60 seconds)**

> "Let me show you how this works. I'm going to type a simple sentence..."

- Type: **"a person doing a victory dance"**
- Set duration: **3 seconds**
- Click Generate
- While waiting (~30-60s): explain what's happening

> "Right now, NVIDIA's Kimodo model is running on an A10G GPU in the cloud. It's generating a 77-joint skeleton animation from just those 5 words."

- BVH loads in the viewer — skeleton starts dancing
- **THE MOMENT**: let the audience react. Don't talk over it.

> "That's a production-quality skeleton animation. 30 frames per second, 77 joints. You can import this directly into Blender, Unity, or Unreal."

**2. Video Motion Capture (30 seconds — show result only)**

Because video processing takes 2 minutes, **pre-generate this before the demo** and have the result ready.

> "We can also extract motion from video. I uploaded a video of someone walking earlier..."

- Show the pre-generated BVH result in the viewer
- Skeleton mimics the person from the video

> "No motion capture suit. No studio. Just a phone camera and our API."

**3. Close (30 seconds)**

> "Text to animation. Video to motion capture. An API that gives any developer access to what used to require a $50,000 studio. That's what we built today."

### Demo Backup Plan

If anything breaks during the live demo:
- Have pre-recorded GIFs/screenshots of both flows working
- Have the curl test results ready to show in terminal as proof
- The BVH files we generated during testing are still in R2 — can show those directly

---

## Talking Points for Q&A

**"How is this different from X?"**
- Rosebud/Sett/CodeWisp generate full games — we generate animation assets. Different layer. We're infrastructure, not application.
- Existing MCPs (pixelforge, game-asset-mcp) generate images. We generate motion — temporal, skeletal, physics-based. Fundamentally different.

**"What about copyright/licensing?"**
- Kimodo: NVIDIA Open Model License (commercial use OK)
- GEM-X: Apache 2.0 (fully open)
- All generated animations are owned by the user

**"What's the latency?"**
- Text-to-motion: ~30-60 seconds (GPU inference)
- Video motion capture: ~2 minutes (preprocessing + inference)
- These are generation tasks, not real-time — comparable to image generation

**"How much does it cost to run?"**
- Modal.com A10G: ~$0.58/hr
- Average text-to-motion: ~5s GPU = ~$0.001 per generation
- Average motion capture: ~120s GPU = ~$0.02 per video
- Very affordable at scale

**"Why not just use motion capture?"**
- Mocap needs cameras, suits, studios, actors. Costs $10-50K per session.
- Our text-to-motion needs 5 words and 30 seconds. Costs $0.001.
- Video mocap needs a phone camera. Costs $0.02.
