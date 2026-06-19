"""
MÓDULO: RUTAS API - ENDPOINTS DEL CHAT
RESPONSABLE: Desarrollador Backend / Integración.

¿QUÉ HACER AQUÍ?:
1. Aquí se reciben los mensajes directos que el usuario envía desde el frontend de Next.js (Puerto 3000).
2. Debes conectar este endpoint con la lógica de 'app/services/llm.py' y el buscador de 'app/rag/vector_store.py'.
3. Flujo esperado: Recibir prompt -> Buscar contexto ISO -> Enviar a GPT -> Retornar respuesta al Front.
"""

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])



@router.post("")
def handle_chat_message():

    # Aquí irá la lógica RAG + LLM más adelante. Por ahora simulamos la respuesta:
    ai_response = f"Recibí tu consulta sobre auditoría, toi procesando..."
    
    return {
        "sender": "ai",
        "text": ai_response
    }