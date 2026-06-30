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
    PG_DATABASE_URL: str = "postgresql+psycopg://postgres:0000@localhost:5432/auditoria_db"
    CHROMA_API_KEY: str = "ck-CWeTRxe1wxYb8MXwXCnEKMxvS1bvTXMi66ZXa58JmX46"
    CHROMA_TENANT: str = "5e999801-7e09-4ce9-833d-d19183575415"
    CHROMA_DATABASE: str = "AuditorIA"
    SMTP_USER: str = "auditoriaainacap@gmail.com"
    SMTP_PASSWORD: str = "ucsc rqef tfup jiif"
    HUGGINGFACE_API_KEY: str = "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"
    COHERE_API_KEY: str = "ol85f10OwVXX27J6vdX3k8kJlnYMVwJr9996oWww"

    class Config:
        env_file = ".env"
        extra = "ignore"

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