# withgiga-ops-mcp

MCP server that gives your coding agent direct access to [GigaCode](https://withgiga.ai) security audit findings — vulnerabilities, evidence, and recommended fixes — so it can patch your code automatically.

## Setup

### 1. Get your API key

Go to **withgiga.ai → Profile → API Keys** and create a key (`giga_sk_...`).

### 2. Add to your coding agent

**Claude Code** (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "giga-security": {
      "command": "node",
      "args": ["/path/to/withgiga-ops-mcp/dist/index.js"],
      "env": {
        "GIGA_API_KEY": "giga_sk_your_key_here"
      }
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "giga-security": {
      "command": "node",
      "args": ["/path/to/withgiga-ops-mcp/dist/index.js"],
      "env": {
        "GIGA_API_KEY": "giga_sk_your_key_here"
      }
    }
  }
}
```

**VS Code** (`.vscode/mcp.json`):
```json
{
  "servers": {
    "giga-security": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/withgiga-ops-mcp/dist/index.js"],
      "env": {
        "GIGA_API_KEY": "giga_sk_your_key_here"
      }
    }
  }
}
```

### 3. Install

```bash
git clone git@github.com:WithGiga/withgiga-ops-mcp.git
cd withgiga-ops-mcp
npm install
```

Replace `/path/to/withgiga-ops-mcp` in your config with the actual clone path.

---

## Tools

Everything resolves automatically from your API key — no workspace IDs or audit IDs required.

### `list_workspaces`
Lists all workspaces on your GigaCode account.

```
No parameters required.
```

### `list_audits`
Lists all security audits across every workspace, sorted newest-first. Shows type, status, score (A+→F), and finding count.

```
No parameters required.
```

### `get_findings`
Returns security findings with full evidence and fix recommendations. Defaults to the most recent completed audit across all workspaces.

```
audit_id  (optional) — target a specific audit
severity  (optional) — minimum threshold: critical | high | medium | low | info
category  (optional) — filter by category, e.g. "injection", "auth", "cors"
```

Each finding includes:
- **title** + **severity**
- **description** — what the vulnerability is
- **evidence** — raw proof (HTTP requests, tool output, PoC commands)
- **recommendation** — exactly what to fix in the code

### `get_audit_report`
Returns the full Markdown security report for a completed audit — executive summary, attack narrative, and findings table.

```
audit_id  (optional) — defaults to most recent completed audit
```

---

## Example agent prompts

```
Get my critical and high security findings and fix them in the codebase.
```

```
Show me all injection vulnerabilities from the latest audit and patch them.
```

```
Get the full security report for my last audit and summarize the attack narrative.
```

---

## Requirements

- Node.js 18+
- A [GigaCode](https://withgiga.ai) account with at least one completed security audit
