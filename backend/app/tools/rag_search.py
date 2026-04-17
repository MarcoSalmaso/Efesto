from .base import BaseTool
from typing import Any, Dict
from ..rag import rag_manager

class RagSearchTool(BaseTool):
    @property
    def name(self) -> str:
        return "search_knowledge"

    @property
    def description(self) -> str:
        return "Cerca informazioni pertinenti nella base di conoscenza locale (Knowledge Base). Utilizza questo strumento se l'utente fa domande su documenti, fatti specifici precedentemente salvati o se non conosci la risposta a un tema specifico."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            'type': 'object',
            'properties': {
                'query': {
                    'type': 'string',
                    'description': 'La domanda o le parole chiave da cercare nel database vettoriale.'
                },
                'limit': {
                    'type': 'integer',
                    'description': 'Numero massimo di risultati da restituire (default 3).',
                    'default': 3
                }
            },
            'required': ['query']
        }

    async def execute(self, query: str, limit: int = None) -> str:
        try:
            results = rag_manager.search(query, limit=limit or rag_manager.search_limit)
            if not results:
                return "Nessuna informazione pertinente trovata nella base di conoscenza."
            
            formatted_text = "Risultati trovati nella Knowledge Base:\n\n"
            for i, res in enumerate(results, 1):
                formatted_text += f"--- Risultato {i} ---\n"
                formatted_text += f"Contenuto: {res['text']}\n"
                if res['metadata']:
                    formatted_text += f"Metadati: {res['metadata']}\n"
                formatted_text += "\n"
            
            return formatted_text
        except Exception as e:
            return f"Errore durante la ricerca nella Knowledge Base: {str(e)}"
