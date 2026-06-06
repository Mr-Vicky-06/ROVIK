from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from routeiq.infrastructure.database.session import get_session
import sys

# System-level mocks for heavy AI libraries to allow instant CI execution without installing them
sys.modules['langchain_community'] = MagicMock()
sys.modules['langchain_ollama'] = MagicMock()
sys.modules['langchain_core'] = MagicMock()

from routeiq.main import app  # noqa: E402

client = TestClient(app)

@patch("routeiq.api.v1.routes.copilot.OllamaLLM")
@patch("routeiq.api.v1.routes.copilot.OllamaEmbeddings")
@patch("routeiq.api.v1.routes.copilot.get_session")
def test_copilot_chat_endpoint(mock_get_session, mock_embeddings, mock_llm):
    # Setup mocks to prevent hitting actual local Ollama/Chroma instances during CI
    mock_llm_instance = mock_llm.return_value
    
    # In LangChain modern, ainvoke is an async method
    import asyncio
    future = asyncio.Future()
    future.set_result("This is a mocked AI response regarding SLA breaches.")
    mock_llm_instance.ainvoke = MagicMock(return_value=future)

    # Mock DB Session
    mock_session = AsyncMock()
    mock_result = MagicMock()
    mock_row = MagicMock()
    mock_row.summary = "Mocked memory context."
    mock_result.scalars.return_value.all.return_value = [mock_row]
    mock_session.execute.return_value = mock_result

    app.dependency_overrides[get_session] = lambda: mock_session

    response = client.post(
        "/api/v1/copilot/chat",
        json={"query": "Why was order 123 delayed?"},
        headers={"Authorization": "Bearer local-dev"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert data["answer"] == "This is a mocked AI response regarding SLA breaches."
    assert "context_used" in data
    assert data["context_used"] == ["Mocked memory context."]
    
    # Clean up override
    app.dependency_overrides.clear()
