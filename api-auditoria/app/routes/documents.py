"""
MÓDULO: RUTAS API - CARGA DE DOCUMENTOS
RESPONSABLE: Desarrollador Backend / Pipeline RAG.
"""

from fastapi import APIRouter, UploadFile, File
import shutil
import os
from langchain_community.document_loaders import PyPDFLoader
import traceback

router = APIRouter(prefix="/api/v1/documents", tags=["Documentos"])

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    print(f"📥 Recibiendo archivo: {file.filename}...")
    temp_file_path = f"temp_{file.filename}"
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    extracted_text = ""
    try:
        filename_lower = file.filename.lower()
        if filename_lower.endswith(".pdf"):
            print("📖 Leyendo el PDF...")
            loader = PyPDFLoader(temp_file_path)
            documents = loader.load()
            extracted_text = "\n\n".join([doc.page_content for doc in documents])
        elif filename_lower.endswith(".docx") or filename_lower.endswith(".doc"):
            print("📖 Leyendo el Word...")
            try:
                from docx import Document
                doc = Document(temp_file_path)
                extracted_text = "\n".join([para.text for para in doc.paragraphs])
            except ImportError:
                print("⚠️ python-docx no está instalado. Usando docx2txt o lectura en bruto...")
                try:
                    import docx2txt
                    extracted_text = docx2txt.process(temp_file_path)
                except ImportError:
                    extracted_text = "Error: Las librerías para procesar documentos Word no están instaladas (python-docx o docx2txt)."
        else:
            raise ValueError("Formato de archivo no soportado. Solo PDF o Word.")
            
        print("✅ Texto extraído con éxito. Guardando en PostgreSQL...")
        
        from app.database import SessionLocal
        from app.models import DocumentRecord
        
        db = SessionLocal()
        doc = db.query(DocumentRecord).filter(DocumentRecord.filename == file.filename).first()
        if doc:
            doc.content = extracted_text
        else:
            doc = DocumentRecord(filename=file.filename, content=extracted_text)
            db.add(doc)

        db.commit()
        db.close()

        os.remove(temp_file_path)
        
        return {
            "filename": file.filename,
            "status": "Recibido con éxito",
            "extracted_text": f"[PG_DOC_REF:{file.filename}]",
            "detail": f"Documento guardado en base de datos. Tamaño del texto: {len(extracted_text)} caracteres."
        }
    except Exception as e:
        print(f"❌ Error al procesar: {traceback.format_exc()}")
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return {
            "filename": file.filename,
            "status": "Error",
            "extracted_text": "",
            "detail": str(e)
        }

@router.get("/count")
async def count_documents():
    """Endpoint de prueba modificado (ya no usa ChromaDB)"""
    return {"total_chunks_en_chromadb": 0, "message": "Los documentos ahora se guardan en el localStorage del cliente."}