"""
MÓDULO: RUTAS API - CARGA DE DOCUMENTOS
RESPONSABLE: Desarrollador Backend / Pipeline RAG.
"""

from fastapi import APIRouter, UploadFile, File
import shutil
import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from app.rag.vector_store import add_documents_to_chroma, get_vector_store

router = APIRouter(prefix="/api/v1/documents", tags=["Documentos"])

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"📥 Recibiendo archivo: {file.filename}...")
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        print("📖 Leyendo el PDF...")
        loader = PyPDFLoader(temp_file_path)
        documents = loader.load()
        
        print("✂️ Fragmentando el texto en chunks...")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        docs = text_splitter.split_documents(documents)
        
        print(f"💾 Guardando {len(docs)} fragmentos en ChromaDB...")
        add_documents_to_chroma(docs)
        print("✅ Guardado exitoso en ChromaDB.")
        
        os.remove(temp_file_path)
        
        return {
            "filename": file.filename,
            "status": "Recibido con éxito",
            "detail": f"Documento fragmentado en {len(docs)} chunks e indexado en Chroma DB."
        }
    except Exception as e:
        print(f"❌ Error al procesar: {str(e)}")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return {
            "filename": file.filename,
            "status": "Error",
            "detail": str(e)
        }

@router.get("/count")
async def count_documents():
    """Endpoint de prueba para ver cuántos fragmentos hay guardados en la BD"""
    try:
        vector_store = get_vector_store()
        # count() devuelve la cantidad de chunks indexados
        count = vector_store._collection.count()
        return {"total_chunks_en_chromadb": count}
    except Exception as e:
        return {"error": f"No se pudo conectar a ChromaDB: {str(e)}"}