const ENDPOINT =
  process.env.DIVAR_MCP_URL || "https://divar-mcp.mmdju2.workers.dev/mcp";

let id = 0;

function parseEnvelope(text) {
  const lines = text
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim())
    .filter(Boolean);
  const payload = JSON.parse(lines.length ? lines.at(-1) : text);
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  return payload.result;
}

export async function divarCallTool(name, args = {}) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: ++id,
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });
  if (!response.ok) throw new Error(`Divar MCP HTTP ${response.status}`);
  return parseEnvelope(await response.text());
}
