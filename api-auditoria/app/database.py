"""
MÓDULO: CONFIGURACIÓN GLOBAL Y VARIABLES DE ENTORNO
RESPONSABLE: Líder del proyecto (Juan Pablo).

¿QUÉ CONFIGURAR AQUÍ?:
1. Mapear las credenciales críticas del archivo local '.env'.
2. Si se integra la base de datos tradicional, aquí se levantará la sesión de SQLAlchemy para conectarse a PostgreSQL.
"""

import os
from pydantic_settings import BaseSettings

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

class Settings(BaseSettings):
    # Esto leerá las variables de tu archivo .env automáticamente
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = "AQ.Ab8RN6ITbKDG4HyRqc7OopGclRljbBgmL0EAiv_inVRYiF3fRw"
    OPENROUTER_API_KEY: str = "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"
    PG_DATABASE_URL: str = "postgresql+pg8000://postgres:12345@localhost:5432/auditoria_db"
    VECTOR_DB_PATH: str = "./chroma_db"

    class Config:
        env_file = ".env"

settings = Settings()

engine = create_engine(settings.PG_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()