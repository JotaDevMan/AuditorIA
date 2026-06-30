from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=True) # Optional if logging in with Google
    picture = Column(String, nullable=True)
    auth_provider = Column(String, default="local") # "local" or "google"
    role = Column(String, default="usuario")

    access_logs = relationship("AccessLog", back_populates="user")
    conversations = relationship("Conversation", back_populates="user")

class AccessLog(Base):
    __tablename__ = "access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, ForeignKey("users.email"))
    action = Column(String) # "login" or "logout"
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="access_logs")

class DocumentRecord(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content = Column(Text)
    user_email = Column(String, index=True, nullable=True) # Para vincular a usuario común
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, index=True) # UUID string
    user_email = Column(String, ForeignKey("users.email"))
    title = Column(String, default="Nueva Conversación")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    sender = Column(String) # "user" or "ai"
    text = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")
