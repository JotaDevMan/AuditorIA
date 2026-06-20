"""
MÓDULO: CONFIGURACIÓN GLOBAL Y VARIABLES DE ENTORNO
RESPONSABLE: Líder del proyecto (Juan Pablo).

¿QUÉ CONFIGURAR AQUÍ?:
1. Mapear las credenciales críticas del archivo local '.env'.
2. Si se integra la base de datos tradicional, aquí se levantará la sesión de SQLAlchemy para conectarse a PostgreSQL.
"""

import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Esto leerá las variables de tu archivo .env automáticamente
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = "AQ.Ab8RN6JmPQgcYzjO5L7hkEiCCS8tHcJVY6TB6qHvjAsq8-2lWQ"
    DATABASE_URL: str = "ck-6sEcFHhCZk4iFdQLmvxpXiU8DgHKc2zZk2G61RuCUBLH"
    VECTOR_DB_PATH: str = "./chroma_db"

    class Config:
        env_file = ".env"

settings = Settings()