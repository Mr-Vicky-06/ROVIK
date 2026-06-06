import os
import chromadb
from chromadb.config import Settings

VECTOR_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tmp", "chroma_db")

def get_chroma_client():
    """Initializes and returns the ChromaDB client pointing to local storage."""
    os.makedirs(VECTOR_DB_DIR, exist_ok=True)
    return chromadb.PersistentClient(path=VECTOR_DB_DIR, settings=Settings(anonymized_telemetry=False))

def get_collection(collection_name: str = "rovik_operational_memory"):
    client = get_chroma_client()
    return client.get_or_create_collection(name=collection_name)
