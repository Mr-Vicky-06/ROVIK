from rovik_ml.storage.vector_store import get_collection
from langchain_community.embeddings import OllamaEmbeddings
import uuid
from datetime import datetime

def ingest_operational_events():
    """
    Simulates extracting delayed orders and SLA breaches from ClickHouse/Postgres,
    converting them to text narratives, and storing them in ChromaDB using Ollama embeddings.
    """
    collection = get_collection()
    embeddings = OllamaEmbeddings(model="llama3")
    
    # Mock data that would normally come from an SQL query to our Data Lake
    historical_events = [
        {"order_id": "ORD-102", "delay_min": 15, "reason": "Severe traffic near Central Hub", "zone": "Zone A"},
        {"order_id": "ORD-405", "delay_min": 45, "reason": "Rider vehicle breakdown", "zone": "Zone B"},
        {"order_id": "ORD-882", "delay_min": 10, "reason": "Customer unreachable at dropoff", "zone": "Zone C"},
        {"order_id": "ORD-991", "delay_min": 25, "reason": "Heavy rain causing slow movement", "zone": "Zone B"}
    ]
    
    documents = []
    metadatas = []
    ids = []
    
    for event in historical_events:
        narrative = f"On {datetime.now().strftime('%Y-%m-%d')}, order {event['order_id']} in {event['zone']} was delayed by {event['delay_min']} minutes. Root cause: {event['reason']}."
        documents.append(narrative)
        metadatas.append({"zone": event["zone"], "type": "delay", "delay_min": event["delay_min"]})
        ids.append(str(uuid.uuid4()))
        
    print(f"Ingesting {len(documents)} operational memory narratives into ChromaDB...")
    
    # Generate embeddings and store
    embedded_docs = embeddings.embed_documents(documents)
    collection.add(
        documents=documents,
        embeddings=embedded_docs,
        metadatas=metadatas,
        ids=ids
    )
    print("Ingestion complete. The AI Copilot now has access to these memories.")

if __name__ == "__main__":
    ingest_operational_events()
