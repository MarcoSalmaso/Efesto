import sys
import asyncio
import tempfile
import os
from .base import BaseTool
from typing import Any, Dict

class PythonExecutorTool(BaseTool):
    @property
    def name(self) -> str:
        return "execute_python"

    @property
    def description(self) -> str:
        return "Esegue codice Python 3 e restituisce l'output (stdout). Utile per calcoli matematici complessi, analisi dati o elaborazione di informazioni. Il codice deve stampare il risultato con print()."

    @property
    def parameters_schema(self) -> Dict[str, Any]:
        return {
            'type': 'object',
            'properties': {
                'code': {
                    'type': 'string',
                    'description': 'Il codice Python completo da eseguire.'
                }
            },
            'required': ['code']
        }

    async def execute(self, code: str) -> str:
        tmp_path = None
        try:
            # Creiamo un file temporaneo per il codice
            with tempfile.NamedTemporaryFile(suffix=".py", delete=False) as tmp:
                tmp.write(code.encode('utf-8'))
                tmp_path = tmp.name
            
            # Eseguiamo il processo in modo asincrono
            process = await asyncio.create_subprocess_exec(
                sys.executable, tmp_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            try:
                # Timeout di sicurezza di 10 secondi
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=10.0)
                
                if process.returncode == 0:
                    output = stdout.decode().strip()
                    return output if output else "Esecuzione completata (nessun output stampato)."
                else:
                    return f"Errore durante l'esecuzione:\n{stderr.decode()}"
            except asyncio.TimeoutError:
                process.kill()
                return "Errore: L'esecuzione del codice ha superato il tempo limite di 10 secondi."
                
        except Exception as e:
            return f"Errore imprevisto: {str(e)}"
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except:
                    pass
