# Buildathon API 接口协议文档

**Base URL：** `http://localhost:8000`（本地）/ 生产地址待补充  
**数据格式：** JSON  
**文档版本：** v1.0 · 2026-04-12

---

## 目录

1. [通用说明](#通用说明)
2. [接口列表](#接口列表)
   - [健康检查](#1-健康检查)
   - [文本生成动作](#2-文本生成动作-text2motion)
   - [视频动作捕捉](#3-视频动作捕捉-motion-capture)
   - [查询任务状态](#4-查询任务状态)
   - [获取媒体文件](#5-获取媒体文件)
3. [任务状态流转](#任务状态流转)
4. [错误码](#错误码)
5. [前端接入示例](#前端接入示例)

---

## 通用说明

### 异步任务模型

所有生成接口（`/api/generate/*`）均为**异步**接口：

1. 前端发送生成请求，后端立即返回 `job_id`
2. 前端通过 `GET /api/jobs/{job_id}` **轮询**任务状态
3. 状态变为 `completed` 时，响应中包含 `result_url`，前端访问该 URL 获取文件

```
前端                    后端                    Modal GPU
 │                       │                        │
 │── POST /generate ────>│                        │
 │<── { job_id } ────────│── 调用 Modal ─────────>│
 │                       │                        │ (异步处理)
 │── GET /jobs/{id} ────>│                        │
 │<── { status: "processing" } ──────────────────│
 │                       │<── webhook 回调 ────────│
 │── GET /jobs/{id} ────>│                        │
 │<── { status: "completed", result_url }         │
 │── GET /media/... ─────────────────────────────>│ R2 存储
 │<── 302 重定向到预签名 URL ────────────────────  │
```

---

## 接口列表

### 1. 健康检查

```
GET /
```

**响应示例**

```json
{
  "status": "Backend is running"
}
```

---

### 2. 文本生成动作 (Text2Motion)

```
POST /api/generate/text2motion
Content-Type: application/json
```

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | ✅ | 动作描述，英文效果更佳 |
| `duration` | float | ✅ | 动作时长，单位：秒（建议 2.0 ~ 10.0） |

**请求示例**

```json
{
  "prompt": "a person walking forward and waving",
  "duration": 4.0
}
```

**响应示例**

```json
{
  "job_id": "9167bf0a-c926-40cb-a69e-073efdaf879f"
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `job_id` | string (UUID) | 用于后续轮询任务状态 |

---

### 3. 视频动作捕捉 (Motion Capture)

```
POST /api/generate/motion
Content-Type: multipart/form-data
```

**请求体（form-data）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `video` | file | ✅ | 视频文件，支持 `.mp4`、`.mov` 等格式 |

**请求示例（fetch）**

```js
const formData = new FormData();
formData.append('video', file); // File 对象

const res = await fetch('/api/generate/motion', {
  method: 'POST',
  body: formData,
});
```

**响应示例**

```json
{
  "job_id": "3a2f1b8c-4d5e-6f7a-8b9c-0d1e2f3a4b5c"
}
```

---

### 4. 查询任务状态

```
GET /api/jobs/{job_id}
```

**路径参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| `job_id` | string (UUID) | 生成接口返回的任务 ID |

**响应字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务 ID |
| `type` | string | 任务类型：`text2motion` / `motion` |
| `status` | string | 状态：见[状态流转](#任务状态流转) |
| `created_at` | string (ISO 8601) | 创建时间 |
| `result_url` | string | 结果文件路径（仅 `completed` 时存在） |
| `meta` | object | 元数据（仅 `completed` 时存在） |
| `error` | string | 错误信息（仅 `failed` 时存在） |

**响应示例 — 处理中**

```json
{
  "id": "9167bf0a-c926-40cb-a69e-073efdaf879f",
  "type": "text2motion",
  "status": "processing",
  "created_at": "2026-04-12T15:13:32.922749"
}
```

**响应示例 — 完成**

```json
{
  "id": "9167bf0a-c926-40cb-a69e-073efdaf879f",
  "type": "text2motion",
  "status": "completed",
  "created_at": "2026-04-12T15:13:32.922749",
  "result_url": "/api/media/outputs/9167bf0a-c926-40cb-a69e-073efdaf879f/animation.bvh",
  "meta": {
    "frames": 90,
    "fps": 30
  }
}
```

**响应示例 — 失败**

```json
{
  "id": "9167bf0a-c926-40cb-a69e-073efdaf879f",
  "type": "text2motion",
  "status": "failed",
  "created_at": "2026-04-12T15:13:32.922749",
  "error": "Model inference timeout"
}
```

---

### 5. 获取媒体文件

```
GET /api/media/{key}
```

后端返回 **307 重定向**，指向 Cloudflare R2 预签名 URL，有效期 **1 小时**。

前端直接将 `result_url` 的值拼上 Base URL 访问即可，浏览器会自动跟随重定向下载文件。

**示例**

```
GET /api/media/outputs/9167bf0a-.../animation.bvh
↓ 307 Redirect
https://xxx.r2.cloudflarestorage.com/buildathon/outputs/.../animation.bvh?X-Amz-...
```

**输出文件格式**

| 任务类型 | 文件格式 | 说明 |
|----------|----------|------|
| `text2motion` | `.bvh` | BVH 骨骼动画格式 |
| `motion` | `.bvh` | BVH 骨骼动画格式 |

---

## 任务状态流转

```
pending ──> processing ──> completed
                      └──> failed
```

| 状态 | 说明 |
|------|------|
| `pending` | 任务已创建，等待处理 |
| `processing` | GPU 正在处理中 |
| `completed` | 处理完成，可获取结果 |
| `failed` | 处理失败，见 `error` 字段 |

**推荐轮询策略：** 每 **3 秒**查询一次，超过 **3 分钟**未完成可提示用户超时。

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| `200` | 成功 |
| `307` | 重定向（媒体文件接口正常行为） |
| `400` | 请求参数错误 |
| `403` | 鉴权失败 |
| `404` | 任务不存在 |
| `422` | 请求体格式错误（字段缺失或类型错误） |
| `500` | 服务器内部错误 |

---

## 前端接入示例

完整的文本生成动作流程（TypeScript）：

```typescript
const BASE_URL = 'http://localhost:8000';

async function generateMotion(prompt: string, duration: number): Promise<string> {
  // 1. 发起生成请求
  const res = await fetch(`${BASE_URL}/api/generate/text2motion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, duration }),
  });
  const { job_id } = await res.json();

  // 2. 轮询任务状态
  const resultUrl = await pollJob(job_id);
  return resultUrl;
}

async function pollJob(jobId: string, intervalMs = 3000, timeoutMs = 180000): Promise<string> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${BASE_URL}/api/jobs/${jobId}`);
    const job = await res.json();

    if (job.status === 'completed') {
      return `${BASE_URL}${job.result_url}`;
    }
    if (job.status === 'failed') {
      throw new Error(job.error ?? 'Job failed');
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error('Job polling timeout');
}

// 使用示例
const bvhUrl = await generateMotion('a person jumping', 3.0);
// bvhUrl 可直接用于下载或传给 Three.js BVH Loader
```
