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

<div class="text-2xl text-gray-400 mb-12">AI Animation for Game Developers</div>

<div class="flex gap-12 text-lg mb-12">
  <div class="font-bold text-blue-400">Yihao Hu</div>
  <div class="font-bold text-green-400">Wenlin Fan</div>
  <div class="font-bold text-purple-400">Hengrui Guo</div>
</div>

<div class="text-sm opacity-40">Buildathon LiU 2026</div>

</div>

---

# The Problem

<div class="grid grid-cols-2 gap-10 mt-6">

<div>

<div class="text-2xl font-bold mb-6">Animation is the gate.</div>

<v-clicks>

- Motion capture studio: **$2,500/day**
- Actor setup: **$4,000/person**
- Mocap suit: **$2,500-$50,000**
- Software: **$2,145/yr**
- Result: **55% of indie devs are solo, 50% self-funded**
- **Most make 2D games. Not by choice.**

</v-clicks>

</div>

<div class="mt-4">

```
📄 How to use open-source motion AI:

Prerequisites:
  - CUDA 12.4 + cuDNN 8.9
  - Python 3.10 + PyTorch 2.3.0
  - 24GB VRAM minimum
  - 50-page setup guide

$ pip install -e .
$ python download_checkpoints.py
$ python scripts/demo.py --config ...

❌ Error: CUDA out of memory
```

<div class="text-center mt-3 text-sm opacity-50">
What "open-source AI" looks like for 99% of creators
</div>

</div>

</div>

<!--
The models exist. World-class open-source AI for animation, 3D, music. But nobody can use them.
-->

---

# Our Solution

<div class="text-3xl font-bold text-blue-400 mt-4 mb-6">
Type a sentence. Get a skeleton animation.
</div>

<div class="grid grid-cols-3 gap-4 mt-4">

<div class="bg-gray-800 rounded-lg p-5 text-center">
<div class="text-3xl mb-3">📝</div>
<div class="font-bold text-blue-400 mb-2">Text to Motion</div>
<div class="text-sm text-gray-400">"person doing a victory dance" → full-body skeleton animation. Open-source AI.</div>
</div>

<div class="bg-gray-800 rounded-lg p-5 text-center">
<div class="text-3xl mb-3">📱</div>
<div class="font-bold text-green-400 mb-2">Video Motion Capture</div>
<div class="text-sm text-gray-400">Upload any phone video → professional animation data. No suit. No studio.</div>
</div>

<div class="bg-gray-800 rounded-lg p-5 text-center">
<div class="text-3xl mb-3">🔌</div>
<div class="font-bold text-orange-400 mb-2">Works Everywhere</div>
<div class="text-sm text-gray-400">Web · API · AI agent plugin · Blender. Works with Unity, Unreal, Godot.</div>
</div>

</div>

<div class="mt-8 text-xl font-bold text-green-400">
~$0.002 per animation. 100,000x cheaper than a studio.
</div>

---

# The Market

<div class="grid grid-cols-2 gap-8 mt-4">

<div>

<div class="space-y-5">
<div>
<div class="text-4xl font-bold text-blue-400">$205B</div>
<div class="text-gray-400">Global game industry (2026)</div>
</div>
<div>
<div class="text-4xl font-bold text-green-400">$486M → $1.67B</div>
<div class="text-gray-400">Motion capture market by 2035</div>
</div>
<div>
<div class="text-4xl font-bold text-purple-400">$37.9B</div>
<div class="text-gray-400">AI in gaming by 2034</div>
</div>
</div>

<div class="mt-6 text-sm">

Sweden: **#1 game-producing per capita** · 900+ studios · Minecraft, Battlefield, Candy Crush, Paradox, Avalanche, Arrowhead — all Swedish.

</div>

</div>

<div>

<div class="text-sm font-bold text-gray-400 mb-4">COST COMPARISON (TESTED)</div>

<div class="space-y-3 text-sm">

<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
<div class="text-red-400 font-bold">Mocap Studio</div>
<div class="text-gray-400">$2,500/day + $4,000/actor + $20/sec cleanup</div>
</div>

<div class="bg-red-900/20 border border-red-500/20 rounded-lg p-3">
<div class="text-red-400 font-bold">Mocap Hardware</div>
<div class="text-gray-400">$2,500-$50,000 suit + $2,145/yr software</div>
</div>

<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
<div class="text-green-400 font-bold">ohao (tested on buildathon day)</div>
<div class="text-green-300">Text→animation: ~$0.002</div>
<div class="text-green-300">Video→mocap: ~$0.04</div>
<div class="text-green-400 font-bold mt-1">100,000x cheaper.</div>
</div>

</div>

</div>

</div>

---

# Business Model

<div class="grid grid-cols-3 gap-6 mt-6">

<div class="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
<div class="text-gray-400 text-sm font-bold mb-2">FREE</div>
<div class="text-3xl font-bold mb-2">$0</div>
<div class="text-sm text-gray-400">10 generations/mo</div>
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
<div class="text-sm text-gray-400">Bulk access, priority processing</div>
<div class="text-sm text-gray-400">SLA, private deploy</div>
</div>

</div>

<div class="mt-8 text-sm text-gray-500">
Cost per generation: fractions of a cent. Unit economics work at every tier. Target: 500K+ indie devs globally.
</div>

---

# What We Built Today

<div class="mt-2 mb-6 text-lg text-gray-400">One day. Three people. Fully working product.</div>

<div class="grid grid-cols-2 gap-8">

<div class="space-y-4">

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div class="text-lg"><strong>Text to animation</strong> — type a sentence, get a skeleton</div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div class="text-lg"><strong>Video to motion capture</strong> — upload a phone video, get pro animation</div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div class="text-lg"><strong>4 ways to use it</strong> — Web app, API, AI agent plugin, Blender plugin</div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div class="text-lg"><strong>Public gallery</strong> — 10+ animations generated and viewable in 3D</div>
</div>

<div class="flex items-center gap-3">
<div class="text-green-400 text-xl">✓</div>
<div class="text-lg"><strong>End-to-end tested</strong> — live right now at buildathon-bii.pages.dev</div>
</div>

</div>

<div class="flex flex-col items-center justify-center">

<div class="text-6xl font-bold text-green-400 mb-2">5</div>
<div class="text-xl text-gray-400 mb-6">distribution channels</div>

<div class="flex flex-wrap gap-2 justify-center">
<div class="px-4 py-2 rounded-full bg-gray-800 text-sm">Web App</div>
<div class="px-4 py-2 rounded-full bg-gray-800 text-sm">REST API</div>
<div class="px-4 py-2 rounded-full bg-gray-800 text-sm">AI Agents</div>
<div class="px-4 py-2 rounded-full bg-gray-800 text-sm">Blender</div>
<div class="px-4 py-2 rounded-full bg-gray-800 text-sm">Landing Page</div>
</div>

</div>

</div>

---
layout: center
class: text-center
---

# Live Demo

<div class="text-2xl text-gray-400 mb-8">
Let's generate an animation right now.
</div>

<div class="text-6xl mb-4">🎬</div>

<div class="text-sm opacity-50">switching to browser...</div>

<!--
1. Open chat → type "a person doing a victory dance" → 3s duration → Generate
2. While loading (~30s): "Open-source AI running in the cloud. Full-body skeleton from 5 words."
3. Skeleton starts dancing. LET THE AUDIENCE REACT. Don't talk over it.
4. "Industry-standard format. Import directly into Blender, Unity, Unreal."
5. Show Blender plugin: sidebar → Generate Motion → skeleton appears in viewport.
6. Show Gallery: past results, inline previews, download links.
-->

---

# The Bigger Picture

<div class="mt-6">

<div class="text-xl text-gray-400 mb-6">AI coding agents proved the model:</div>

<div class="text-2xl font-bold mb-8">
Give AI a hard problem + the right tools = <span class="text-blue-400">100x faster</span>.
</div>

<div class="text-lg mb-6">
Everyone is building chatbots. The real opportunity is <strong class="text-orange-400">compound creative problems</strong> — like 3D game production. Animation, rigging, modeling, music — each is a months-long bottleneck.
</div>

</div>

<div class="grid grid-cols-4 gap-3 mt-4">
<div class="bg-green-900/30 border border-green-500/30 rounded-lg p-3 text-center">
<div class="font-bold text-green-400 text-sm">Today</div>
<div class="text-xs text-gray-400 mt-1">Animation</div>
</div>
<div class="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-center">
<div class="font-bold text-blue-400 text-sm">Next</div>
<div class="text-xs text-gray-400 mt-1">Music · 3D · Rigging</div>
</div>
<div class="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3 text-center">
<div class="font-bold text-purple-400 text-sm">Future</div>
<div class="text-xs text-gray-400 mt-1">Full asset pipeline</div>
</div>
<div class="bg-orange-900/30 border border-orange-500/30 rounded-lg p-3 text-center">
<div class="font-bold text-orange-400 text-sm">Vision</div>
<div class="text-xs text-gray-400 mt-1">Anyone can make 3D games</div>
</div>
</div>

<div class="mt-6 text-xl font-bold">
We don't wait for AI to be perfect. <span class="text-green-400">We deliver what exists today.</span>
</div>

---
layout: center
class: text-center
---

# Thank You

<div class="text-2xl text-gray-400 mt-4 mb-8">Team ohao</div>

<div class="text-xl mb-8">
<em>"Most indie devs make 2D games — not by choice, but because 3D is too hard.<br>
We're here to change that."</em>
</div>

<div class="text-md mb-4">
Looking for: **beta users** · **game studio partnerships** · **API feedback**
</div>

<div class="text-sm opacity-40 mt-8">
buildathon-bii.pages.dev · Buildathon LiU 2026
</div>
