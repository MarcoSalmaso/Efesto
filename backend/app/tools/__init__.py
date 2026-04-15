from .registry import registry
from .file_reader import FileReaderTool

# Registriamo i tool iniziali
registry.register_tool(FileReaderTool())
