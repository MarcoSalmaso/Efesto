from .registry import registry
from .file_reader import FileReaderTool
from .python_executor import PythonExecutorTool
from .rag_search import RagSearchTool

# Registriamo i tool iniziali
registry.register_tool(FileReaderTool())
registry.register_tool(PythonExecutorTool())
registry.register_tool(RagSearchTool())
