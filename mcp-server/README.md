# @ohao/motion-mcp

MCP server for AI animation generation. Gives any AI coding agent (Claude Code, Cursor, Windsurf) the ability to generate skeletal animations from text descriptions.

## Tools

| Tool | Description |
|------|-------------|
| `generate_animation` | Text prompt → 77-joint SOMA BVH animation (NVIDIA Kimodo) |
| `list_animations` | Browse previously generated animations with download links |
| `get_animation_status` | Check status of a running generation job |

## Setup

### Claude Code

Add to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "mcpServers": {
    "ohao-motion": {
      "command": "npx",
      "args": ["-y", "@ohao/motion-mcp"]
    }
  }
}
```

### From source (this repo)

```bash
cd mcp-server
npm install && npm run build
```

Then add to settings:

```json
{
  "mcpServers": {
    "ohao-motion": {
      "command": "node",
      "args": ["/path/to/buildathon/mcp-server/dist/index.js"]
    }
  }
}
```

## Usage

Once configured, your AI agent can:

```
> Generate a walking animation for my game character

Agent calls generate_animation("character walking forward casually", 4)
→ Returns BVH download URL (77-joint skeleton, 30fps)

> Show me what animations we've made so far

Agent calls list_animations()
→ Returns gallery of past generations with download links
```

## Example output

```
Animation generated successfully.

- Prompt: a person doing a victory dance
- Duration: 4s
- Frames: 120
- FPS: 30
- GPU time: 4.2s
- Format: BVH (77-joint SOMA skeleton)

Download: https://backend-production-b095.up.railway.app/api/media/outputs/.../animation.bvh
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `OHAO_API_URL` | `https://backend-production-b095.up.railway.app` | Backend API URL |
