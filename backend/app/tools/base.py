from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

class BaseTool(ABC):
    @property
    @abstractmethod
    def name(self) -> str:
        """Il nome univoco dello strumento"""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Una descrizione dettagliata per l'LLM (istruzioni su quando usarlo)"""
        pass

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        """Lo schema dei parametri (formato JSON Schema)"""
        return {}

    @abstractmethod
    async def execute(self, **kwargs) -> Any:
        """La logica di esecuzione dello strumento"""
        pass
