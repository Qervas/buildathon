const API_BASE = import.meta.env.VITE_API_URL || 'https://backend-production-b095.up.railway.app';

export interface Job {
  id: string;
  type: 'text2motion' | 'motion';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  result_url?: string;
  meta?: { frames: number; fps: number; gpu_seconds?: number };
  error?: string;
}

export async function generateText2Motion(
  prompt: string,
  duration: number,
): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/api/generate/text2motion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function generateMotion(
  videoFile: File,
): Promise<{ job_id: string }> {
  const form = new FormData();
  form.append('video', videoFile);
  const res = await fetch(`${API_BASE}/api/generate/motion`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function getMediaUrl(resultUrl: string): string {
  return `${API_BASE}${resultUrl}`;
}

export function pollJob(
  jobId: string,
  onUpdate: (job: Job) => void,
  intervalMs = 2000,
): () => void {
  const timer = setInterval(async () => {
    try {
      const job = await getJob(jobId);
      onUpdate(job);
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(timer);
      }
    } catch {
      // retry silently
    }
  }, intervalMs);
  return () => clearInterval(timer);
}

// ─── Sessions ────────────────────────────────────────

export interface SessionMessage {
  role: string;
  content: string;
  created_at: string | null;
  job?: {
    id: string;
    type: string;
    status: string;
    result_url: string | null;
    meta: { frames: number; fps: number; gpu_seconds?: number } | null;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  messages: SessionMessage[];
}

export async function createSession(): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/sessions`, { method: 'POST' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveMessage(
  sessionId: string,
  role: string,
  content: string,
  jobId?: string,
) {
  await fetch(`${API_BASE}/api/sessions/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, role, content, job_id: jobId || null }),
  });
}

export async function getSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/api/sessions`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function hideSession(sessionId: string) {
  await fetch(`${API_BASE}/api/sessions/${sessionId}/hide`, { method: 'PATCH' });
}
