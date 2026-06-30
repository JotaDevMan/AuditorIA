"""
MÓDULO: RUTAS API - ENDPOINTS DEL CHAT
RESPONSABLE: Desarrollador Backend / Integración.
"""

from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import settings, get_db
from app.models import Conversation, Message
import os
import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import re

def parse_markdown_to_html(md_text: str) -> str:
    # Negritas
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', md_text)
    
    lines = html.split('\n')
    out = []
    in_table = False
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('|') and stripped.endswith('|'):
            if '---' in stripped:
                continue
            cells = [c.strip() for c in stripped.strip('|').split('|')]
            if not in_table:
                out.append('<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">')
                out.append('<thead><tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">')
                for c in cells:
                    out.append(f'<th style="padding: 12px 15px; text-align: left; font-size: 14px; color: #334155; border-right: 1px solid #e2e8f0;">{c}</th>')
                out.append('</tr></thead><tbody>')
                in_table = True
            else:
                out.append('<tr style="border-bottom: 1px solid #f1f5f9;">')
                for c in cells:
                    out.append(f'<td style="padding: 12px 15px; font-size: 14px; color: #475569; border-right: 1px solid #f1f5f9;">{c}</td>')
                out.append('</tr>')
        else:
            if in_table:
                out.append('</tbody></table></div>')
                in_table = False
            
            if stripped == '':
                out.append('<div style="height: 10px;"></div>')
            elif stripped.startswith('- '):
                out.append(f'<li style="margin-left: 20px; color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 5px;">{stripped[2:]}</li>')
            elif stripped.startswith('### '):
                out.append(f'<h3 style="color: #0f172a; margin-top: 25px; margin-bottom: 10px; font-size: 18px;">{stripped[4:]}</h3>')
            elif stripped.startswith('## '):
                out.append(f'<h2 style="color: #0f172a; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; font-size: 22px;">{stripped[3:]}</h2>')
            elif stripped.startswith('# '):
                out.append(f'<h1 style="color: #0f172a; margin-top: 30px; margin-bottom: 15px; font-size: 26px;">{stripped[2:]}</h1>')
            else:
                out.append(f'<p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 10px 0;">{line}</p>')
    
    if in_table:
        out.append('</tbody></table></div>')
        
    return "\n".join(out)

def send_email_async(to_email: str, subject: str, content: str):
    """Función para enviar correo electrónico de forma real y evitar SPAM."""
    sender_email = settings.SMTP_USER
    sender_password = settings.SMTP_PASSWORD
    
    if sender_email == "tu_correo@gmail.com":
        print("⚠️ [ADVERTENCIA] No se configuró SMTP_USER en el .env, usando simulación.")
        return

    try:
        # Usar alternative para mandar texto plano y HTML (Evita caer en SPAM)
        msg = MIMEMultipart("alternative")
        msg['From'] = f"AuditorIA <{sender_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject

        # Texto plano (Alternativa para clientes sin HTML o filtros antispam)
        text_content = content
        part1 = MIMEText(text_content, 'plain')
        msg.attach(part1)

        # HTML Precioso
        parsed_html = parse_markdown_to_html(content)
        
        # Cargar imagen en base64
        import base64
        img_b64 = ""
        try:
            path = r"c:\Users\angel\OneDrive\Escritorio\AuditrIA GitHUB\AuditorIA\front-auditoria\public\AuditorIA.jpg"
            with open(path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode('utf-8')
        except Exception:
            pass

        img_tag = f'<img src="data:image/jpeg;base64,{img_b64}" alt="AuditorIA" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">' if img_b64 else ''

        html_template = f"""
        <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" max-width="800px" border="0" cellspacing="0" cellpadding="0" style="background: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; max-width: 800px; margin: 0 auto;">
                  
                  <!-- HEADER -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 35px 30px; text-align: center;">
                      {img_tag}
                      <h1 style="color: white; margin: 0; font-size: 32px; letter-spacing: 1px; font-weight: 800;">Auditor<span style="color: #f472b6;">IA</span></h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 10px 0 0 0; font-size: 16px;">Tu Asistente de Auditoría Inteligente</p>
                    </td>
                  </tr>

                  <!-- BODY -->
                  <tr>
                    <td style="padding: 40px 35px;">
                      {parsed_html}
                    </td>
                  </tr>

                  <!-- FOOTER -->
                  <tr>
                    <td style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
                      <p style="color: #94a3b8; font-size: 13px; margin: 0; line-height: 1.5;">
                        Este es un documento oficial generado automáticamente por la inteligencia artificial de AuditorIA.<br>
                        Por favor no respondas a este mensaje.
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """
        
        part2 = MIMEText(html_template, 'html')
        msg.attach(part2)

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        print(f"✅ Correo enviado exitosamente a {to_email}")
    except Exception as e:
        print(f"❌ Error enviando correo: {e}")

# Variables globales para evitar recargar el modelo de embeddings en cada petición
_embeddings_model = None
_vectorstore_iso = None

from app.rag.vector_store import get_vector_store

def get_vectorstore_iso():
    global _vectorstore_iso
    if _vectorstore_iso is None:
        _vectorstore_iso = get_vector_store()
    return _vectorstore_iso

router = APIRouter(prefix="/api/v1/chat", tags=["Chat"])

class ChatMessage(BaseModel):
    message: str
    context: str = None
    history: list = []
    user_email: str = None

@router.post("")
def handle_chat_message(chat_msg: ChatMessage, background_tasks: BackgroundTasks):
    if settings.GEMINI_API_KEY:
        os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY
    
    # 1. Usar el contexto enviado por el frontend (desde localStorage)
    context_text = chat_msg.context if chat_msg.context else ""
    vs_iso = get_vectorstore_iso()
    
    # Recuperar normativas ISO del conocimiento principal siempre
    try:
        results_iso = vs_iso.similarity_search(chat_msg.message, k=6)
        iso_text = "\n...".join([r.page_content for r in results_iso]) if results_iso else ""
    except Exception as e:
        print("Error en ChromaDB:", e)
        iso_text = ""
        
    # Recuperar contexto del documento del usuario desde PostgreSQL (sin Chroma)
    if "[PG_DOC_REF:" in context_text:
        import re
        from app.database import SessionLocal
        from app.models import DocumentRecord
        match = re.search(r"\[PG_DOC_REF:(.+?)\]", context_text)
        if match:
            filename = match.group(1)
            db = SessionLocal()
            doc = db.query(DocumentRecord).filter(DocumentRecord.filename == filename).first()
            db.close()
            
            if doc:
                print(f"🔍 Leyendo el documento completo del usuario desde PostgreSQL: {filename}")
                # Estamos usando Cohere (Command-R) que soporta hasta 128k tokens, no truncamos el documento.
                doc_text = doc.content
                context_text = f"[CONTENIDO COMPLETO DEL DOCUMENTO]:\n{doc_text}"
    else:
        context_text = "(No hay documento adjunto.)"

    # Construir historial de la conversación aislando los errores o faltas de conocimiento previas
    history_text = ""
    if chat_msg.history:
        history_text = "\n[HISTORIAL RECIENTE DE LA CONVERSACIÓN]:\n"
        for msg in chat_msg.history:
            text = msg.get('text', '')
            # Si el mensaje anterior fue "no lo sé", lo borramos del historial para que no se sesgue
            if "actualmente no poseo información" in text or "Lo siento" in text:
                continue
            role = "Usuario" if msg.get("sender") == "user" else "AuditorIA"
            history_text += f"{role}: {text}\n"

    system_prompt = f"""You are AuditorIA, an expert assistant in IT auditing, cybersecurity, and IT regulations (like ISO).
CRITICAL RULE: You MUST reply in the EXACT SAME LANGUAGE the user uses. If the user writes in English (e.g. "hello", "hi"), you MUST reply entirely in English. If they write in Spanish, reply in Spanish.

REGLAS DE ORO / CORE RULES (MUST BE STRICTLY FOLLOWED):
1. LANGUAGE MATCHING & GREETINGS: Si el usuario te habla en inglés (ej. "hello"), DEBES responder 100% en inglés. Si te habla en español, responde en español. Si el usuario te saluda Y te hace una pregunta, responde a la pregunta. NUNCA respondas solo con un saludo si el usuario te está pidiendo algo. No copies el mensaje inicial ni repitas tus capacidades.
2. USO DEL CONOCIMIENTO (RAG ESTRICTO): Utiliza EXCLUSIVAMENTE la información provista abajo en [CONOCIMIENTO DE NORMAS ISO] o [DOCUMENTO DEL USUARIO]. Tienes PROHIBIDO usar tu conocimiento pre-entrenado.
3. LÍMITE DE DOMINIO Y ANTI-ALUCINACIÓN EXTREMA: Si el usuario te hace una pregunta o te pide información sobre cualquier tema (como normativas ISO, conceptos de calidad, software o cualquier otro tema técnico o general) y esa información NO ESTÁ de forma clara y explícita en el texto de las [BASES DE CONOCIMIENTO] (ChromaDB o el documento del usuario) provistas en este prompt, TIENES ESTRICTAMENTE PROHIBIDO responder o explicar el tema usando tu conocimiento pre-entrenado. En ese caso, debes responder EXACTAMENTE: "Lo siento, la información solicitada no se encuentra en mis documentos ni en mi base de datos de normativas de auditoría." (EXCEPCIÓN CRÍTICA: Si el usuario te envía código de programación en su mensaje de texto, te pide explicar un fragmento de código, auditarlo o resolver una duda de desarrollo de software, SÍ debes responder y auditar/explicar el código utilizando tu conocimiento técnico, ignorando esta prohibición).
4. PLANES DE AUDITORÍA (ALINEACIÓN HIPER-PERSONALIZADA): Cuando el usuario solicite un plan de auditoría, TUS FILAS NO PUEDEN SER GENÉRICAS ("Análisis de Requerimientos", "Diseño del Sistema"). Deben referenciar los detalles exactos del Word/PDF.
   - FUSIÓN RAG-DOCUMENTO: Analiza el [DOCUMENTO DEL USUARIO] aplicando las normas y estándares del [CONOCIMIENTO DE NORMAS ISO].
   - MÉTODO: Indica explícitamente al inicio qué método de auditoría de software utilizas y CÓMO se aplica específicamente al sistema del documento.
   - TABLA OBLIGATORIA: Usa esta tabla Markdown: | Fase de Auditoría | Requerimiento de evaluación | Diseño de evaluación | Evidencia Esperada | Responsable |.
   - AMARRE DE LA EVALUACIÓN: Las columnas "Fase de Auditoría", "Requerimiento de evaluación" y "Diseño de evaluación" deben llevar nombres y funcionalidades específicas mencionadas en el [DOCUMENTO DEL USUARIO]. Si el documento habla de "Barbería", escribe los requerimientos y diseños enfocados en el negocio/software de la barbería.
   - PROHIBICIÓN: Tienes PROHIBIDO usar frases de cajón sin atarlas al documento subido.
5. ENVÍO DE CORREO: NUNCA envíes el correo de forma automática. SÓLO si el usuario TE LO PIDE EXPLÍCITAMENTE (por ejemplo: "mándamelo a mi correo", "envíalo a mi correo", "perfecto mándamelo"), debes confirmar y añadir EXACTAMENTE el código `[ENVIAR_CORREO]` al final de tu respuesta. Su correo es: {chat_msg.user_email if chat_msg.user_email else "No ha iniciado sesión"}.
6. AUDITORÍA Y EXPLICACIÓN DE CÓDIGO FUENTE: Si el [DOCUMENTO DEL USUARIO] contiene código fuente, o si el usuario incluye fragmentos de código directamente en su mensaje, DEBES analizarlo, explicarlo, auditarlo y sugerir mejoras. En este caso específico de programación y desarrollo de software, sí puedes usar tu conocimiento general y explicar conceptos o buenas prácticas para optimizar el código, exceptuándolo de las restricciones del límite de dominio.
"""

    if not iso_text.strip() and "(No hay documento adjunto" in context_text:
        warning_block = """
⚠️ INSTRUCCIÓN FINAL OBLIGATORIA ANTES DE RESPONDER: 
Currently NO TIENES INFORMACIÓN en tus bases de conocimiento (ChromaDB está vacío y no hay documento adjunto). Si la pregunta del usuario NO es un simple saludo (como "hola", "buenos días") y NO se refiere a auditar, explicar o analizar un fragmento de código que el usuario te envíe, TIENES PROHIBIDO RESPONDER usando tu conocimiento general. Debes decir exactamente: "Lo siento, la base de datos de conocimiento está vacía y no has adjuntado ningún documento para analizar." (EXCEPCIÓN: Si el usuario te envía código en su mensaje o te pregunta por el funcionamiento de un fragmento de código, sí debes responder ayudándole con ese código).
"""
    else:
        warning_block = """
⚠️ INSTRUCCIÓN FINAL OBLIGATORIA ANTES DE RESPONDER: 
1. GENERACIÓN DE PLANES Y ANÁLISIS: Si el usuario te pide analizar el documento adjunto o generar un plan de auditoría, DEBES HACERLO. Utiliza la información detallada del [DOCUMENTO DEL USUARIO] y alinéala inteligentemente con las normativas del [CONOCIMIENTO DE NORMAS ISO].
2. RESPUESTAS DE CONOCIMIENTO: Si el usuario te hace una pregunta sobre normativas, conceptos de calidad, software o cualquier otro tema técnico, responde basándote ÚNICAMENTE en la información explícita de las [BASES DE CONOCIMIENTO] (ChromaDB o el documento).
3. RESTRICCIÓN DE INFORMACIÓN Y ANTI-ALUCINACIÓN: Si la respuesta a la pregunta del usuario NO se encuentra de forma clara y explícita en las [BASES DE CONOCIMIENTO] (en el [CONOCIMIENTO DE NORMAS ISO] o en el [DOCUMENTO DEL USUARIO]), tienes ESTRICTAMENTE PROHIBIDO usar tu conocimiento externo o pre-entrenado para responder o inventar explicaciones (incluso si son temas técnicos, educativos o generales que no estén en los textos, como "INACAP" o "ISO 27001"). En su lugar, debes responder EXACTAMENTE: "Lo siento, la información solicitada no se encuentra en mis documentos ni en mi base de datos de normativas de auditoría." (EXCEPCIÓN: Si el usuario te envía un fragmento de código de programación en su mensaje o te pregunta por el funcionamiento de un código, debes ignorar esta prohibición y proceder a explicar, auditar o corregir el código según sea necesario).
4. AUDITORÍA DE CÓDIGO: Si el [DOCUMENTO DEL USUARIO] contiene código fuente, o si el usuario incluye fragmentos de código directamente en su mensaje, ignora la prohibición de usar conocimiento externo y procede a analizar, auditar y sugerir mejoras, correcciones o explicaciones detalladas para mejorar ese código.
"""

    user_prompt = f"""
[HISTORIAL RECIENTE / RECENT HISTORY]:
{history_text if history_text.strip() else "(No hay historial previo)"}

----------------------------------------
BASES DE CONOCIMIENTO / KNOWLEDGE BASES:

[CONOCIMIENTO DE NORMAS ISO / CHROMA DB PRINCIPAL]:
{iso_text if iso_text.strip() else "(VACÍO - NO HAY INFORMACIÓN DE CHROMADB)"}

[DOCUMENTO DEL USUARIO / USER DOCUMENT]:
{context_text}
----------------------------------------

PREGUNTA ACTUAL DEL USUARIO: {chat_msg.message}
{warning_block}
"""

    try:
        from langchain_core.messages import SystemMessage, HumanMessage
        try:
            from langchain_cohere import ChatCohere
        except ImportError:
            raise ImportError("Por favor instala 'langchain-cohere' ejecutando en la terminal: pip install langchain-cohere")
        
        llm = ChatCohere(
            cohere_api_key=settings.COHERE_API_KEY,
            model="command-r-08-2024",
            temperature=0.2
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = llm.invoke(messages)
        ai_response = response.content

        # --- EXTRAER Y MOSTRAR CONSUMO DE TOKENS ---
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
            tokens = response.usage_metadata
            print(f"\n📊 [CONSUMO DE TOKENS COHERE]")
            print(f"   - Tokens de entrada (Prompt): {tokens.get('input_tokens', 0)}")
            print(f"   - Tokens de salida (Respuesta): {tokens.get('output_tokens', 0)}")
            print(f"   - Total consumidos: {tokens.get('total_tokens', 0)}\n")
        elif hasattr(response, 'response_metadata') and 'token_count' in response.response_metadata:
            token_data = response.response_metadata.get('token_count', {})
            print(f"\n📊 [CONSUMO DE TOKENS COHERE]")
            print(f"   - Tokens de entrada (Prompt): {token_data.get('prompt_tokens', token_data)}")
            print(f"   - Tokens de salida (Respuesta): {token_data.get('completion_tokens', '?')}")
            print(f"   - Total consumidos: {token_data.get('total_tokens', '?')}\n")

        # --- LÓGICA DE ENVÍO DE CORREO ---
        if "[ENVIAR_CORREO]" in ai_response:
            ai_response = ai_response.replace("[ENVIAR_CORREO]", "").strip()
            
            sender_email = settings.SMTP_USER
            
            if not chat_msg.user_email:
                ai_response += "\n\n---\n⚠️ **Aviso:** No pude enviar el correo porque no has iniciado sesión con una cuenta de Gmail o un correo válido."
            elif sender_email == "tu_correo@gmail.com" or not sender_email:
                ai_response += "\n\n---\n⚠️ **Error de Servidor:** No se ha configurado el remitente (SMTP_USER y SMTP_PASSWORD) en el archivo `.env` del backend. Contacta al administrador."
            else:
                # Disparamos el envío en segundo plano para eficiencia máxima
                background_tasks.add_task(
                    send_email_async,
                    to_email=chat_msg.user_email,
                    subject="AuditorIA: Documento Generado",
                    content=ai_response
                )
                ai_response += f"\n\n---\n📧 **Notificación:** La información ha sido procesada y enviada a tu correo asociado (**{chat_msg.user_email}**). Revisa tu bandeja de entrada."
            
    except Exception as e:
        error_msg = str(e)
        print(f"Error conectando a Cohere: {error_msg}")
        
        if "429" in error_msg or "Too Many Requests" in error_msg or "rate limit" in error_msg.lower() or "quota" in error_msg.lower():
            ai_response = "⚠️ **Límite de Consumo Alcanzado**\n\nHas llegado al límite de peticiones permitidas por la API de Cohere (Error 429). Si usas la capa gratuita, por favor espera un minuto y vuelve a intentarlo. Puedes revisar tu cuota restante en tu [Dashboard de Cohere](https://dashboard.cohere.com/usage)."
        else:
            ai_response = f"Ocurrió un error conectando a Cohere: {error_msg}\n\n💡 **Nota:** Verifica que tu COHERE_API_KEY esté correctamente configurada en el archivo .env o en settings."

    return {
        "sender": "ai",
        "text": ai_response
    }

class SyncRequest(BaseModel):
    user_email: str
    conversations: list

@router.get("/history/{user_email}")
def get_history(user_email: str, db: Session = Depends(get_db)):
    convs = db.query(Conversation).filter(Conversation.user_email == user_email).all()
    result = []
    for c in convs:
        msgs = sorted(c.messages, key=lambda m: m.id)
        result.append({
            "id": c.id,
            "title": c.title,
            "createdAt": int(c.created_at.timestamp() * 1000) if c.created_at else 0,
            "messages": [
                {
                    "id": m.id,
                    "sender": m.sender,
                    "text": m.text,
                    "time": m.timestamp.isoformat() if m.timestamp else ""
                } for m in msgs
            ]
        })
    return {"status": "success", "conversations": result}

@router.post("/sync")
def sync_history(req: SyncRequest, db: Session = Depends(get_db)):
    # 1. Obtener IDs de conversaciones del usuario
    conv_ids = db.query(Conversation.id).filter(Conversation.user_email == req.user_email).all()
    conv_ids = [c[0] for c in conv_ids]
    
    # Agregar también cualquier ID de conversación entrante para evitar conflictos de llave primaria duplicada
    conv_ids_set = set(conv_ids)
    for c_data in req.conversations:
        c_id = c_data.get("id")
        if c_id:
            conv_ids_set.add(str(c_id))
            
    conv_ids_list = list(conv_ids_set)
    
    # 2. Borrar primero los mensajes para evitar error de llave foránea
    if conv_ids_list:
        db.query(Message).filter(Message.conversation_id.in_(conv_ids_list)).delete(synchronize_session=False)
        
    # 3. Borrar las conversaciones
    if conv_ids_list:
        db.query(Conversation).filter(Conversation.id.in_(conv_ids_list)).delete(synchronize_session=False)
    db.commit()
    
    seen_convs = set()
    for c_data in req.conversations:
        c_id = str(c_data.get("id"))
        if c_id in seen_convs:
            continue
        seen_convs.add(c_id)
        
        created_at_ts = c_data.get("createdAt", int(datetime.datetime.utcnow().timestamp() * 1000)) / 1000.0
        c_obj = Conversation(
            id=c_id,
            user_email=req.user_email,
            title=c_data.get("title", "Nueva Conversación"),
            created_at=datetime.datetime.fromtimestamp(created_at_ts)
        )
        db.add(c_obj)
        
        for msg in c_data.get("messages", []):
            m_obj = Message(
                conversation_id=c_id,
                sender=msg.get("sender"),
                text=msg.get("text"),
                timestamp=datetime.datetime.utcnow()
            )
            db.add(m_obj)
            
    db.commit()
    return {"status": "success"}

from fastapi import UploadFile, File
import shutil

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    import os
    import requests
    from dotenv import load_dotenv
    load_dotenv()
    
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return {"status": "error", "message": "Falta configurar GROQ_API_KEY en tu archivo .env"}
        
    temp_path = f"temp_audio_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        with open(temp_path, "rb") as audio_file:
            res = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {groq_key}"},
                files={"file": (file.filename, audio_file, file.content_type or "audio/webm")},
                data={"model": "whisper-large-v3-turbo", "language": "es", "response_format": "json"}
            )
            
        os.remove(temp_path)
        
        if res.status_code == 200:
            return {"status": "success", "text": res.json().get("text", "")}
        else:
            return {"status": "error", "message": res.text}
            
    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {"status": "error", "message": str(e)}