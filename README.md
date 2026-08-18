# golem-security-mcp

MCP server that gives your coding agent direct access to [Golem](https://usegolem.ai) security audit findings — vulnerabilities, evidence, and recommended fixes — so it can patch your code automatically.

## Setup

### 1. Get your API key

Go to **usegolem.ai → Profile → API Keys** and create a key (`golem_sk_...`).

### 2. Paste this into your agent

Copy the prompt below, replace `YOUR_API_KEY` with your key, and paste it directly into your AI agent (Claude Code, Cursor, Windsurf, Codex, VS Code, etc.):

---

Install the Golem Security MCP server so it's available to you as a tool.

Detect which AI agent/tool you are (Claude Code, Cursor, Windsurf, Codex, VS Code, etc.) and apply the correct installation method:

---

**Claude Code:**
Run this command:
```
claude mcp add golem-security --scope user -e GOLEM_API_KEY=YOUR_API_KEY -- npx -y github:UseGolem/usegolem-mcp
```

---

**Cursor:**
Create or update `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project root) with:
```json
{
  "mcpServers": {
    "golem-security": {
      "command": "npx",
      "args": ["-y", "github:UseGolem/usegolem-mcp"],
      "env": {
        "GOLEM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

**Windsurf:**
Create or update `~/.codeium/windsurf/mcp_config.json` with:
```json
{
  "mcpServers": {
    "golem-security": {
      "command": "npx",
      "args": ["-y", "github:UseGolem/usegolem-mcp"],
      "env": {
        "GOLEM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

**OpenAI Codex:**
Create or update `~/.codex/config.json` with:
```json
{
  "mcpServers": {
    "golem-security": {
      "command": "npx",
      "args": ["-y", "github:UseGolem/usegolem-mcp"],
      "env": {
        "GOLEM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

**VS Code (Copilot):**
Create or update `.vscode/mcp.json` in the workspace with:
```json
{
  "servers": {
    "golem-security": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:UseGolem/usegolem-mcp"],
      "env": {
        "GOLEM_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

After writing the config, restart your agent so it picks up the `golem-security` tools.

## Tools

- **`list_workspaces`** — list all workspaces on your Golem account (IDs, names, domains).
- **`list_audits`** — list all security audits across workspaces, newest first, with status, score (A+→F), and finding counts.
- **`get_findings`** — get findings from an audit (defaults to the most recent completed one), filterable by severity and category. Each finding includes title, severity, description, evidence, and the recommended fix.
- **`get_audit_report`** — fetch the full Markdown report for a completed audit.

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `GOLEM_API_KEY` | yes | Your API key (`golem_sk_...`). |
| `GOLEM_API_URL` | no | API base URL. Defaults to `https://buildapi.300mil.com`. |


## One-line installer

```bash
curl -fsSL https://raw.githubusercontent.com/UseGolem/usegolem-mcp/main/install.sh | bash
```

Detects Claude Code, Cursor, VS Code, and Windsurf, downloads the server, and writes the MCP config for you.
