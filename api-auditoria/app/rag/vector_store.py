"""
MÓDULO: PIPELINE RAG - VECTOR STORE (ChromaDB)
RESPONSABLE: Desarrollador encargado de la Base de Datos Vectorial.
"""

from app.database import settings
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
import chromadb
import os

if settings.GEMINI_API_KEY:
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY

def get_vector_store():
    # Usamos un modelo local gratuito y ligero de HuggingFace para la vectorización
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    # Conectarse al servidor ChromaDB Cloud
    chroma_client = chromadb.CloudClient(
        api_key=settings.CHROMA_API_KEY,
        tenant=settings.CHROMA_TENANT,
        database=settings.CHROMA_DATABASE
    )
    
    return Chroma(
        client=chroma_client,
        collection_name="AuditorIA_documents",
        embedding_function=embeddings
    )

def add_documents_to_chroma(docs):
    vector_store = get_vector_store()
    vector_store.add_documents(docs)

def query_documents(query: str, k: int = 4):
    vector_store = get_vector_store()
    return vector_store.similarity_search(query, k=k)
