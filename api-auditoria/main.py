"""
MÓDULO CENTRAL: PUNTO DE ENTRADA DE LA API (main.py)
RESPONSABLE: Líder del proyecto (Juan Pablo) / Integrador Backend.

¿QUÉ HACE ESTE ARCHIVO Y QUÉ HACER AQUÍ?:
1. Es el corazón del servidor. Arranca FastAPI y levanta el servidor web Uvicorn.
2. Configura los permisos de CORS para que el Frontend (puerto 3000) pueda comunicarse con la API.
3. AQUÍ SE REGISTRAN LAS RUTAS: Cada vez que el equipo cree un archivo nuevo en 'app/routes/', 
   se debe importar e incluir aquí usando 'app.include_router()'.
   
⚠️ NOTA PARA EL EQUIPO: No programar lógica de negocio, consultas a ChromaDB ni llamados a OpenAI aquí. 
Cada cosa tiene su carpeta correspondiente dentro de 'api-auditoria/app/...'
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import chat, documents, auth
from app.database import engine, Base, SessionLocal
from app.models import User

# Crear las tablas en la base de datos PostgreSQL
Base.metadata.create_all(bind=engine)

def seed_users():
    """Crea los usuarios por defecto si no existen."""
    db = SessionLocal()
    try:
        default_users = [
            {"username": "usuario1", "password": "usuario1", "role": "usuario", "email": "usuario1@auditoria.local"},
            {"username": "admin123", "password": "admin123", "role": "administrador", "email": "admin@auditoria.local"},
        ]
        for u in default_users:
            exists = db.query(User).filter(User.username == u["username"]).first()
            if not exists:
                db.add(User(**u))
        db.commit()
        print("Usuarios por defecto verificados en PostgreSQL.")
    except Exception as e:
        print(f"Error en seed de usuarios: {e}")
    finally:
        db.close()

seed_users()

app = FastAPI(
    title="AuditorIA API",
    description="Orquestador central para la planificación de auditorías de software bajo normas ISO",
    version="1.0.0"
)

# Configuración de CORS para conectar con Next.js de forma local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:90", "http://localhost:80", "http://localhost", "http://127.0.0.1"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión de módulos de rutas independientes
app.include_router(chat.router)
app.include_router(documents.router)
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "AuditorIA Backend",
        "version": "1.0-Beta"
    }