"""
MÓDULO: RUTAS API - ENDPOINTS DEL CHAT
RESPONSABLE: Desarrollador Backend / Integración.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from app.rag.vector_store import query_documents
from langchain_google_genai import ChatGoogleGenerativeAI
from app.database import settings
import os

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

class ChatMessage(BaseModel):
    message: str

@router.post("")
def handle_chat_message(chat_msg: ChatMessage):
    if settings.GEMINI_API_KEY:
        os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY
    
    # 1. Buscar contexto en ChromaDB
    context_docs = query_documents(chat_msg.message)
    context_text = "\n\n".join([doc.page_content for doc in context_docs])
    
    # 2. Llamada a g4f (GPT4Free) - Modelo super estable y nativo en Python
    try:
        from g4f.client import Client
        
        client = Client()
        
        safe_context = context_text[:2000]
        
        prompt = f"""Eres AuditorIA, un estricto auditor experto en normativas ISO. 
Tienes una regla fundamental e inquebrantable: SOLO puedes responder preguntas basándote ESTRICTAMENTE en el siguiente contexto de documentos que el usuario ha subido al sistema. 

REGLA DE ORO: Si la respuesta a la pregunta del usuario NO se encuentra en el contexto proporcionado abajo, DEBES responder textualmente: "Lo siento, este sistema solo está diseñado para auditar procesos en base a los documentos proporcionados. Por favor, sube el archivo correspondiente para que pueda analizarlo." No inventes respuestas, no uses tu conocimiento externo.

CONTEXTO EXTRAÍDO DE LOS DOCUMENTOS DEL USUARIO:
{safe_context if safe_context.strip() else "(No hay documentos subidos o no se encontró contexto relevante. Aplica la regla de oro.)"}

PREGUNTA DEL USUARIO: {chat_msg.message}
"""
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
        )
        
        ai_response = response.choices[0].message.content
        
    except Exception as e:
        ai_response = f"Ocurrió un error en la IA: {str(e)}"

    return {
        "sender": "ai",
        "text": ai_response
    }