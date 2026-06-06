from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import text
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_core.prompts import PromptTemplate

from routeiq.infrastructure.database.session import get_session
from routeiq.infrastructure.database.models import AiContextModel
from routeiq.security.auth import require_roles
from routeiq.schemas.auth import Principal, Role

router = APIRouter(tags=["AI Copilot"])

class ChatRequest(BaseModel):
    query: str

class ChatResponse(BaseModel):
    answer: str
    context_used: list[str]

@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_session),
    principal: Principal = Depends(require_roles(Role.ADMIN, Role.DISPATCHER))
):
    try:
        # 1. Generate query embedding using Ollama
        embeddings = OllamaEmbeddings(model="nomic-embed-text")
        # Ensure we await or run synchronously depending on langchain_ollama version
        # If it's sync:
        query_embedding = embeddings.embed_query(request.query)
        
        # 2. Retrieve Context from PostgreSQL pgvector
        # Assuming AiContextModel has an embedding column configured with pgvector
        # We order by cosine distance <=> operator
        # Using raw SQL text for the vector operator to bypass SQLAlchemy String typing constraints
        query = (
            select(AiContextModel)
            .where(AiContextModel.organization_id == principal.organization_id)
            .order_by(text("embedding_reference <=> :query_emb").bindparams(query_emb=str(query_embedding)))
            .limit(3)
        )
        
        result = await db.execute(query)
        context_rows = result.scalars().all()
        
        retrieved_context = [row.summary or str(row.content) for row in context_rows]
        context_str = "\n".join(retrieved_context) if retrieved_context else "No historical context found."
        
        # 3. Setup Ollama LLM
        llm = OllamaLLM(model="llama3")
        
        # 4. Generate response using LangChain
        template = """
        You are ROVIK, the highly intelligent AI Operational Copilot for a logistics enterprise.
        Your job is to answer dispatcher questions using ONLY the historical operational memory provided below.
        If the memory does not contain the answer, explicitly say "I don't have historical data on that."
        
        Operational Memory:
        {context}
        
        Dispatcher Query: {query}
        
        ROVIK's Answer:
        """
        
        prompt = PromptTemplate(template=template, input_variables=["context", "query"])
        chain = prompt | llm
        
        answer = await chain.ainvoke({"context": context_str, "query": request.query})
        
        return ChatResponse(answer=answer, context_used=retrieved_context)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot Error: {str(e)}")
