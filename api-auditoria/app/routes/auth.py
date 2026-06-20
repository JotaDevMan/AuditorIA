from fastapi import APIRouter, Depends, HTTPException

from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.user import User
from app.database import SessionLocal

from app.services.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "user"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/register")
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):

    user_exists = db.query(User).filter(
        User.username == request.username
    ).first()

    if user_exists:

        raise HTTPException(
            status_code=400,
            detail="Usuario ya existe"
        )

    user = User(
        username=request.username,
        password_hash=hash_password(
            request.password
        ),
        role=request.role
    )

    db.add(user)

    db.commit()

    return {
        "message": "Usuario creado"
    }


@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.username == request.username
    ).first()

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    if not verify_password(
        request.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Credenciales inválidas"
        )

    token = create_access_token(
        {
            "sub": user.username,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "role": user.role
    }