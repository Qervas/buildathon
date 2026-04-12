# Pitch Deck — Buildathon LiU 2026

> **Product:** ohao.tech — Open-Source AI Model Delivery Platform for Creators
> **Team:** 3 people, 1 day
> **Track:** Open

---

## The Core Thesis (memorize this)

> Every week, NVIDIA, Meta, Microsoft, and others release state-of-the-art open-source AI models.
> These models are as powerful as last year's closed models.
> But they sit on Hugging Face, unusable by 99% of creators and developers.
> **We are the missionaries who deliver them.**

---

## Slide Structure (aim for 8-10 slides, ~4 min talk + live demo)

---

### Slide 1: Hook

**"Every month, a new breakthrough AI model is open-sourced. And nobody can use it."**

One line. Big text. Let it land.

> NVIDIA open-sourced Kimodo — text to motion capture. Microsoft open-sourced TRELLIS — image to 3D. Meta open-sourced Llama. They sit on Hugging Face with 50-page setup guides, CUDA dependencies, and GPU requirements. The 99% of creators who need these tools... can't touch them.

---

### Slide 2: The Problem

**Open-source AI models are exploding. But there's a delivery gap.**

- NVIDIA, Meta, Microsoft release SOTA models every month
- Closed models (OpenAI, Midjourney) lead on performance
- But open-source is catching up fast — **GTC 2026: open-source is the second tier, and the market is massive**
- Problem: these models need CUDA, GPUs, Python pipelines, 50-page READMEs
- **Creators, game developers, and small studios can't use them**
- The models exist. The delivery mechanism doesn't.

---

### Slide 3: The Solution

**We are the delivery platform for open-source AI models.**

We take the best open-source models, package them into simple APIs, and deliver them to creators who would never be able to use them otherwise.

**ohao.tech / niua.ohao.tech — already live:**
- **Music generation** — ACE-Step (open-source) → one API call
- **Image generation** — FLUX (open-source) → one API call
- **3D mesh generation** — TRELLIS (Microsoft, open-source) → one API call
- **Auto-rigging** — Puppeteer (open-source) → one API call
- **Animation** — Kimodo + GEM-X (NVIDIA, open-source) → one API call

**Every time a new model drops, we deploy it. That's our job. That's our moat.**

---

### Slide 4: Live Demo

**[SWITCH TO LIVE DEMO — see demo script below]**

---

### Slide 5: How It Works — The Platform

Architecture diagram:

```
┌───────────────────────────────────────────────────────┐
│              ohao.tech Platform                        │
│                                                        │
│   New model released on HuggingFace                    │
│        ↓                                               │
│   We evaluate, optimize, deploy to serverless GPU      │
│        ↓                                               │
│   Expose as simple API / MCP / Plugin                  │
│        ↓                                               │
│   Creators use via web UI, API, Blender, Unity,        │
│   or through their AI coding agent                     │
└───────────────────────────────────────────────────────┘
```

**Today's demo — animation pipeline:**
- **Kimodo** (NVIDIA) → text to 77-joint skeleton animation
- **GEM-X + SOMA** (NVIDIA) → video to motion capture

**Already live on niua.ohao.tech:**
- FLUX (image), ACE-Step (music), TRELLIS (3D), Puppeteer (rigging)

---

### Slide 6: Why Now — The Open-Source Tsunami

- **2024-2026: open-source models reached production quality.** NVIDIA, Meta, Microsoft are releasing models that match last year's closed-source leaders.
- **GTC 2026 signal:** NVIDIA explicitly positioning open-source as the second tier — not niche, but a massive market for every company that needs intelligence.
- **Serverless GPU** (Modal.com, RunPod) makes deployment affordable — pay per second, not per server.
- **AI coding agents** (Claude Code, Cursor, Codex) are becoming the primary developer tool — they need specialized capabilities (MCP tools) they don't have natively.
- **The gap:** Models are released faster than anyone can package them. The last-mile delivery problem is the opportunity.

---

### Slide 7: Moat — Why Us, Why Not Someone Else

**"Won't the model creators just do this themselves?"**

No. NVIDIA, Meta, Microsoft are model RESEARCHERS. They publish papers, release weights, and move on. They don't:
- Package models for end users
- Handle cross-model pipelines (image → 3D → rig → animate)
- Build creator-facing UIs, plugins, APIs
- Maintain inference infra at scale
- Keep up with every new model across every domain

**We are the Cloudflare of open-source AI models.** Cloudflare didn't create the internet — they made it fast and accessible. We don't create models — we make them usable.

**Compounding moat:** Every model we deploy makes the platform more valuable. Image gen + 3D gen + rigging + animation = a pipeline no single model can offer. The more models we integrate, the harder we are to replicate.

### Slide 8: Business Model

**Platform-as-a-Service — usage-based**

- **Free tier:** Limited generations/month (developer adoption)
- **Pro ($29/mo):** Unlimited text-to-motion, 100 video captures, all asset types
- **Enterprise:** Custom — bulk API, priority GPU, SLA, private deployments

**Three distribution channels:**
1. **Web UI** (niua.ohao.tech) — creators use directly in browser
2. **API** — developers integrate into their pipelines
3. **MCP / Plugins** — AI agents and game engines call us as a tool (Blender, Unity, Claude Code)

---

### Slide 9: The Team + ohao.tech

- **Frank Yin** — Founder of ohao.tech. Background in graphics & physics simulation. Built niua.ohao.tech — 6 AI models deployed, live in production.
- **[Teammate 1]** — [background]
- **[Teammate 2]** — [background]

**This isn't a hackathon idea. This is an existing product.**
niua.ohao.tech is live today with 6 deployed models (music, image, 3D, rigging, animation, video). We have Blender and Unreal Engine plugins. What we built today is the animation pipeline — one new piece of an existing platform.

---

### Slide 10: What We Built Today

In one day, we:
- Deployed 2 NVIDIA GPU inference services on Modal.com (Kimodo + GEM-X)
- Built a FastAPI backend with PostgreSQL on Railway
- Built a React frontend with 3D BVH skeleton viewer on Cloudflare Pages
- End-to-end: type a sentence → watch a skeleton animate in your browser

**All open-source models. All serverless. Built in one day because the platform architecture already exists.**

---

### Slide 11: Vision

**Every time a breakthrough open-source model is released, we deliver it to the world within days.**

- **Today:** Animation (Kimodo, GEM-X)
- **Already live:** Music (ACE-Step), Image (FLUX), 3D (TRELLIS), Rigging (Puppeteer)
- **Next:** Physics simulation, facial animation, voice synthesis, video generation
- **Distribution:** Web UI, API, MCP tools for AI agents, game engine plugins

**The model landscape changes every month. We are the constant — the platform that makes it all accessible.**

---

### Slide 12: Ask

- **Looking for:** Beta users, game studio partnerships, feedback on the API
- **Try it:** niua.ohao.tech (live today)
- **Contact:** [your email / ohao.tech]

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
- Rosebud/Sett generate full games — we provide the AI infrastructure layer. Different altitude. They're applications, we're the platform they should be building on.
- Replicate/HuggingFace host models — they're model registries. We curate, optimize, and pipeline models for specific creative workflows. Replicate gives you a raw model endpoint. We give you "turn this text into a game-ready animation."
- Existing game asset MCPs generate images. We generate across modalities — music, 3D, animation, rigging — as an integrated pipeline.

**"What's your moat? Can't someone just deploy the same models?"**
- Anyone can deploy ONE model. We deploy and PIPELINE them: image → 3D mesh → auto-rig → animate. That cross-model orchestration is the moat.
- We move fast. New model drops Tuesday, we deploy it Thursday. We've done this 6 times already.
- Domain expertise compounds. We know the quirks (SOMA reference root stripping, Kimodo's gated Llama dependency, TRELLIS texture optimization). This knowledge doesn't come from reading papers — it comes from shipping.

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
