import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_KEY = process.env.GOLEM_API_KEY;
const API_URL = (process.env.GOLEM_API_URL ?? "https://buildapi.300mil.com").replace(/\/$/, "");

if (!API_KEY) {
  process.stderr.write(
    "Error: GOLEM_API_KEY is required.\n" +
    "Add it to your MCP config: \"GOLEM_API_KEY\": \"golem_sk_...\"\n",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    throw new Error(`Network error: ${err instanceof Error ? err.message : err}`);
  }

  const body = await res.json() as { success: boolean; data?: T; error?: { message: string } };
  if (res.status === 401) throw new Error("Invalid or expired GOLEM_API_KEY.");
  if (res.status === 404) throw new Error(body.error?.message ?? "Resource not found.");
  if (!res.ok || !body.success) throw new Error(body.error?.message ?? `API error ${res.status}`);
  return body.data as T;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = "critical" | "high" | "medium" | "low" | "info";

interface AuditFinding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: string;
  evidence?: string;
  recommendation?: string;
  discoveredAt: string;
}

interface SerializedAudit {
  _id: string;
  workspaceId: string;
  type: string;
  status: string;
  score?: string;
  scoreNumeric?: number;
  findings: AuditFinding[];
  reportS3Key?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

interface SerializedWorkspace {
  _id: string;
  name: string;
  domain: string;
}

type EnrichedAudit = SerializedAudit & {
  workspaceName: string;
  workspaceDomain: string;
};

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

// ---------------------------------------------------------------------------
// Data helpers — all scoped to the API key automatically
// ---------------------------------------------------------------------------

async function getAllWorkspaces(): Promise<SerializedWorkspace[]> {
  const data = await apiGet<{ workspaces: SerializedWorkspace[] }>("/api/workspaces");
  return data.workspaces ?? [];
}

async function getAllAudits(): Promise<EnrichedAudit[]> {
  const workspaces = await getAllWorkspaces();
  if (workspaces.length === 0) {
    throw new Error("No workspaces found. Create one at https://usegolem.ai first.");
  }

  const perWorkspace = await Promise.all(
    workspaces.map(async (ws) => {
      const data = await apiGet<{ audits: SerializedAudit[] }>(
        `/api/workspaces/${ws._id}/audits?limit=100`,
      );
      return (data.audits ?? []).map((a) => ({
        ...a,
        workspaceName: ws.name,
        workspaceDomain: ws.domain,
      }));
    }),
  );

  return perWorkspace
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function resolveAudit(auditId?: string): Promise<EnrichedAudit> {
  const all = await getAllAudits();

  if (auditId) {
    const found = all.find((a) => a._id === auditId);
    if (!found) throw new Error(`Audit "${auditId}" not found across any workspace.`);
    return found;
  }

  const completed = all.filter((a) => a.status === "completed");
  if (completed.length === 0) {
    throw new Error("No completed audits found. Run a security audit at https://usegolem.ai first.");
  }
  return completed[0];
}

// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------

const server = new McpServer({ name: "golem-security", version: "0.1.0" });

// ---------------------------------------------------------------------------
// Tool: list_workspaces
// ---------------------------------------------------------------------------

server.tool(
  "list_workspaces",
  "List all workspaces on your Golem account. Workspace IDs, names, and target domains are resolved automatically from your API key.",
  {},
  async () => {
    const workspaces = await getAllWorkspaces();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(
          workspaces.map((w) => ({ id: w._id, name: w.name, domain: w.domain })),
          null,
          2,
        ),
      }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: list_audits
// ---------------------------------------------------------------------------

server.tool(
  "list_audits",
  "List all security audits across every workspace, sorted newest-first. Shows workspace, audit type, status, score (A+→F), and finding count. Everything is resolved from your API key — no parameters needed.",
  {},
  async () => {
    const audits = await getAllAudits();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(
          audits.map((a) => ({
            id: a._id,
            workspace: { name: a.workspaceName, domain: a.workspaceDomain },
            type: a.type,
            status: a.status,
            score: a.score ?? null,
            scoreNumeric: a.scoreNumeric ?? null,
            findingCount: a.findings.length,
            createdAt: a.createdAt,
            completedAt: a.completedAt ?? null,
          })),
          null,
          2,
        ),
      }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: get_findings
// ---------------------------------------------------------------------------

server.tool(
  "get_findings",
  [
    "Get security findings from a Golem audit. Everything resolves automatically from your API key — no workspace or audit ID needed.",
    "",
    "Defaults to the most recent completed audit across all workspaces.",
    "",
    "Each finding includes:",
    "  • title & severity (critical / high / medium / low / info)",
    "  • description — what the vulnerability is",
    "  • evidence — raw proof (HTTP requests, tool output, PoC)",
    "  • recommendation — exactly what to fix in the code",
  ].join("\n"),
  {
    audit_id: z
      .string()
      .optional()
      .describe("Target a specific audit by ID (from list_audits). Omit to use the most recent completed audit."),
    severity: z
      .enum(["critical", "high", "medium", "low", "info"])
      .optional()
      .describe("Minimum severity threshold. 'high' returns critical + high only."),
    category: z
      .string()
      .optional()
      .describe("Filter by category (case-insensitive). E.g. 'injection', 'auth', 'cors'."),
  },
  async ({ audit_id, severity, category }) => {
    const audit = await resolveAudit(audit_id);

    let findings = audit.findings;

    if (severity) {
      const threshold = SEVERITY_ORDER[severity];
      findings = findings.filter((f) => SEVERITY_ORDER[f.severity] <= threshold);
    }

    if (category) {
      const lower = category.toLowerCase();
      findings = findings.filter((f) => f.category.toLowerCase().includes(lower));
    }

    findings = findings.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

    const bySeverity = findings.reduce<Record<string, number>>((acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    }, {});

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          auditId: audit._id,
          auditType: audit.type,
          workspace: { name: audit.workspaceName, domain: audit.workspaceDomain },
          score: audit.score ?? null,
          scoreNumeric: audit.scoreNumeric ?? null,
          completedAt: audit.completedAt ?? null,
          summary: { total: findings.length, bySeverity },
          findings,
        }, null, 2),
      }],
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: get_audit_report
// ---------------------------------------------------------------------------

server.tool(
  "get_audit_report",
  "Fetch the full Markdown security report for a completed audit. Includes executive summary, attack narrative, and findings table. Defaults to the most recent completed audit across all workspaces.",
  {
    audit_id: z
      .string()
      .optional()
      .describe("Target a specific audit by ID (from list_audits). Omit to use the most recent completed audit."),
  },
  async ({ audit_id }) => {
    const audit = await resolveAudit(audit_id);

    if (!audit.reportS3Key) {
      throw new Error("Report not available yet. The audit may still be running.");
    }

    const reportData = await apiGet<{ url: string }>(
      `/api/workspaces/${audit.workspaceId}/audits/${audit._id}/report`,
    );

    let reportRes: Response;
    try {
      reportRes = await fetch(reportData.url, { signal: AbortSignal.timeout(30_000) });
    } catch (err) {
      throw new Error(`Failed to download report: ${err instanceof Error ? err.message : err}`);
    }

    if (!reportRes.ok) throw new Error(`Report download failed (HTTP ${reportRes.status}).`);

    return { content: [{ type: "text", text: await reportRes.text() }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
