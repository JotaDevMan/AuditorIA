from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models import User

router = APIRouter(prefix="/api/v1/auth", tags=["Autenticación"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # NOTA: En un entorno real se debe hashear la contraseña.
    # Aquí se utiliza texto plano para coincidir con tu requerimiento básico
    user = db.query(User).filter(User.username == req.username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
        
    if user.password != req.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")
        
    return {
        "status": "success",
        "message": "Inicio de sesión exitoso",
        "username": user.username,
        "role": user.role
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
