import os
from .base import BaseTool
from typing import Any, Dict

class FileReaderTool(BaseTool):
    @property
    def name(self) -> str:
        return "read_file"

    @property
    def description(self) -> str:
        return "Legge il contenuto di un file di testo locale. Richiede il percorso relativo del file."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            'type': 'object',
            'properties': {
                'file_path': {
                    'type': 'string',
                    'description': 'Il percorso relativo del file da leggere'
                }
            },
            'required': ['file_path']
        }

    async def execute(self, file_path: str) -> str:
        try:
            # Per sicurezza, limitiamo l'accesso alla cartella corrente o sottocartelle
            full_path = os.path.abspath(file_path)
            if not os.path.exists(full_path):
                return f"Errore: Il file {file_path} non esiste."
            
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            return f"Errore durante la lettura del file: {str(e)}"
