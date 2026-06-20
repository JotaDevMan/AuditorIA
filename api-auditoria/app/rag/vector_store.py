"""
MÓDULO: PIPELINE RAG - VECTOR STORE (ChromaDB)
RESPONSABLE: Desarrollador encargado de la Base de Datos Vectorial.
"""

from app.database import settings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import os

if settings.GEMINI_API_KEY:
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

def get_vector_store():
    # Usamos un modelo local gratuito y ligero de HuggingFace para la vectorización
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    return Chroma(
        collection_name="iso_documents",
        embedding_function=embeddings,
        persist_directory=settings.VECTOR_DB_PATH
    )

def add_documents_to_chroma(docs):
    vector_store = get_vector_store()
    vector_store.add_documents(docs)

def query_documents(query: str, k: int = 4):
    vector_store = get_vector_store()
    return vector_store.similarity_search(query, k=k)
