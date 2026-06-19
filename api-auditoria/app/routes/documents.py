"""
MÓDULO: RUTAS API - CARGA DE DOCUMENTOS
RESPONSABLE: Desarrollador Backend / Pipeline RAG.

¿QUÉ HACER AQUÍ?:
1. Este endpoint recibe los archivos PDF que se arrastran en la vista '/upload' del Frontend.
2. Debes procesar el archivo recibido (UploadFile) usando 'pypdf' para extraer su texto plano.
3. Luego, pasar ese texto por un splitter (fragmentador) e invocar las funciones de 'app/rag/vector_store.py' para indexarlo en ChromaDB.
"""

from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/api/v1/documents", tags=["Documentos"])

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    # Aquí irá la lógica para pasar el archivo por app/rag/loader.py
    return {
        "filename": file.filename,
        "status": "Recibido con éxito",
        "detail": "Enviado al RAG para fragmentación e indexación en Chroma DB."
    }