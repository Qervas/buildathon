# Frontend Developer Guide

> **Stack:** React + Vite + TypeScript + Three.js + Tailwind CSS
> **Deploy:** Cloudflare Pages (auto-deploys `public/` on push to `main`)
> **Live URL:** https://buildathon-bii.pages.dev

---

## Quick Start

```bash
git clone https://github.com/Qervas/buildathon.git
cd buildathon

# Scaffold the frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install three @types/three tailwindcss @tailwindcss/vite
npm run dev
```

---

## Architecture

```
┌──────────────────────────────────────┐
│         Frontend (React)              │
│                                       │
│  TextToMotion.tsx  ─► POST /generate  │
│  VideoUpload.tsx   ─► POST /generate  │
│  JobPoller.tsx     ─► GET /jobs/{id}  │
│  BVHViewer.tsx     ─► GET /media/{k}  │
│                                       │
│  Poll every 2s until job completes    │
│  Then load BVH into Three.js viewer   │
└──────────────────────────────────────┘
         │
         ▼
   Railway Backend API
```

---

## Project Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api.ts                    # All API calls
│   ├── components/
│   │   ├── TextToMotion.tsx      # Text prompt form
│   │   ├── VideoUpload.tsx       # Video file upload
│   │   ├── BVHViewer.tsx         # 3D skeleton viewer (THREE.js)
│   │   ├── JobStatus.tsx         # Loading spinner + progress
│   │   └── ResultCard.tsx        # Shows result + download + viewer
│   └── styles/
│       └── globals.css
```

---

## API Client (api.ts)

The backend URL will be the Railway service URL. For local dev, use `http://localhost:8000`.

```typescript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Types ───────────────────────────────────────────

interface Job {
  id: string;
  type: "text2motion" | "motion";
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  result_url?: string;  // "/api/media/outputs/.../animation.bvh"
  meta?: { frames: number; fps: number; gpu_seconds?: number };
  error?: string;
}

// ─── API Calls ───────────────────────────────────────

export async function generateText2Motion(prompt: string, duration: number): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/api/generate/text2motion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, duration }),
  });
  return res.json();
}

export async function generateMotion(videoFile: File): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append("video", videoFile);
  const res = await fetch(`${API_BASE}/api/generate/motion`, {
    method: "POST",
    body: form,
  });
  return res.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  return res.json();
}

export function getMediaUrl(resultUrl: string): string {
  return `${API_BASE}${resultUrl}`;
}

// ─── Polling Helper ──────────────────────────────────

export function pollJob(jobId: string, onUpdate: (job: Job) => void, intervalMs = 2000): () => void {
  const timer = setInterval(async () => {
    const job = await getJob(jobId);
    onUpdate(job);
    if (job.status === "completed" || job.status === "failed") {
      clearInterval(timer);
    }
  }, intervalMs);
  return () => clearInterval(timer); // cleanup function
}
```

---

## Components

### TextToMotion.tsx — The Main Input

```tsx
import { useState } from "react";
import { generateText2Motion, pollJob, getMediaUrl, type Job } from "../api";
import BVHViewer from "./BVHViewer";

export default function TextToMotion() {
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState(3);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setJob(null);
    const { job_id } = await generateText2Motion(prompt, duration);
    pollJob(job_id, (updatedJob) => {
      setJob(updatedJob);
      if (updatedJob.status === "completed" || updatedJob.status === "failed") {
        setLoading(false);
      }
    });
  };

  return (
    <div>
      <h2>Text to Motion</h2>
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="a person walking forward confidently"
      />
      <input
        type="range" min={1} max={10} value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
      />
      <span>{duration}s</span>
      <button onClick={handleSubmit} disabled={loading || !prompt}>
        {loading ? "Generating..." : "Generate"}
      </button>

      {job?.status === "processing" && <p>Processing on GPU... (~30-60s)</p>}
      {job?.status === "failed" && <p>Error: {job.error}</p>}
      {job?.status === "completed" && job.result_url && (
        <div>
          <p>{job.meta?.frames} frames @ {job.meta?.fps}fps</p>
          <BVHViewer url={getMediaUrl(job.result_url)} />
          <a href={getMediaUrl(job.result_url)} download="animation.bvh">
            Download BVH
          </a>
        </div>
      )}
    </div>
  );
}
```

### BVHViewer.tsx — The Showpiece

This is the most important visual component. Uses Three.js to render the skeleton animation.

**Reference implementation:** `~/Desktop/Github/niua/frontend/src/components/common/BVHViewer.tsx`
You can port from there, or build a simplified version:

```tsx
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { BVHLoader } from "three/examples/jsm/loaders/BVHLoader.js";

interface Props {
  url: string;
}

export default function BVHViewer({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = 400;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 150, 300);
    camera.lookAt(0, 100, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0x404040));
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 1, 1);
    scene.add(directional);

    // Grid
    scene.add(new THREE.GridHelper(400, 20, 0x333333, 0x222222));

    // Load BVH
    const loader = new BVHLoader();
    let mixer: THREE.AnimationMixer | null = null;
    const clock = new THREE.Clock();

    loader.load(url, (result) => {
      // Create skeleton helper
      const skeletonHelper = new THREE.SkeletonHelper(result.skeleton.bones[0]);
      (skeletonHelper.material as THREE.LineBasicMaterial).linewidth = 2;
      scene.add(result.skeleton.bones[0]);
      scene.add(skeletonHelper);

      // Play animation
      mixer = new THREE.AnimationMixer(result.skeleton.bones[0]);
      const action = mixer.clipAction(result.clip);
      action.play();
    });

    // Animate
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (mixer) mixer.update(clock.getDelta());
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [url]);

  return <div ref={containerRef} style={{ width: "100%", borderRadius: 8, overflow: "hidden" }} />;
}
```

**Nice-to-haves (if time):**
- Play/pause button
- Frame scrubber (timeline slider)
- Orbit controls (rotate camera by dragging)
- Frame counter display

For orbit controls, add:
```tsx
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// after creating camera + renderer:
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 100, 0);
controls.update();
```

### VideoUpload.tsx

```tsx
import { useState, useRef } from "react";
import { generateMotion, pollJob, getMediaUrl, type Job } from "../api";
import BVHViewer from "./BVHViewer";

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setJob(null);
    const { job_id } = await generateMotion(file);
    pollJob(job_id, (updatedJob) => {
      setJob(updatedJob);
      if (updatedJob.status === "completed" || updatedJob.status === "failed") {
        setLoading(false);
      }
    });
  };

  return (
    <div>
      <h2>Video → Motion Capture</h2>
      <input ref={inputRef} type="file" accept="video/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Extracting motion..." : "Extract Motion"}
      </button>

      {job?.status === "processing" && <p>Processing on GPU... (~60-120s)</p>}
      {job?.status === "failed" && <p>Error: {job.error}</p>}
      {job?.status === "completed" && job.result_url && (
        <div>
          <p>{job.meta?.frames} frames @ {job.meta?.fps}fps</p>
          <BVHViewer url={getMediaUrl(job.result_url)} />
          <a href={getMediaUrl(job.result_url)} download="animation.bvh">
            Download BVH
          </a>
        </div>
      )}
    </div>
  );
}
```

---

## App.tsx — Wire It Together

```tsx
import TextToMotion from "./components/TextToMotion";
import VideoUpload from "./components/VideoUpload";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">Buildathon</h1>
      <p className="text-gray-400 mb-8">AI Animation Generation</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TextToMotion />
        <VideoUpload />
      </div>
    </div>
  );
}
```

---

## Vite Config

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../public", // builds into public/ for CF Pages deploy
  },
  server: {
    proxy: {
      "/api": "http://localhost:8000", // proxy to local backend
    },
  },
});
```

**Important:** `outDir: "../public"` — the build output goes to `public/` at the repo root, which is what the GitHub Action deploys to Cloudflare Pages.

---

## Deploy

The GitHub Action already deploys `public/` to Cloudflare Pages on push.

For production, the frontend needs to know the backend URL. Set `VITE_API_URL` in the build step:

```bash
VITE_API_URL=https://your-backend.up.railway.app npm run build
```

Or update the GitHub Action to include this env var.

---

## BVH Format Reference

The BVH files from our API contain **SOMA skeleton** data:
- **77-78 joints** (full humanoid: hips, spine, chest, head, arms, legs, hands, feet)
- **Hierarchy:** Root → Hips → Spine chain → Limbs
- **Channels:** 6 per root (pos + rot), 3 per joint (rotation only)
- **FPS:** 30 (text2motion), configurable (motion capture)
- Three.js `BVHLoader` handles all of this automatically

---

## Priority Order

1. **Scaffold** — Vite + React + Tailwind + Three.js installed
2. **TextToMotion form** — prompt input + submit + API call
3. **BVH Viewer** — Three.js skeleton rendering (THE DEMO MOMENT)
4. **Job polling** — loading state while GPU runs
5. **VideoUpload** — video file upload flow
6. **Polish** — design, animations, error states, download buttons

Get steps 1-4 working first. That's the complete demo.

---

## Design Notes

- Keep it dark theme (bg-gray-950) — the 3D viewer looks best on dark backgrounds
- The BVH viewer IS the product — make it big and central, not tucked away
- Show the prompt that generated the animation alongside the viewer
- Loading state should show a skeleton animation or pulse, not just a spinner — the wait is 30-60 seconds
- Mobile doesn't matter for the demo, focus on desktop

---

## Testing Without Backend

You can test the BVH viewer independently using any BVH file:

```tsx
// Hardcode a test URL to verify the viewer works
<BVHViewer url="https://threejs.org/examples/models/bvh/pirouette.bvh" />
```

This loads a sample BVH from the Three.js examples. Once the viewer works, swap in the real API URL.
