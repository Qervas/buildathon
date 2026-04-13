#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.OHAO_API_URL || "https://backend-production-b095.up.railway.app";

// ── API Helpers ─────────────────────────────────────

async function apiPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

interface Job {
  id: string;
  status: string;
  result_url?: string;
  meta?: { frames: number; fps: number; gpu_seconds?: number };
  error?: string;
}

async function pollUntilDone(jobId: string, timeoutMs = 180_000): Promise<Job> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = (await apiGet(`/api/jobs/${jobId}`)) as Job;
    if (job.status === "completed" || job.status === "failed") return job;
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

// ── MCP Server ──────────────────────────────────────

const server = new McpServer({
  name: "ohao-motion",
  version: "0.1.0",
});

server.tool(
  "generate_animation",
  "Generate a skeletal animation from a text description. Returns a BVH file URL with 77-joint SOMA skeleton at 30fps. Powered by NVIDIA Kimodo.",
  {
    prompt: z.string().describe("Motion description, e.g. 'a person doing a victory dance'"),
    duration: z.number().min(1).max(10).default(4).describe("Animation duration in seconds (1-10)"),
  },
  async ({ prompt, duration }) => {
    const { job_id } = (await apiPost("/api/generate/text2motion", { prompt, duration })) as { job_id: string };

    const job = await pollUntilDone(job_id);

    if (job.status === "failed") {
      return {
        content: [{ type: "text" as const, text: `Animation generation failed: ${job.error}` }],
        isError: true,
      };
    }

    const downloadUrl = `${API_BASE}${job.result_url}`;
    const meta = job.meta;
    const summary = [
      `Animation generated successfully.`,
      ``,
      `- **Prompt:** ${prompt}`,
      `- **Duration:** ${duration}s`,
      `- **Frames:** ${meta?.frames ?? "unknown"}`,
      `- **FPS:** ${meta?.fps ?? 30}`,
      `- **GPU time:** ${meta?.gpu_seconds ?? "unknown"}s`,
      `- **Format:** BVH (77-joint SOMA skeleton)`,
      ``,
      `**Download:** ${downloadUrl}`,
      ``,
      `Import into Blender, Unity, or Unreal Engine. The BVH uses centimeter scale (SOMA standard).`,
    ].join("\n");

    return { content: [{ type: "text" as const, text: summary }] };
  },
);

server.tool(
  "list_animations",
  "List previously generated animations from the gallery. Returns completed sessions with download links. Use this to check past results without re-generating.",
  {},
  async () => {
    const sessions = (await apiGet("/api/sessions")) as Array<{
      id: string;
      title: string;
      created_at: string;
      messages: Array<{
        role: string;
        content: string;
        job?: { id: string; status: string; result_url: string | null; meta: { frames: number; fps: number } | null };
      }>;
    }>;

    if (!sessions.length) {
      return { content: [{ type: "text" as const, text: "No animations generated yet." }] };
    }

    const lines: string[] = ["# Generated Animations\n"];
    for (const s of sessions) {
      lines.push(`## ${s.title}`);
      lines.push(`Created: ${new Date(s.created_at).toLocaleString()}\n`);
      for (const msg of s.messages) {
        if (msg.job?.status === "completed" && msg.job.result_url) {
          lines.push(`- **${msg.content}**`);
          if (msg.job.meta) {
            lines.push(`  ${msg.job.meta.frames} frames @ ${msg.job.meta.fps}fps`);
          }
          lines.push(`  Download: ${API_BASE}${msg.job.result_url}`);
        }
      }
      lines.push("");
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
);

server.tool(
  "get_animation_status",
  "Check the status of a running animation generation job. Use this if generate_animation timed out or you want to check a job later.",
  {
    job_id: z.string().describe("The job ID returned by generate_animation"),
  },
  async ({ job_id }) => {
    const job = (await apiGet(`/api/jobs/${job_id}`)) as Job;
    const lines = [
      `Job: ${job.id}`,
      `Status: ${job.status}`,
    ];
    if (job.status === "completed" && job.result_url) {
      lines.push(`Download: ${API_BASE}${job.result_url}`);
      if (job.meta) {
        lines.push(`Frames: ${job.meta.frames}, FPS: ${job.meta.fps}`);
      }
    }
    if (job.status === "failed") {
      lines.push(`Error: ${job.error}`);
    }
    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  },
);

// ── Start ───────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
