---
theme: default
title: ohao — AI Animation Platform
info: |
  Buildathon LiU 2026 — Team ohao
class: text-center
drawings:
  persist: false
transition: slide-left
mdc: true
---

<div class="flex flex-col items-center justify-center h-full">

<div class="text-6xl font-bold mb-4">ohao</div>

<div class="text-2xl text-gray-400 mb-12">The Delivery Platform for Open-Source AI Models</div>

<div class="flex gap-12 text-lg mb-12">
  <div class="text-center">
    <div class="font-bold text-blue-400">Yihao Hu</div>
  </div>
  <div class="text-center">
    <div class="font-bold text-green-400">Wenlin Fan</div>
  </div>
  <div class="text-center">
    <div class="font-bold text-purple-400">Hengrui Guo</div>
  </div>
</div>

<div class="text-sm opacity-40">Buildathon LiU 2026</div>

</div>

---

# Every month, a new breakthrough AI model is open-sourced.

# And nobody can use it.

<div class="abs-bl m-6 text-sm opacity-40">
Team ohao · Buildathon LiU 2026
</div>

<!--
NVIDIA open-sourced Kimodo — text to motion capture. Microsoft open-sourced TRELLIS — image to 3D. Meta open-sourced Llama. They sit on Hugging Face with 50-page setup guides, CUDA dependencies, and GPU requirements. The 99% of creators who need these tools can't touch them.
-->

---
layout: two-cols
layoutClass: gap-8
---

# The Problem

Open-source AI models are **exploding**.

But there's a **delivery gap**.

<v-clicks>

- NVIDIA, Meta, Microsoft release SOTA models every month
- Open-source is catching up fast
- **GTC 2026**: open-source = second tier, massive market
- But models need CUDA, GPUs, Python, 50-page READMEs
- **Creators can't use them**

</v-clicks>

::right::

<div class="mt-12">

```
📄 README.md (2,847 lines)

Prerequisites:
  - CUDA 12.4
  - cuDNN 8.9
  - Python 3.10
  - PyTorch 2.3.0
  - 24GB VRAM minimum
  - ...

$ git clone ...
$ pip install -e .
$ python download_checkpoints.py
$ python scripts/demo.py --config ...

❌ Error: CUDA out of memory
```

</div>

<div class="text-center mt-4 text-sm opacity-60">

What "open-source" actually looks like for 99% of creators

</div>

<!--
The models exist. The delivery mechanism doesn't.
-->

---

# The Solution

<div class="text-3xl font-bold text-blue-400 mb-8">
We are the delivery platform for open-source AI models.
</div>

We take the best open-source models, package them into **simple APIs**, and deliver them to creators who would never be able to use them otherwise.

<v-clicks>

- New text-to-motion model? **Deploy it** → creators get an API endpoint
- New 3D generation model? **Deploy it** → developers call it from their game engine
- New music generation model? **Deploy it** → indie devs get a soundtrack generator

</v-clicks>

<div v-click class="mt-8 text-2xl font-bold text-green-400">
Every time a new model drops, we deploy it. That's the business.
</div>

---
layout: center
class: text-center
---

# Live Demo

<div class="text-2xl text-gray-400 mb-8">
Type a sentence. Get a skeleton animation.
</div>

<div class="text-6xl mb-4">
🎬
</div>

<div class="text-sm opacity-50">
switching to browser...
</div>

<!--
DEMO SCRIPT:
1. Type: "a person doing a victory dance"
2. Duration: 3 seconds, click Generate
3. While waiting: "NVIDIA's Kimodo model is running on an A10G GPU. Generating a 77-joint skeleton animation from 5 words."
4. BVH loads — skeleton starts dancing. LET THE AUDIENCE REACT.
5. "30 fps, 77 joints. Import directly into Blender, Unity, or Unreal."
6. Show pre-generated motion capture result: "Video → motion. No suit. No studio. Just a phone camera."
-->

---

# How It Works

<div class="grid grid-cols-3 gap-4 mt-8">

<div class="bg-gray-800 rounded-lg p-4 text-center">
<div class="text-3xl mb-2">📥</div>
<div class="font-bold text-blue-400">Ingest</div>
<div class="text-sm text-gray-400 mt-2">New model on HuggingFace → we evaluate and optimize</div>
</div>

<div class="bg-gray-800 rounded-lg p-4 text-center">
<div class="text-3xl mb-2">🚀</div>
<div class="font-bold text-orange-400">Deploy</div>
<div class="text-sm text-gray-400 mt-2">Serverless GPU (Modal.com) → scales to zero, pay per second</div>
</div>

<div class="bg-gray-800 rounded-lg p-4 text-center">
<div class="text-3xl mb-2">🎯</div>
<div class="font-bold text-green-400">Deliver</div>
<div class="text-sm text-gray-400 mt-2">Simple API / MCP / Plugin → creators use from anywhere</div>
</div>

</div>

<div class="mt-8">

**Today's demo — animation pipeline:**

| Model | Source | Input | Output |
|-------|--------|-------|--------|
| **Kimodo** | NVIDIA | Text prompt | 77-joint skeleton animation (BVH) |
| **GEM-X + SOMA** | NVIDIA | Video | 78-joint motion capture (BVH) |

</div>

<div class="text-sm text-gray-500 mt-4">
Same architecture works for any model: image, music, 3D, rigging
</div>

---

# Market — Sweden Is THE Place For This

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

<div class="text-4xl font-bold text-blue-400 mb-2">#1</div>
<div class="text-lg mb-6">Game-producing country <strong>per capita</strong> in the world</div>

<div class="space-y-2 text-lg">

- **€1.8B+** revenue
- **900+** game studios
- **8,000-12,000** employees
- **15-20%** annual growth

</div>

</div>

<div>

<div class="text-sm font-bold text-gray-400 mb-4">BORN IN SWEDEN</div>

<div class="grid grid-cols-2 gap-2 text-sm">
<div class="bg-gray-800 rounded p-2">🟩 Minecraft — Mojang</div>
<div class="bg-gray-800 rounded p-2">💥 Battlefield — DICE</div>
<div class="bg-gray-800 rounded p-2">🍬 Candy Crush — King</div>
<div class="bg-gray-800 rounded p-2">🏰 Europa Universalis — Paradox</div>
<div class="bg-gray-800 rounded p-2">💣 Just Cause — Avalanche</div>
<div class="bg-gray-800 rounded p-2">🪖 Helldivers — Arrowhead</div>
<div class="bg-gray-800 rounded p-2">🎭 Payday — Starbreeze</div>
<div class="bg-gray-800 rounded p-2">⚙️ Satisfactory — Coffee Stain</div>
</div>

<div class="text-xs text-gray-500 mt-4">
Free education · Early broadband · Demoscene culture · Flat orgs
</div>

</div>

</div>

<div class="mt-4 text-lg font-bold text-green-400">
Every one of these studios needs animation. We make it 100x faster and 1000x cheaper.
</div>

---

# The Numbers

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

<div class="space-y-6">

<div>
<div class="text-4xl font-bold text-blue-400">$205B</div>
<div class="text-gray-400">Global game industry (2026)</div>
</div>

<div>
<div class="text-4xl font-bold text-green-400">$486M</div>
<div class="text-gray-400">Motion capture market today &rarr; $1.67B by 2035</div>
</div>

<div>
<div class="text-4xl font-bold text-purple-400">$37.9B</div>
<div class="text-gray-400">AI in gaming by 2034 (from $4.4B today)</div>
</div>

</div>

</div>

<div>

<div class="text-sm font-bold text-gray-400 mb-4">COST COMPARISON</div>

<div class="space-y-3 text-sm">

<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
<div class="text-red-400 font-bold">Traditional Mocap</div>
<div class="text-gray-400">$2,500/day studio + $4,000/actor + $20/sec retargeting</div>
</div>

<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
<div class="text-red-400 font-bold">Mocap Suit</div>
<div class="text-gray-400">$2,500-$50,000 hardware + $2,145/yr software</div>
</div>

<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
<div class="text-green-400 font-bold">ohao</div>
<div class="text-green-300">$0.001 per text animation. $0.02 per video mocap.</div>
<div class="text-green-400 font-bold mt-1">150,000x cheaper.</div>
</div>

</div>

</div>

</div>

<!--
Key stat for Q&A: At $29/mo Pro tier with 100 generations, our cost is $0.10. That's 99.7% margin.
55% of indie devs are solo. 50% self-funded. They can't afford $2,500/day mocap. We give them the same quality for $0.001.
-->

---

# Why Now

<div class="space-y-6 mt-8">

<v-clicks>

<div class="flex items-start gap-4">
<div class="text-2xl">🌊</div>
<div><strong class="text-blue-400">Open-source tsunami</strong> — NVIDIA, Meta, Microsoft releasing production-quality models monthly. GTC 2026 confirmed: open-source is the second tier, and the market is massive.</div>
</div>

<div class="flex items-start gap-4">
<div class="text-2xl">⚡</div>
<div><strong class="text-orange-400">Serverless GPU</strong> — Modal.com, RunPod: pay per second, not per server. Makes deployment affordable for startups.</div>
</div>

<div class="flex items-start gap-4">
<div class="text-2xl">🤖</div>
<div><strong class="text-purple-400">AI coding agents</strong> — Claude Code, Cursor, Codex are the new developer tools. They need specialized capabilities (MCP tools) they don't have natively.</div>
</div>

<div class="flex items-start gap-4">
<div class="text-2xl">📦</div>
<div><strong class="text-green-400">The gap</strong> — Models are released faster than anyone can package them. The last-mile delivery problem is the opportunity.</div>
</div>

</v-clicks>

</div>

---

# Agentic Ecosystem

<div class="text-lg text-gray-400 mb-6">We're a tool layer — every agent framework can use us</div>

<div class="grid grid-cols-3 gap-4 mt-4">

<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
<div class="font-bold text-green-400 text-sm mb-2">SUPPORTED NOW</div>
<div class="text-sm text-gray-300">MCP (Anthropic)</div>
<div class="text-sm text-gray-300">REST API</div>
<div class="text-sm text-gray-300">Blender Plugin</div>
</div>

<div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
<div class="font-bold text-blue-400 text-sm mb-2">COMPATIBLE</div>
<div class="text-sm text-gray-300">OpenClaw (120k stars)</div>
<div class="text-sm text-gray-300">Hermes Agent (NousResearch)</div>
<div class="text-sm text-gray-300">OpenAI Agents SDK</div>
</div>

<div class="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
<div class="font-bold text-purple-400 text-sm mb-2">ROADMAP</div>
<div class="text-sm text-gray-300">A2A (Google/Linux Foundation)</div>
<div class="text-sm text-gray-300">AG-UI (CopilotKit)</div>
<div class="text-sm text-gray-300">LangGraph / CrewAI tools</div>
</div>

</div>

<div class="flex flex-wrap gap-2 mt-6 justify-center">
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">Claude Code</div>
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">Cursor</div>
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">Windsurf</div>
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">OpenClaw</div>
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">Hermes</div>
<div class="px-3 py-1 rounded-full bg-gray-800 text-sm text-gray-400">Codex</div>
</div>

<div class="mt-4 text-sm text-gray-500">
The agent protocol stack: MCP (tool access) + A2A (agent collaboration) + AG-UI (frontend). We sit at the MCP layer and expand from there.
</div>

---

# Our Moat

<div class="text-xl text-gray-400 mb-6">
"Won't the model creators just do this themselves?"
</div>

**No.** NVIDIA, Meta, Microsoft are model RESEARCHERS. They publish, release weights, move on.

<div class="grid grid-cols-3 gap-4 mt-6">

<div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4">
<div class="font-bold text-blue-400 mb-2">Cross-Model Pipelines</div>
<div class="text-sm text-gray-400">Anyone can deploy ONE model. We pipeline them: image → 3D → rig → animate. No single model does this.</div>
</div>

<div class="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4">
<div class="font-bold text-orange-400 mb-2">Speed of Deployment</div>
<div class="text-sm text-gray-400">New model drops Tuesday, we deploy it Thursday. We know the quirks — SOMA root stripping, gated model workarounds, VRAM optimization.</div>
</div>

<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-4">
<div class="font-bold text-green-400 mb-2">Compounding Expertise</div>
<div class="text-sm text-gray-400">Every model deployed makes the platform more valuable. Domain knowledge doesn't come from papers — it comes from shipping.</div>
</div>

</div>

<div class="mt-8 text-xl font-bold">
We are the <span class="text-blue-400">Cloudflare</span> of open-source AI.
<span class="text-gray-500">They didn't create the internet — they made it accessible.</span>
</div>

---

# Business Model

<div class="text-xl text-gray-400 mb-6">Platform-as-a-Service — usage based</div>

<div class="grid grid-cols-3 gap-6 mt-4">

<div class="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
<div class="text-gray-400 text-sm font-bold mb-2">FREE</div>
<div class="text-3xl font-bold mb-2">$0</div>
<div class="text-sm text-gray-400">Limited generations/mo</div>
<div class="text-sm text-gray-400">Developer adoption</div>
</div>

<div class="bg-gray-800 rounded-lg p-6 text-center border border-blue-500">
<div class="text-blue-400 text-sm font-bold mb-2">PRO</div>
<div class="text-3xl font-bold mb-2">$29<span class="text-lg">/mo</span></div>
<div class="text-sm text-gray-400">Unlimited text-to-motion</div>
<div class="text-sm text-gray-400">100 video captures</div>
</div>

<div class="bg-gray-800 rounded-lg p-6 text-center border border-orange-500">
<div class="text-orange-400 text-sm font-bold mb-2">ENTERPRISE</div>
<div class="text-3xl font-bold mb-2">Custom</div>
<div class="text-sm text-gray-400">Bulk API, priority GPU</div>
<div class="text-sm text-gray-400">SLA, private deploy</div>
</div>

</div>

<div class="mt-6">

**Distribution:** Web UI · API · MCP for AI agents · Blender & Unity plugins

</div>

<div class="mt-4 text-sm text-gray-500">

Unit economics: text-to-motion costs ~$0.001/generation (5s GPU @ $0.58/hr). Massive margin at $29/mo.

</div>

---

# What We Built Today

<div class="mt-4 mb-8 text-lg text-gray-400">In one day. Three people. From scratch.</div>

<div class="grid grid-cols-2 gap-6">

<div>

<div class="space-y-4">

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div><strong>2 GPU inference services</strong> on Modal.com<br><span class="text-sm text-gray-400">Kimodo (text→motion) + GEM-X (video→mocap)</span></div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div><strong>FastAPI backend</strong> on Railway<br><span class="text-sm text-gray-400">PostgreSQL, R2 storage, webhook system</span></div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div><strong>React frontend</strong> on Cloudflare Pages<br><span class="text-sm text-gray-400">3D BVH skeleton viewer with Three.js</span></div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div><strong>End-to-end tested</strong><br><span class="text-sm text-gray-400">Type a sentence → watch a skeleton animate</span></div>
</div>

</div>

</div>

<div class="bg-gray-800 rounded-lg p-4 text-sm font-mono">

<div class="text-gray-500 mb-2"># tested on buildathon day</div>

<div class="text-green-400">$ curl POST /generate/text2motion</div>
<div class="text-gray-400 mb-2">  {"prompt": "person waving hello"}</div>

<div class="text-blue-400">→ 60 frames @ 30fps</div>
<div class="text-blue-400">→ 3.85s GPU time</div>
<div class="text-blue-400 mb-2">→ $0.001 cost</div>

<div class="text-green-400">$ curl POST /generate/motion</div>
<div class="text-gray-400 mb-2">  {video: "walk.mp4"}</div>

<div class="text-blue-400">→ 255 frames @ 30fps</div>
<div class="text-blue-400">→ 118s GPU time</div>
<div class="text-blue-400">→ $0.02 cost</div>

</div>

</div>

---

# Vision

<div class="text-2xl font-bold text-blue-400 mt-8 mb-8">
Every time a breakthrough open-source model is released,<br>we deliver it to the world within days.
</div>

<div class="grid grid-cols-4 gap-4">

<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-4 text-center">
<div class="font-bold text-green-400">Today</div>
<div class="text-sm text-gray-400 mt-2">Animation<br>Kimodo · GEM-X</div>
</div>

<div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-center">
<div class="font-bold text-blue-400">Next</div>
<div class="text-sm text-gray-400 mt-2">Music · Image<br>3D · Rigging</div>
</div>

<div class="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 text-center">
<div class="font-bold text-purple-400">Future</div>
<div class="text-sm text-gray-400 mt-2">Physics sim · Facial<br>Voice · Video</div>
</div>

<div class="bg-orange-900/30 border border-orange-500/30 rounded-lg p-4 text-center">
<div class="font-bold text-orange-400">Distribution</div>
<div class="text-sm text-gray-400 mt-2">Web · API · MCP<br>Blender · Unity</div>
</div>

</div>

<div class="mt-12 text-xl text-center">
The model landscape changes every month.<br>
<strong>We are the constant — the platform that makes it all accessible.</strong>
</div>

---
layout: center
class: text-center
---

# Thank you

<div class="text-2xl text-gray-400 mt-4 mb-8">Team ohao</div>

<div class="text-lg">

Looking for: **beta users** · **game studio partnerships** · **API feedback**

</div>

<div class="mt-12 text-sm opacity-40">
Buildathon LiU 2026
</div>
