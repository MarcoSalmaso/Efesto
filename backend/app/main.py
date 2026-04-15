from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel, Session, create_engine, select
from typing import List, Optional
import ollama
from .models import ModelConfig, ToolDefinition, ChatSession, ChatMessage

sqlite_file_name = "efesto.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

app = FastAPI(title="Efesto API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# --- Modelli ---
@app.get("/ollama/list")
def list_local_models():
    try:
        response = ollama.list()
        if hasattr(response, 'models'):
            return {"models": [m.model for m in response.models]}
        elif isinstance(response, dict):
            return {"models": [m['name'] for m in response.get('models', [])]}
        return {"models": []}
    except:
        return {"models": []}

# --- Sessioni ---
@app.get("/sessions/", response_model=List[ChatSession])
def read_sessions(session: Session = Depends(get_session)):
    # Restituisce le sessioni ordinate dalla più recente
    return session.exec(select(ChatSession).order_by(ChatSession.created_at.desc())).all()

@app.get("/sessions/{session_id}/messages", response_model=List[ChatMessage])
def read_session_messages(session_id: int, session: Session = Depends(get_session)):
    return session.exec(select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)).all()

@app.post("/sessions/", response_model=ChatSession)
def create_session(session_data: ChatSession, session: Session = Depends(get_session)):
    db_session = ChatSession(title=session_data.title)
    session.add(db_session)
    session.commit()
    session.refresh(db_session)
    return db_session

# --- Chat ---
from pydantic import BaseModel
from .tools import registry

class ChatRequest(BaseModel):
    model: str
    message: str
    session_id: Optional[int] = None

@app.post("/chat")
async def chat_with_tools(request: ChatRequest, db: Session = Depends(get_session)):
    try:
        # 1. Recupera o crea la sessione
        if not request.session_id:
            db_session = ChatSession(title=request.message[:30] + "...")
            db.add(db_session)
            db.commit()
            db.refresh(db_session)
            session_id = db_session.id
        else:
            session_id = request.session_id

        # 2. Salva il messaggio dell'utente
        user_msg = ChatMessage(session_id=session_id, role="user", content=request.message)
        db.add(user_msg)
        
        # 3. Prepara i messaggi per Ollama (includi cronologia recente)
        # Per ora mandiamo solo l'ultimo per semplicità, ma potremmo recuperare i precedenti
        ollama_messages = [{'role': 'user', 'content': request.message}]
        
        response = ollama.chat(
            model=request.model,
            messages=ollama_messages,
            tools=registry.get_ollama_format()
        )

        # 4. Gestione Tool (semplificata)
        content = ""
        if response.get('message', {}).get('tool_calls'):
            # Qui andrebbe la logica dei tool che abbiamo scritto prima...
            # Per brevità ora salviamo solo la risposta finale
            pass
        
        assistant_content = response['message']['content']
        
        # 5. Salva la risposta dell'assistente
        assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=assistant_content)
        db.add(assistant_msg)
        
        db.commit()
        
        return {
            "role": "assistant", 
            "content": assistant_content, 
            "session_id": session_id
        }
        
    except Exception as e:
        return {"role": "assistant", "content": f"Errore: {str(e)}"}
