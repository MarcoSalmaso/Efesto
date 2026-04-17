import lancedb
import ollama
import os
import numpy as np
import json
import pyarrow as pa
from typing import List, Dict, Any

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORAGE_PATH = os.path.join(BASE_DIR, "storage", "vectors")
os.makedirs(STORAGE_PATH, exist_ok=True)

EMBEDDING_DIM = 2560

SCHEMA = pa.schema([
    pa.field("vector", pa.list_(pa.float32(), EMBEDDING_DIM)),
    pa.field("text", pa.string()),
    pa.field("metadata", pa.string()),
])

class RagManager:
    def __init__(self, db_path: str = STORAGE_PATH):
        self.db = lancedb.connect(db_path)
        self.embedding_model = "qwen3-embedding:4b"
        self.chunk_size = 800
        self.batch_size = 8
        self.search_limit = 3
        self._ensure_table()

    def configure(self, embedding_model: str = None, chunk_size: int = None,
                  batch_size: int = None, search_limit: int = None):
        if embedding_model is not None:
            self.embedding_model = embedding_model
        if chunk_size is not None:
            self.chunk_size = chunk_size
        if batch_size is not None:
            self.batch_size = batch_size
        if search_limit is not None:
            self.search_limit = search_limit

    def _schema_is_valid(self) -> bool:
        try:
            table = self.db.open_table("knowledge")
            meta_field = table.schema.field("metadata")
            return pa.types.is_string(meta_field.type) or pa.types.is_large_string(meta_field.type)
        except Exception:
            return False

    def _ensure_table(self):
        needs_create = "knowledge" not in self.db.table_names()
        if not needs_create and not self._schema_is_valid():
            self.db.drop_table("knowledge")
            needs_create = True
        if needs_create:
            self.db.create_table("knowledge", schema=SCHEMA)

    def reset_table(self):
        if "knowledge" in self.db.table_names():
            self.db.drop_table("knowledge")
        self._ensure_table()

    def _get_embedding(self, text: str) -> List[float]:
        response = ollama.embeddings(model=self.embedding_model, prompt=text)
        return response['embedding']

    def _get_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        response = ollama.embed(model=self.embedding_model, input=texts)
        return response['embeddings']

    @staticmethod
    def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
        words = text.split()
        if not words:
            return []
        chunks = []
        start = 0
        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunks.append(" ".join(words[start:end]))
            if end == len(words):
                break
            start += chunk_size - overlap
        return chunks

    def add_document(self, text: str, metadata: Dict[str, Any] = None):
        embedding = self._get_embedding(text)
        table = self.db.open_table("knowledge")
        table.add([{
            "vector": np.array(embedding, dtype=np.float32),
            "text": text,
            "metadata": json.dumps(metadata or {}),
        }])

    def add_document_chunked(self, text: str, metadata: Dict[str, Any] = None):
        chunks = self._chunk_text(text, chunk_size=self.chunk_size)
        if not chunks:
            return
        table = self.db.open_table("knowledge")
        total = len(chunks)
        rows = []
        for batch_start in range(0, total, self.batch_size):
            batch = chunks[batch_start:batch_start + self.batch_size]
            embeddings = self._get_embeddings_batch(batch)
            for i, (chunk, embedding) in enumerate(zip(batch, embeddings)):
                meta = dict(metadata or {})
                meta["chunk"] = batch_start + i
                meta["total_chunks"] = total
                rows.append({
                    "vector": np.array(embedding, dtype=np.float32),
                    "text": chunk,
                    "metadata": json.dumps(meta),
                })
        table.add(rows)

    def search(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        query_embedding = self._get_embedding(query)
        table = self.db.open_table("knowledge")
        results = table.search(query_embedding).limit(limit).to_list()
        formatted_results = []
        for r in results:
            meta = r.get("metadata", "{}")
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {"raw": meta}
            formatted_results.append({
                "text": r["text"],
                "metadata": meta,
                "score": r.get("_distance", 0),
            })
        return formatted_results

    def delete_by_filename(self, filename: str):
        table = self.db.open_table("knowledge")
        safe = filename.replace("\\", "\\\\").replace("'", "\\'")
        table.delete(f'metadata LIKE \'%"filename": "{safe}"%\'')

    def list_documents(self) -> List[Dict[str, Any]]:
        if "knowledge" not in self.db.table_names():
            return []
        table = self.db.open_table("knowledge")
        results = table.to_pandas()
        if results.empty:
            return []
        grouped: Dict[str, Any] = {}
        for _, row in results.iterrows():
            meta = row["metadata"]
            if isinstance(meta, str):
                try:
                    meta = json.loads(meta)
                except Exception:
                    meta = {"raw": meta}
            filename = meta.get("filename", "Testo manuale")
            if filename not in grouped:
                grouped[filename] = {
                    "filename": filename,
                    "source": meta.get("source", "N/A"),
                    "chunks": 0,
                    "preview": row["text"][:120] + "..." if len(row["text"]) > 120 else row["text"],
                }
            grouped[filename]["chunks"] += 1
        return list(grouped.values())

rag_manager = RagManager()
