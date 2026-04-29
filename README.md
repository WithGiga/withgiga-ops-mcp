# withgiga-ops-mcp

MCP server that gives your coding agent direct access to [GigaCode](https://withgiga.ai) security audit findings — vulnerabilities, evidence, and recommended fixes — so it can patch your code automatically.

## Setup

### 1. Get your API key

Go to **withgiga.ai → Profile → API Keys** and create a key (`giga_sk_...`).

### 2. Paste this into your agent

Copy the prompt below, replace `YOUR_API_KEY` with your key, and paste it directly into your AI agent (Claude Code, Cursor, Windsurf, Codex, VS Code, etc.):

---

Install the Giga Security MCP server so it's available to you as a tool.

Detect which AI agent/tool you are (Claude Code, Cursor, Windsurf, Codex, VS Code, etc.) and apply the correct installation method:

---

**Claude Code:**
Run this command:
```
claude mcp add giga-security --scope user -e GIGA_API_KEY=YOUR_API_KEY -- npx -y github:WithGiga/withgiga-ops-mcp
```

---

**Cursor:**
Create or update `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project root) with:
```json
{
  "mcpServers": {
    "giga-security": {
      "command": "npx",
      "args": ["-y", "github:WithGiga/withgiga-ops-mcp"],
      "env": {
        "GIGA_API_KEY": "YOUR_API_KEY"
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
    "giga-security": {
      "command": "npx",
      "args": ["-y", "github:WithGiga/withgiga-ops-mcp"],
      "env": {
        "GIGA_API_KEY": "YOUR_API_KEY"
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
    "giga-security": {
      "command": "npx",
      "args": ["-y", "github:WithGiga/withgiga-ops-mcp"],
      "env": {
        "GIGA_API_KEY": "YOUR_API_KEY"
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
    "giga-security": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "github:WithGiga/withgiga-ops-mcp"],
      "env": {
        "GIGA_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

---

After writing the config, confirm the installation was successful and that the giga-security MCP server is recognized and available.

---

## Tools

Everything resolves automatically from your API key — no workspace IDs or audit IDs required.

### `list_workspaces`
Lists all workspaces on your GigaCode account.

### `list_audits`
Lists all security audits across every workspace, sorted newest-first. Shows type, status, score (A+→F), and finding count.

### `get_findings`
Returns security findings with full evidence and fix recommendations. Defaults to the most recent completed audit across all workspaces.

| Parameter | Type | Description |
|-----------|------|-------------|
| `audit_id` | optional | Target a specific audit |
| `severity` | optional | Minimum threshold: `critical` · `high` · `medium` · `low` · `info` |
| `category` | optional | Filter by category, e.g. `injection`, `auth`, `cors` |

Each finding includes:
- **title** + **severity**
- **description** — what the vulnerability is
- **evidence** — raw proof (HTTP requests, tool output, PoC commands)
- **recommendation** — exactly what to fix in the code

### `get_audit_report`
Returns the full Markdown security report for a completed audit — executive summary, attack narrative, and findings table.

| Parameter | Type | Description |
|-----------|------|-------------|
| `audit_id` | optional | Defaults to most recent completed audit |

---

## Example agent prompts

```
Get my critical and high security findings and fix them in the codebase.
```

```
Show me all injection vulnerabilities from the latest audit and patch them.
```

```
Get the full security report and summarize what was compromised.
```

---

## Requirements

- Node.js 18+
- A [GigaCode](https://withgiga.ai) account with at least one completed security audit
