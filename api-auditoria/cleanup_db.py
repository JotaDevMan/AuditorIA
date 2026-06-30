import os
import sys

# Asegurar que importamos desde el directorio correcto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, settings, engine
from sqlalchemy import text
import chromadb

def clean_postgres():
    print("🧹 Limpiando y Recreando PostgreSQL...")
    try:
        from app.models import Base
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print(f"✅ Se limpiaron y recrearon todas las tablas (Users, Documents, Conversations, etc).")
        
        # Opcional: Ejecutar el seed_users
        from main import seed_users
        seed_users()
    except Exception as e:
        print(f"⚠️ Nota PostgreSQL: Hubo un error al limpiar la BD. ({e})")

def clean_chroma():
    print("\n🧹 Limpiando ChromaDB Cloud...")
    try:
        client = chromadb.CloudClient(
            api_key=settings.CHROMA_API_KEY,
            tenant=settings.CHROMA_TENANT,
            database=settings.CHROMA_DATABASE
        )
        collections = client.list_collections()
        for col in collections:
            client.delete_collection(name=col.name)
            print(f"✅ Colección eliminada: {col.name}")
        if not collections:
            print("✅ No había colecciones para eliminar en ChromaDB.")
    except Exception as e:
        print(f"❌ Error al limpiar ChromaDB: {e}")

if __name__ == "__main__":
    print("Iniciando limpieza total de bases de datos...\n")
    clean_postgres()
    clean_chroma()
    print("\n🎉 Limpieza completada. Ya puedes probar el RAG sin conocimiento previo.")
