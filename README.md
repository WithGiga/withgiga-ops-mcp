# withgiga-ops-mcp

MCP server that gives your coding agent direct access to [GigaCode](https://withgiga.ai) security audit findings — vulnerabilities, evidence, and recommended fixes — so it can patch your code automatically.

## Setup

### 1. Get your API key

Go to **withgiga.ai → Profile → API Keys** and create a key (`giga_sk_...`).

### 2. Run the installer

Paste this in your terminal:

```bash
curl -fsSL https://raw.githubusercontent.com/WithGiga/withgiga-ops-mcp/main/install.sh | GIGA_API_KEY=giga_sk_YOUR_KEY_HERE bash
```

The installer automatically detects and configures **Claude Code, Cursor, VS Code, and Windsurf**. Restart your agent and the tools are ready.

> No API key in the command? The installer will prompt you for it.

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
- Python 3 (for the installer — pre-installed on macOS and most Linux distros)
- A [GigaCode](https://withgiga.ai) account with at least one completed security audit
