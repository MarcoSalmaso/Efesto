"""
MCP client manager — JSON-RPC 2.0 over stdio (local processes only).
Compatible with Python 3.9+ (no SDK required).
"""
import asyncio
import json
import os
import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

MCP_CONFIG_PATH = "mcp_config.json"
DEFAULT_CONFIG = {"mcpServers": {}}


# ── Config helpers ─────────────────────────────────────────────────────────────

def load_config() -> dict:
    if not os.path.exists(MCP_CONFIG_PATH):
        example = MCP_CONFIG_PATH.replace(".json", ".example.json")
        base = DEFAULT_CONFIG.copy()
        if os.path.exists(example):
            try:
                with open(example) as f:
                    base = json.load(f)
                for srv in base.get("mcpServers", {}).values():
                    srv["enabled"] = False
            except Exception:
                base = DEFAULT_CONFIG.copy()
        save_config(base)
        return base
    with open(MCP_CONFIG_PATH) as f:
        return json.load(f)


def save_config(config: dict):
    with open(MCP_CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)


# ── Shared helpers ─────────────────────────────────────────────────────────────

def _extract_tool_output(result: Optional[dict]) -> str:
    if not result:
        return ""
    content = result.get("content", [])
    parts = [item.get("text", "") for item in content if item.get("type") == "text"]
    return "\n".join(parts) if parts else json.dumps(result)


# ── stdio connection ───────────────────────────────────────────────────────────

class StdioConnection:
    def __init__(self, name: str, config: dict):
        self.name = name
        self.config = config
        self.transport = "stdio"
        self.process: Optional[asyncio.subprocess.Process] = None
        self.tools: List[dict] = []
        self.status = "disconnected"
        self.error: Optional[str] = None
        self._req_id = 0
        self._lock = asyncio.Lock()

    def _next_id(self) -> int:
        self._req_id += 1
        return self._req_id

    async def _send(self, method: str, params: dict = None, notification: bool = False) -> Optional[dict]:
        if not self.process or self.process.returncode is not None:
            raise RuntimeError("Process not running")
        msg: dict = {"jsonrpc": "2.0", "method": method}
        if not notification:
            msg["id"] = self._next_id()
        if params is not None:
            msg["params"] = params
        self.process.stdin.write((json.dumps(msg) + "\n").encode())
        await self.process.stdin.drain()
        if notification:
            return None
        while True:
            raw = await asyncio.wait_for(self.process.stdout.readline(), timeout=15)
            if not raw:
                raise RuntimeError("Server closed stdout")
            raw = raw.decode().strip()
            if not raw:
                continue
            try:
                resp = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if resp.get("id") == msg["id"]:
                if "error" in resp:
                    raise RuntimeError(resp["error"].get("message", str(resp["error"])))
                return resp.get("result")

    async def connect(self):
        async with self._lock:
            self.status = "connecting"
            self.error = None
            try:
                env = {**os.environ, **self.config.get("env", {})}
                self.process = await asyncio.create_subprocess_exec(
                    self.config["command"],
                    *self.config.get("args", []),
                    stdin=asyncio.subprocess.PIPE,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.DEVNULL,
                    env=env,
                )
                await self._send("initialize", {
                    "protocolVersion": "2024-11-05",
                    "capabilities": {},
                    "clientInfo": {"name": "efesto", "version": "1.0"},
                })
                await self._send("notifications/initialized", notification=True)
                result = await self._send("tools/list", {})
                self.tools = result.get("tools", []) if result else []
                self.status = "connected"
            except Exception as e:
                self.status = "error"
                self.error = str(e)
                await self._kill()

    async def disconnect(self):
        async with self._lock:
            await self._kill()
            self.status = "disconnected"
            self.tools = []

    async def _kill(self):
        if self.process and self.process.returncode is None:
            try:
                self.process.terminate()
                await asyncio.wait_for(self.process.wait(), timeout=3)
            except Exception:
                try:
                    self.process.kill()
                except Exception:
                    pass
        self.process = None

    async def call_tool(self, tool_name: str, arguments: dict) -> str:
        result = await self._send("tools/call", {"name": tool_name, "arguments": arguments})
        return _extract_tool_output(result)




# ── MCPManager ─────────────────────────────────────────────────────────────────

class MCPManager:
    def __init__(self):
        self.connections: Dict[str, object] = {}

    async def start_all(self):
        config = load_config()
        for name, srv_cfg in config.get("mcpServers", {}).items():
            if srv_cfg.get("enabled", True):
                await self.start_server(name, srv_cfg)

    async def stop_all(self):
        for conn in list(self.connections.values()):
            await conn.disconnect()
        self.connections.clear()

    async def start_server(self, name: str, config: dict):
        if name in self.connections:
            await self.connections[name].disconnect()
        conn = StdioConnection(name, config)
        self.connections[name] = conn
        asyncio.ensure_future(conn.connect())

    async def stop_server(self, name: str):
        if name in self.connections:
            await self.connections[name].disconnect()
            del self.connections[name]

    async def restart_server(self, name: str):
        cfg = load_config()
        srv_cfg = cfg.get("mcpServers", {}).get(name)
        if not srv_cfg:
            raise ValueError(f"Server '{name}' not found in config")
        await self.start_server(name, srv_cfg)

    def get_all_tools_ollama(self) -> List[dict]:
        tools = []
        for name, conn in self.connections.items():
            if conn.status != "connected":
                continue
            for t in conn.tools:
                tools.append({
                    "type": "function",
                    "function": {
                        "name": f"mcp__{name}__{t['name']}",
                        "description": f"[MCP:{name}] {t.get('description', '')}",
                        "parameters": t.get("inputSchema", {"type": "object", "properties": {}}),
                    },
                })
        return tools

    async def call_tool(self, qualified_name: str, arguments: dict) -> str:
        parts = qualified_name.split("__", 2)
        if len(parts) != 3 or parts[0] != "mcp":
            raise ValueError(f"Invalid MCP tool name: {qualified_name}")
        _, server_name, tool_name = parts
        conn = self.connections.get(server_name)
        if not conn or conn.status != "connected":
            raise RuntimeError(f"MCP server '{server_name}' not connected")
        return await conn.call_tool(tool_name, arguments)

    def list_servers(self) -> List[dict]:
        config = load_config()
        servers = []
        for name, cfg in config.get("mcpServers", {}).items():
            conn = self.connections.get(name)
            servers.append({
                "name": name,
                "config": cfg,
                "status": conn.status if conn else "disconnected",
                "error": conn.error if conn else None,
                "transport": cfg.get("transport", "stdio"),
                "tools": [{"name": t["name"], "description": t.get("description", "")} for t in (conn.tools if conn else [])],
            })
        return servers


mcp_manager = MCPManager()
