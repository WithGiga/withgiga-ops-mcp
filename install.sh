#!/usr/bin/env bash
set -e

REPO="WithGiga/withgiga-ops-mcp"
INSTALL_DIR="$HOME/.withgiga-mcp"
BINARY="$INSTALL_DIR/index.js"

# ── prompt for key if not passed via env ──────────────────────────────────────
if [ -z "$GIGA_API_KEY" ]; then
  printf "GigaCode API key (giga_sk_...): "
  read -r GIGA_API_KEY
fi

if [ -z "$GIGA_API_KEY" ]; then
  echo "Error: GIGA_API_KEY is required." >&2
  exit 1
fi

# ── download binary ───────────────────────────────────────────────────────────
echo "Downloading withgiga-ops-mcp..."
mkdir -p "$INSTALL_DIR"
curl -fsSL "https://raw.githubusercontent.com/$REPO/main/dist/index.js" -o "$BINARY"
chmod +x "$BINARY"
echo "Installed to $BINARY"

# ── JSON helper (requires python3, available on all modern systems) ───────────
add_to_config() {
  local file="$1"
  local servers_key="$2"   # "mcpServers" or "servers"
  local entry_key="$3"     # key inside servers_key, e.g. "command"

  python3 - "$file" "$servers_key" "$BINARY" "$GIGA_API_KEY" "$entry_key" <<'PYEOF'
import sys, json, os

file_path, servers_key, binary, api_key, entry_key = sys.argv[1:]

config = {}
if os.path.exists(file_path):
    try:
        with open(file_path) as f:
            config = json.load(f)
    except Exception:
        config = {}

if servers_key not in config or not isinstance(config[servers_key], dict):
    config[servers_key] = {}

config[servers_key]["giga-security"] = {
    entry_key: "node",
    "args": [binary],
    "env": {"GIGA_API_KEY": api_key}
}

os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
with open(file_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")

print(f"  Configured: {file_path}")
PYEOF
}

configured=0

# ── Claude Code ───────────────────────────────────────────────────────────────
CLAUDE_SETTINGS="$HOME/.claude/settings.json"
if [ -d "$HOME/.claude" ] || command -v claude &>/dev/null 2>&1; then
  add_to_config "$CLAUDE_SETTINGS" "mcpServers" "command"
  configured=$((configured + 1))
fi

# ── Cursor ────────────────────────────────────────────────────────────────────
CURSOR_CONFIG="$HOME/.cursor/mcp.json"
if [ -d "$HOME/.cursor" ]; then
  add_to_config "$CURSOR_CONFIG" "mcpServers" "command"
  configured=$((configured + 1))
fi

# ── VS Code ───────────────────────────────────────────────────────────────────
VSCODE_CONFIG="$HOME/.vscode/mcp.json"
if [ -d "$HOME/.vscode" ] || command -v code &>/dev/null 2>&1; then
  add_to_config "$VSCODE_CONFIG" "servers" "type"
  # VS Code uses "type": "stdio" not "command": "node" — patch it
  python3 - "$VSCODE_CONFIG" "$BINARY" "$GIGA_API_KEY" <<'PYEOF'
import sys, json

file_path, binary, api_key = sys.argv[1:]
with open(file_path) as f:
    config = json.load(f)

config["servers"]["giga-security"] = {
    "type": "stdio",
    "command": "node",
    "args": [binary],
    "env": {"GIGA_API_KEY": api_key}
}

with open(file_path, "w") as f:
    json.dump(config, f, indent=2)
    f.write("\n")
PYEOF
  configured=$((configured + 1))
fi

# ── Windsurf ──────────────────────────────────────────────────────────────────
WINDSURF_CONFIG="$HOME/.codeium/windsurf/mcp_config.json"
if [ -d "$HOME/.codeium/windsurf" ]; then
  add_to_config "$WINDSURF_CONFIG" "mcpServers" "command"
  configured=$((configured + 1))
fi

# ── result ────────────────────────────────────────────────────────────────────
echo ""
if [ "$configured" -gt 0 ]; then
  echo "Done. Restart your agent to load the giga-security tools."
else
  echo "No agent detected. Add this to your agent's MCP config manually:"
  echo ""
  echo '  "giga-security": {'
  echo '    "command": "node",'
  echo "    \"args\": [\"$BINARY\"],"
  echo "    \"env\": { \"GIGA_API_KEY\": \"$GIGA_API_KEY\" }"
  echo '  }'
fi
