# ohao — Pitch Opener (30s video) + Post-Pitch Full Video (90s)

---

## VIDEO 1: Pitch Opener (30 seconds)

> **Purpose:** Opens the 7-minute pitch. Sets the mood, then you take over live.
> **Plays before you speak a single word.**

### Clip 1 (10s) — The Beautiful Problem

**Grok prompt:**
> Cinematic slow dolly through a stunning fantasy game world, volumetric god rays, floating particles. But every 3D character is frozen in T-pose, completely lifeless. Camera glides past them. Unreal Engine 5 quality. Melancholic. 16:9.

**Text overlay:**
- 0:00 — *"$205 billion industry."*
- 0:05 — *"Every world needs characters that move."*

### Clip 2 (10s) — The Cost Wall, extend from Clip 1

**Grok prompt:**
> Camera pushes into a close-up of a frozen T-pose warrior character, beautiful armor but lifeless. Then dissolve to a lone indie developer at their desk late at night, face lit by monitor showing the frozen character. Frustrated. Cinematic. 16:9.

**Text overlay:**
- 0:10 — *"Motion capture: $2,500 / day."*
- 0:15 — *"Most indie devs make 2D games."*

### Clip 3 (6s) — The Question

**Grok prompt:**
> Dark cinematic shot slowly pulling back from the indie developer's screen. The room goes darker. Atmospheric, tense, quiet moment before something changes. 16:9.

**Text overlay:**
- 0:20 — *"Not by choice."*
- 0:23 — Black screen
- 0:24 — *"What if it cost $0.002?"*

### End (4s) — Transition to live

- 0:26 — Black screen
- 0:27 — *"ohao"* fades in
- 0:28 — *"Let us show you."*
- 0:30 — You start talking. Switch to slides / live demo.

**Grok clips needed: 3 (10s + 10s extend + 6s extend) = one chained generation**

---

## PITCH FLOW (7 minutes total)

| Time | What | Notes |
|------|------|-------|
| 0:00-0:30 | **Play video opener** | Lights down, let it play, don't talk over it |
| 0:30-1:30 | **"Hi, we're ohao"** + Solution slide | "What you just saw is the problem. Here's what we built." |
| 1:30-3:30 | **Live Demo** | Type prompt → skeleton dances → show Blender → show MCP |
| 3:30-4:30 | **Market slide** | $205B game industry, cost comparison chart, 150,000x cheaper |
| 4:30-5:15 | **Access pyramid + indie stats** | "55% solo, 50% self-funded. We open the gate." |
| 5:15-5:45 | **Moat + ecosystem** | Cloudflare analogy. MCP + A2A + Blender. |
| 5:45-6:15 | **Business model** | $29/mo Pro, 96.5% margin |
| 6:15-6:45 | **Our duty** | "We don't wait for AI to be perfect. We deliver what exists." |
| 6:45-7:00 | **Thank you** | "Most indie devs make 2D games not by choice. We change that." |

---

## VIDEO 2: Full Commercial (90s) — Post-pitch / landing page / social

> **Purpose:** Shareable after the buildathon. Embed on landing page. Post on X/LinkedIn.
> **Standalone — includes the product demo.**

### Scene 1: The Problem (0:00-0:24) — reuse pitch opener clips

Same 3 Grok clips from the pitch opener above (Clips 1, 2, 3).

### Scene 2: The Reveal (0:24-0:28)

Black screen → *"What if it cost $0.002?"* → cut to product

### Scene 3: The Product (0:28-0:50) — screen recording

| Time | What to record | Text overlay |
|------|---------------|--------------|
| 0:28-0:32 | Chat UI, type: "a person doing a victory dance" | *"Type a sentence."* |
| 0:32-0:36 | Loading bar: "Generating on GPU..." | *"30 seconds."* |
| 0:36-0:42 | BVH viewer — skeleton dances, orbit camera | *"Get a skeleton animation."* |
| 0:42-0:45 | Blender sidebar → skeleton in viewport | *"In Blender."* |
| 0:45-0:47 | Terminal: MCP tool call | *"In your AI agent."* |
| 0:47-0:50 | Gallery: past animations with previews | *"Every result saved."* |

### Scene 4: The Vision (0:50-1:10) — 3 new Grok clips

**Clip 4a (10s):**
> Fast-paced cinematic montage of video game characters with fluid professional animation: fantasy knight sword combo, ninja acrobatic flips, zombie lurching realistically. Dynamic cameras, AAA quality, vibrant. 16:9.

**Clip 4b (6s) — extend from 4a:**
> Continue montage: sports slam dunk with full body physics, dance game choreography, horror monster crawling on ceiling. All incredibly fluid animation. 16:9.

**Clip 4c (6s):**
> Young game developer leaning back in chair, smiling with pride. Monitor shows a beautiful 3D game with animated characters. Small bedroom, warm golden light. Genuine accomplishment. 16:9.

**Text overlays:**
- 0:50 — *"Games that couldn't exist before."*
- 0:58 — *"Now they can."*
- 1:04 — *"Not just for AAA studios. For everyone."*

### Scene 5: The Brand (1:10-1:30)

**Clip 5 (6s):**
> Abstract particles of golden light converging in dark space. Premium, elegant, minimal. 16:9.

**Then text in editor:**
- 1:16 — **ohao** fades in large
- 1:19 — *"Type a sentence. Get a skeleton animation."*
- 1:22 — *"buildathon-bii.pages.dev"*
- 1:26 — *"$0.002 per animation. 77 joints. 30 fps."*

---

## Production Summary

### For the pitch opener (30s) — do this FIRST
- 1 chained Grok generation (10s → extend 10s → extend 6s)
- Add text overlays + "ohao / Let us show you" ending in editor
- **~15 min to produce**

### For the full commercial (90s) — do this after
- Reuse pitch opener clips (scenes 1-2)
- Record screen (1 take, ~22s)
- 3 more Grok clips for vision scene
- 1 Grok clip for brand
- Stitch + overlays in editor
- **~45 min to produce**

### Total Grok generations: 7 clips
| Clip | Duration | What |
|------|----------|------|
| 1 | 10s | Frozen T-pose world |
| 2 | 10s | Extend → frozen warrior → indie dev |
| 3 | 6s | Extend → dev's dark room, tension |
| 4a | 10s | Game montage: knight, ninja, zombie |
| 4b | 6s | Extend → sports, dance, horror |
| 4c | 6s | Happy dev with finished game |
| 5 | 6s | Abstract particles brand reveal |

**Priority: Generate clips 1-3 first (pitch opener). The rest is bonus.**
