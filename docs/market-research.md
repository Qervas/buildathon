# Market Research — ohao Motion

## The Opportunity

### Game Industry = $205B (2026)
- Global game software revenue: **$205B** projected 2026 (Newzoo)
- Including hardware: **$386B** (12.5% CAGR)
- Mobile is 52% (~$107B)

### Motion Capture Market = $486M → $1.67B by 2035
- Current market: **$286M-$486M** (2025)
- Growing at **12-15% CAGR**
- Entertainment/gaming is **34.5%** of the market (largest segment)

### AI in Gaming = $4.4B → $37.9B by 2034
- Current: **$4.4B-$7.1B** (2025)
- Projected: **$37.9B-$81.2B** by 2034-2035
- **CAGR: 20-40%**
- 1 in 3 game developers already using generative AI in production

---

## The Pain Point: Animation is Expensive

### Professional Motion Capture Costs
| Item | Cost |
|------|------|
| Studio rental | $1,500-$2,500/day |
| Actor setup + mapping | ~$4,000/person |
| Data retargeting | $18-$20/second of animation |
| Prosumer suit (Rokoko) | $2,500-$6,000 |
| Pro optical system | $20,000-$50,000+ |
| Software (MotionBuilder) | $2,145/year/seat |

### Per-Game Animation Budgets
- AAA animation budget: **$500K-$1.5M** per game
- Single rigged animation cycle: starts at **$150**
- Full AAA art production: 25-30% of total budget ($180M-$650M games)

### Our Cost (tested on Modal A10 @ $0.000306/sec)
| Our Service | GPU Time | Cost | Traditional Cost | Savings |
|-------------|----------|------|-----------------|---------|
| Text-to-motion (1 animation) | ~5s | **~$0.002** | $150+ | **75,000x cheaper** |
| Video motion capture (1 clip) | ~120s | **~$0.04** | $2,500/day | **62,500x cheaper** |
| 500 text animations | ~2,500s | **~$1.00** | $75,000+ | **75,000x cheaper** |

---

## Target Market: Indie Developers

### Why Indie?
- **55% are solo devs** — can't afford motion capture studios
- **50% are entirely self-funded** — price-sensitive
- Unity + Unreal each at **32% market share** — our BVH imports into both
- **70% failure rate** — anything that reduces production time helps survival
- **40% burnout rate** — automation reduces crunch
- Scope creep adds 4 months to 60% of projects

### Market Size
- Estimated 500K-1M active indie developers globally
- Average willing-to-pay for tools: $10-50/month
- **TAM for indie animation tools: $60M-$600M/year**

---

## Competitive Landscape

### Existing Solutions
| Solution | Price | Quality | Speed | Our Advantage |
|----------|-------|---------|-------|---------------|
| Mocap studio | $2,500/day | Excellent | Hours | We're $0.001/animation |
| Rokoko suit | $2,500 upfront | Good | Real-time | No hardware needed |
| Mixamo (Adobe) | Free | Limited library | Instant | We generate custom motions |
| Plask AI | $19/mo | Good | Minutes | We're open-source models, more customizable |
| Asset store packs | $10-100 | Generic | Instant | We generate exactly what you describe |

### Our Differentiation
1. **Text-to-motion** — no other tool lets you type a sentence and get a custom animation
2. **Video mocap without hardware** — phone camera → professional BVH
3. **API-first** — integrate anywhere (MCP, Blender, Unity, direct API)
4. **Open-source models** — NVIDIA Kimodo + GEM-X, no vendor lock-in
5. **$0.001 per generation** — 150,000x cheaper than traditional

---

## Business Model

### Pricing (proposed)
| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | 10 generations/month |
| Pro | $29/month | Unlimited text-to-motion, 100 video captures |
| Studio | $99/month | Unlimited everything, priority GPU, API access |
| Enterprise | Custom | SLA, private deployment, dedicated GPU |

### Unit Economics (tested, Modal A10 @ $1.10/hr)
- Cost per text-to-motion: **~$0.002** (avg 5s GPU)
- Cost per video mocap: **~$0.04** (avg 120s GPU)
- At $29/mo Pro with 500 text generations: cost ~$1.00, margin **96.5%**
- At $99/mo Studio with unlimited: break-even at ~2,700 text gens or ~170 video mocaps

---

## Sweden Angle

- Sweden: **#1 game-producing country per capita**
- **€1.8B+ revenue**, **900+ studios**, **8,000-12,000 employees**
- Minecraft, Battlefield, Candy Crush, Paradox, Avalanche, Arrowhead — all Swedish
- LiU has game dev programs feeding into the industry
- Our first market: Swedish indie studios → expand globally
