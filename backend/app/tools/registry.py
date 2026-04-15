import importlib
import os
from typing import Dict, Type
from .base import BaseTool

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register_tool(self, tool: BaseTool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> BaseTool:
        return self._tools.get(name)

    def list_tools(self) -> Dict[str, BaseTool]:
        return self._tools

    def get_ollama_format(self):
        """Restituisce i tool nel formato che Ollama capisce per la 'Function Calling'"""
        ollama_tools = []
        for name, tool in self._tools.items():
            ollama_tools.append({
                'type': 'function',
                'function': {
                    'name': tool.name,
                    'description': tool.description,
                    'parameters': tool.parameters_schema
                }
            })
        return ollama_tools

# Istanza globale del registro
registry = ToolRegistry()
