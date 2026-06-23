from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User
import uuid

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])

# Almacenamiento en memoria para tokens CSRF válidos (Para demostración SaaS)
csrf_tokens = set()

@router.get("/csrf-token")
def get_csrf_token():
    token = str(uuid.uuid4())
    csrf_tokens.add(token)
    return {"csrf_token": token}

class LoginRequest(BaseModel):
    username: str
    password: str

class GoogleLoginRequest(BaseModel):
    email: str
    name: str = None
    picture: str = None

@router.post("/login")
def login(req: LoginRequest, x_csrf_token: str = Header(None), db: Session = Depends(get_db)):
    # 🛡️ VALIDACIÓN CSRF
    if not x_csrf_token or x_csrf_token not in csrf_tokens:
        raise HTTPException(status_code=403, detail="Fallo de seguridad CSRF: Token inválido o ausente.")
    
    # Consumir el token para que sea de un solo uso
    csrf_tokens.remove(x_csrf_token)

    # NOTA: En un entorno real se debe hashear la contraseña.
    # Aquí se utiliza texto plano para coincidir con tu requerimiento básico
    user = db.query(User).filter(User.username == req.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
    if user.password != req.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
    # Registrar log de acceso
    from app.models import AccessLog
    if user.email:
        log = AccessLog(user_email=user.email, action="login")
        db.add(log)
        db.commit()
        
    return {
        "status": "success",
        "message": "Inicio de sesión exitoso",
        "username": user.username,
        "email": user.email,
        "role": user.role
    }

@router.post("/login/google")
def google_login(req: GoogleLoginRequest, db: Session = Depends(get_db)):
    from app.models import AccessLog
    
    user = db.query(User).filter(User.email == req.email).first()
    
    if not user:
        # Register them automatically
        username = req.email.split('@')[0]
        # Check if username exists, append a number if so
        base_username = username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User(username=username, email=req.email, auth_provider="google", role="usuario", picture=req.picture)
        db.add(user)
        db.commit()
        db.refresh(user)
        
    # Registrar log de acceso
    log = AccessLog(user_email=user.email, action="login")
    db.add(log)
    db.commit()
    
    return {
        "status": "success",
        "message": "Inicio de sesión con Google exitoso",
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "picture": user.picture
    }

@router.post("/register")
def register(req: LoginRequest, role: str = "usuario", db: Session = Depends(get_db)):
    user_exist = db.query(User).filter(User.username == req.username).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
        
    new_user = User(username=req.username, password=req.password, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"status": "success", "message": f"Usuario {new_user.username} creado con rol {new_user.role}"}
