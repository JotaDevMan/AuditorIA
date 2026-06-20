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
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

class Settings(BaseSettings):
    # Esto leerá las variables de tu archivo .env automáticamente
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = "AQ.Ab8RN6JmPQgcYzjO5L7hkEiCCS8tHcJVY6TB6qHvjAsq8-2lWQ"
    DATABASE_URL: str = "postgresql://postgres:admin@localhost/auditoria"
    VECTOR_DB_PATH: str = "./chroma_db"

    class Config:
        env_file = ".env"

settings = Settings()

engine = create_engine(
    settings.DATABASE_URL
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()