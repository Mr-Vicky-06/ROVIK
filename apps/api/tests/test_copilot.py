from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import sys

# System-level mocks for heavy AI libraries to allow instant CI execution without installing them
sys.modules['langchain_community'] = MagicMock()
sys.modules['langchain_community.llms'] = MagicMock()
sys.modules['langchain_community.embeddings'] = MagicMock()
sys.modules['langchain'] = MagicMock()
sys.modules['langchain.prompts'] = MagicMock()
sys.modules['langchain.chains'] = MagicMock()
sys.modules['chromadb'] = MagicMock()

from routeiq.main import app  # noqa: E402

client = TestClient(app)

@patch("routeiq.api.v1.routes.copilot.LLMChain")
@patch("routeiq.api.v1.routes.copilot.OllamaEmbeddings")
@patch("routeiq.api.v1.routes.copilot.chromadb.PersistentClient")
def test_copilot_chat_endpoint(mock_chroma, mock_embeddings, mock_llm_chain):
    # Setup mocks to prevent hitting actual local Ollama/Chroma instances during CI
    mock_instance = mock_llm_chain.return_value
    
    # In LangChain <=0.1.16, arun is an async method, but TestClient is sync.
    # The endpoint uses await chain.arun(), so we must mock an async return.
    import asyncio
    future = asyncio.Future()
    future.set_result("This is a mocked AI response regarding SLA breaches.")
    mock_instance.arun.return_value = future

    mock_collection = mock_chroma.return_value.get_or_create_collection.return_value
    mock_collection.query.return_value = {"documents": [["Mocked memory context."]]}

    response = client.post(
        "/api/v1/copilot/chat",
        json={"query": "Why was order 123 delayed?"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "This is a mocked AI response regarding SLA breaches."
    assert "context_used" in data
    assert data["context_used"] == ["Mocked memory context."]
