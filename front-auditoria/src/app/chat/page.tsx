"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

// ── CONFIG ──
const API_BASE = "http://127.0.0.1:8000/api/v1";
const LOGO_SRC = "/AuditorIA.jpg";
const DOCS_KEY = "auditoria_docs_v1";   // localStorage para documentos subidos (testing)
const STORE_KEY = "auditoria_convs_v1";
const ACTIVE_KEY = "auditoria_active_v1";

const getWelcomeMsg = (userName: string = "") => {
  const nameDisplay = userName ? ` **${userName.split(' ')[0]}**` : "";
  return `¡Hola${nameDisplay}! Encantado de saludarte. Dime, ¿qué necesitas?

Puedo ayudarte a:
- 🛡️ **Auditar sistemas** analizando tus documentos PDF/Word
- 🔍 **Responder preguntas** sobre normas ISO y frameworks (basado en mi conocimiento)
- 📋 **Generar planes de auditoría** completos con fases, evidencias y responsables

Hasta donde esté mi capacidad de conocimiento, haré todo lo posible para asistirte. ¿Por dónde empezamos?`;
};

// ── TYPES ──
interface Message { id: number; sender: "user" | "ai"; text: string; time: string; isNew?: boolean; file?: { name: string; size: number }; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: number; }
interface DocEntry { name: string; size: number; uploadedAt: number; convId: string; content?: string; }

// ── MARKDOWN PARSER (XSS SECURE) ──
function parseMD(raw: string, typing: boolean = false): string {
  // 1. Escapar HTML base para neutralizar <script> e inyecciones directas
  let h = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 2. Bloquear links o imágenes con payload javascript: o eventos on*
  h = h.replace(/javascript:/gi, "blocked:");
  h = h.replace(/on\w+=/gi, "blocked-event=");

  // 2.5 Permitir explícitamente etiquetas <br> seguras (útil para saltos de línea dentro de tablas Markdown)
  h = h.replace(/&lt;br\s*\/?&gt;/gi, "<br/>");

  // 3. Procesar Markdown a HTML
  h = h.replace(/```([\s\S]*?)(?:```|$)/g, (_, c) => `<pre><code>${c.trim()}</code></pre>`);
  h = h.replace(/`([^`\n]+)(?:`|$)/g, "<code>$1</code>");
  h = h.replace(/\*\*([^*\n]+?)(?:\*\*|$)/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*\n]+?)(?:\*|$)/g, "<em>$1</em>");

  h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  h = h.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  h = h.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  h = h.replace(/^---$/gm, "<hr/>");
  h = h.replace(/^[-*] (.+)$/gm, "<li>$1</li>");
  h = h.replace(/(<li>[\s\S]*?<\/li>)/g, m => `<ul>${m}</ul>`);
  h = h.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // 4. TABLAS MARKDOWN
  // Buscar filas que empiecen y terminen con '|'
  let inTable = false;
  let tableRows: string[] = [];
  
  h = h.replace(/^\|(.+)\|[ \t]*$/gm, (match, inner) => {
    if (/^[\-\s:|]+$/.test(inner)) return ''; // Ignorar fila separadora
    const cells = inner.split('|').map((c: string) => c.trim());
    return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join('')}</tr>`;
  });

  // Agrupar filas tr consecutivas (ignorando saltos de línea vacíos entre ellas)
  h = h.replace(/(?:<tr>[\s\S]*?<\/tr>\s*)+/g, match => {
    // split by </tr> and clean up
    let rows = match.split('</tr>').map(r => r.trim()).filter(r => r.startsWith('<tr>')).map(r => r + '</tr>');
    if (rows.length === 0) return match;
    
    let thead = rows.shift() || "";
    thead = thead.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
    let tbody = rows.join('');
    
    return `<div class="table-wrapper"><table class="md-table"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>\n`;
  });

  if (typing) h += '<span class="tcursor"></span>';

  h = h.replace(/\n{2,}/g, "</p><p>");
  h = `<p>${h}</p>`;
  h = h.replace(/\n/g, "<br/>");
  h = h.replace(/<p>\s*<\/p>/g, "");
  return h;
}

const animationProgress = new Map<number, number>();

// ── TYPEWRITER — renderiza Markdown progresivamente ──
function TypewriterMsg({ id, text, isNew, speed = 10, isCancelled, onStart, onEnd, onSavePartial }: { id: number; text: string; isNew?: boolean; speed?: number; isCancelled?: boolean; onStart?: (id: number) => void; onEnd?: (id: number) => void; onSavePartial?: (id: number, partialText: string) => void; }) {
  const startIdx = isNew ? (animationProgress.get(id) || 0) : text.length;
  const [shown, setShown] = useState(text.slice(0, startIdx));
  const [done, setDone] = useState(!isNew || startIdx >= text.length);

  useEffect(() => {
    if (!isNew || startIdx >= text.length) {
      setShown(text);
      setDone(true);
      animationProgress.set(id, text.length);
      return;
    }

    if (isCancelled) {
      setDone(true);
      if (onSavePartial) onSavePartial(id, shown);
      return;
    }

    let i = startIdx;
    setShown(text.slice(0, i));
    setDone(false);
    if (onStart) onStart(id);

    const iv = setInterval(() => {
      i += 3; // velocidad suave
      if (i > text.length) i = text.length;

      setShown(text.slice(0, i));
      animationProgress.set(id, i); // guarda progreso exacto

      if (i >= text.length) {
        clearInterval(iv);
        setTimeout(() => {
          setDone(true);
          if (onEnd) onEnd(id);
        }, 400);
      }
    }, speed);

    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, text, isNew, speed, isCancelled]);

  return <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMD(shown, !done) }} />;
}

// ── HELPERS ──
const ts = () => new Date().toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: "2-digit", minute: "2-digit", hour12: false });
const uid = () => Math.random().toString(36).slice(2);

function loadConvs(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function saveConvs(c: Conversation[]) { localStorage.setItem(STORE_KEY, JSON.stringify(c)); }

function loadDocs(): DocEntry[] {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || "[]"); } catch { return []; }
}
function saveDocs(d: DocEntry[]) { localStorage.setItem(DOCS_KEY, JSON.stringify(d)); }

function formatTime(isoString: string) {
  if (!isoString) return "";
  if (!isoString.includes("T") && !isoString.includes("-")) return isoString;

  const date = new Date(isoString);
  const now = new Date();
  
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });

  if (isToday) return `Hoy a las ${timeStr}`;
  if (isYesterday) return `Ayer a las ${timeStr}`;
  
  return `${date.toLocaleDateString()} a las ${timeStr}`;
}

// ════════════════════════════════════════════════════════
export default function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [typingConvId, setTypingConvId] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<number | null>(null);
  const [cancelledMsgIds, setCancelledMsgIds] = useState<number[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedDoc, setUploadedDoc] = useState<DocEntry | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [user, setUser] = useState<any>(null);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // ── Init ──
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      window.location.href = '/';
      return;
    }
    const u = JSON.parse(userStr);
    setUser(u);

    if (u.email) {
      fetch(`${API_BASE}/chat/history/${u.email}`)
        .then(r => r.json())
        .then(data => {
          if (data.conversations && data.conversations.length > 0) {
            setConvs(data.conversations.map((c: any) => ({ ...c, messages: c.messages.map((m: any) => ({ ...m, isNew: false })) })));
            const active = localStorage.getItem(ACTIVE_KEY);
            if (active && data.conversations.find((c: any) => c.id === active)) {
              setActiveId(active);
            } else {
              setActiveId(data.conversations[0].id);
            }
          } else {
            setConvs([]);
          }
          setIsHistoryLoaded(true);
        })
        .catch(e => {
          console.error("Error fetching history", e);
          setIsHistoryLoaded(true);
        });
    } else {
      let stored = loadConvs();
      let aid = localStorage.getItem(ACTIVE_KEY) || "";
      if (stored.length > 0) {
        if (!stored.find(c => c.id === aid)) aid = stored[0].id;
      } else { aid = ""; }
      setConvs(stored.map(c => ({ ...c, messages: c.messages.map(m => ({ ...m, isNew: false })) })));
      setActiveId(aid);
      setIsHistoryLoaded(true);
    }
  }, []);

  useEffect(() => { 
    saveConvs(convs); 
    if (isHistoryLoaded && user?.email) {
      fetch(`${API_BASE}/chat/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_email: user.email, conversations: convs })
      }).catch(e => console.error("Error syncing", e));
    }
  }, [convs, isHistoryLoaded, user]);
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); else localStorage.removeItem(ACTIVE_KEY); }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convs, typingConvId, activeId]);
  useEffect(() => {
    const ta = taRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [inputText]);

  // Cargar doc activo del conv activo
  useEffect(() => {
    if (!activeId) return;
    const docs = loadDocs();
    const doc = docs.filter(d => d.convId === activeId).slice(-1)[0] ?? null;
    setUploadedDoc(doc);
  }, [activeId]);

  function makeNewConv(u?: any): Conversation {
    const userName = u?.name || u?.username || "";
    return { id: uid(), title: "Nueva conversación", createdAt: Date.now(), messages: [{ id: 1, sender: "ai", text: getWelcomeMsg(userName), time: ts() }] };
  }

  const activeConv = convs.find(c => c.id === activeId);
  const messages = activeConv?.messages ?? [];

  function addNewChat() {
    const c = makeNewConv(user);
    setConvs(prev => [c, ...prev]);
    setActiveId(c.id);
    setInputText("");
    setUploadedDoc(null);
    setPendingFile(null);
  }

  function reqDeleteConv(id: string) {
    setConfirmDialog({
      show: true,
      title: "Eliminar Chat",
      message: "¿Estás seguro de que deseas eliminar este chat? Esta acción no se puede deshacer.",
      onConfirm: () => {
        executeDeleteConv(id);
        setConfirmDialog(null);
      }
    });
  }

  function executeDeleteConv(id: string) {
    let newActiveId = activeId;
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) {
        if (next.length) {
          newActiveId = next[0].id;
          setActiveId(newActiveId);
        }
        else {
          newActiveId = "";
          setActiveId(newActiveId);
        }
      }
      return next;
    });
    // Limpiar docs de esa conversación
    saveDocs(loadDocs().filter(d => d.convId !== id));
  }

  function appendMsgToConv(id: string, newMsg: Message) {
    setConvs(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, messages: [...c.messages, newMsg] };
    }));
  }

  function triggerToast(msg: string) {
    setToast({ show: true, msg });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 4000);
  }

  // ── Generar Título Inteligente ──
  const generateTitle = async (id: string, prompt: string) => {
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `Genera un título muy corto (2 a 4 palabras) que resuma este mensaje, sin usar comillas, asteriscos ni puntos finales: "${prompt}"` })
      });
      const data = await res.json();
      let newTitle = data.text.trim().replace(/["\*]/g, '');
      if (newTitle) {
        setConvs(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      }
    } catch { /* ignorar error de título */ }
  };

  // ── Send mensaje al backend ──
  const sendToAPI = useCallback(async (prompt: string, targetConvId: string, isFirstMsg: boolean, contextText: string = "", chatHistory: any[] = []) => {
    setTypingConvId(targetConvId);
    abortControllerRef.current = new AbortController();
    try {
      const userStr = localStorage.getItem("user");
      const userObj = userStr ? JSON.parse(userStr) : null;
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, context: contextText, history: chatHistory, user_email: userObj?.email || null }),
        signal: abortControllerRef.current.signal
      });
      const data = await res.json();
      const aiMsg: Message = { id: Date.now() + 1, sender: "ai", text: data.text || "Sin respuesta del servidor.", time: ts(), isNew: true };

      appendMsgToConv(targetConvId, aiMsg);
      triggerToast("Tu petición ha sido respondida");

      // Si es el primer mensaje, generamos título inteligente de fondo
      if (isFirstMsg) generateTitle(targetConvId, prompt);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        appendMsgToConv(targetConvId, { id: Date.now() + 1, sender: "ai", text: "⚠️ **Generación cancelada por el usuario.**", time: ts(), isNew: false });
      } else {
        appendMsgToConv(targetConvId, { id: Date.now() + 1, sender: "ai", text: "❌ **Error de conexión** con el backend.", time: ts(), isNew: true });
      }
    } finally {
      setTypingConvId(null);
      abortControllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !pendingFile) || typingConvId || isUploading) return;

    let targetConvId = activeId;
    if (!targetConvId) {
      const c = makeNewConv(user);
      setConvs(prev => [c, ...prev]);
      setActiveId(c.id);
      targetConvId = c.id;
    }

    let finalPrompt = inputText.trim();

    let contextToSend = uploadedDoc?.content || "";

    // 1️⃣ Si hay archivo pendiente, extraer el texto desde el backend y guardarlo
    if (pendingFile) {
      const isCode = pendingFile.name.match(/\.(py|js|ts|jsx|tsx|html|css|json|sql|java|c|cpp|h|cs|sh|txt|php|rb|go|rs|kt|swift|yml|yaml|xml)$/i);
      
      if (isCode) {
        // Los archivos de código no se suben al backend/base de datos.
        // Se leyeron en local en handleUpload.
        contextToSend = uploadedDoc?.content || "";
        if (!finalPrompt) {
          finalPrompt = `He adjuntado el código fuente "${pendingFile.name}". Por favor, analízalo, audítalo y sugiere mejoras.`;
        }
      } else {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("file", pendingFile);
          const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
            method: "POST",
            body: formData
          });
          const uploadData = await uploadRes.json();
          const extractedText = uploadData.extracted_text || "";

          const entry: DocEntry = { name: pendingFile.name, size: pendingFile.size, uploadedAt: Date.now(), convId: targetConvId, content: extractedText };
          const docs = loadDocs().filter(d => d.convId !== targetConvId); // 1 doc por conv
          saveDocs([...docs, entry]);
          setUploadedDoc(entry);
          contextToSend = extractedText;

          if (!finalPrompt) finalPrompt = `He adjuntado el documento "${pendingFile.name}". Por favor, analízalo exhaustivamente y genera un plan de auditoría detallado en formato de tabla (Actividades, Responsable, Evidencia Esperada).`;
        } catch (err) {
          triggerToast("Error al procesar el archivo.");
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }
    }

    // 2️⃣ Guardar el mensaje del usuario con la UI del archivo adjunto
    const userMsg: Message = {
      id: Date.now(),
      sender: "user",
      text: inputText.trim(), // Solo el texto que escribió el usuario
      time: ts(),
      file: pendingFile ? { name: pendingFile.name, size: pendingFile.size } : undefined
    };

    appendMsgToConv(targetConvId, userMsg);

    setInputText("");
    setPendingFile(null);

    // 3️⃣ Preparar el prompt final para la IA
    const docContextMessage = contextToSend && !pendingFile ? `\n\n[Contexto activo de la conversación: Documento "${uploadedDoc?.name}"]` : "";
    const isFirstMsg = messages.length === 0 || messages.length === 1;
    const chatHistory = messages.map(m => ({ sender: m.sender, text: m.text })).slice(-10);

    await sendToAPI(finalPrompt + docContextMessage, targetConvId, isFirstMsg, contextToSend, chatHistory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, typingConvId, isUploading, activeId, messages, uploadedDoc, pendingFile, sendToAPI]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
  };

  const handleCancel = () => {
    if (typingConvId) {
      // Cancelar petición fetch
      abortControllerRef.current?.abort();
    } else if (typingMessageId) {
      // Cancelar typewriter animation
      setCancelledMsgIds(prev => [...prev, typingMessageId]);
      setTypingMessageId(null);
    }
  };

  // ── Control de Micrófono (Reconocimiento de voz vía Groq Whisper) ──
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleListening = async () => {
    if (isListening) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop(); // Esto dispara el evento onstop
      }
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");

        const baseText = taRef.current?.value || "";
        const prefix = baseText.trim() ? baseText + " " : "";
        setInputText(prefix + "⏳ Transcribiendo audio...");

        try {
          const res = await fetch(`${API_BASE}/chat/transcribe`, {
            method: "POST",
            body: formData
          });
          const data = await res.json();
          if (data.status === "success") {
            setInputText(prefix + data.text);
          } else {
            alert("Error al transcribir: " + data.message);
            setInputText(baseText);
          }
        } catch (e) {
          alert("Error enviando el audio al servidor.");
          setInputText(baseText);
        }
        
        // Apagar el micrófono
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono. Verifica los permisos del navegador.");
    }
  };

  // ── Seleccionar archivo — SOLO lo guarda en estado (pendingFile) ──
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeId) return;
    const file = e.target.files[0];

    // Validar tipo
    const isDoc = file.name.match(/\.(pdf|docx|doc)$/i);
    const isCode = file.name.match(/\.(py|js|ts|jsx|tsx|html|css|json|sql|java|c|cpp|h|cs|sh|txt|php|rb|go|rs|kt|swift|yml|yaml|xml)$/i);

    if (!isDoc && !isCode) {
      alert("Formato de archivo no soportado. Permite PDF, Word o archivos de código fuente.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    if (isCode) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const entry: DocEntry = {
          name: file.name,
          size: file.size,
          uploadedAt: Date.now(),
          convId: activeId,
          content: `[CONTENIDO DEL CÓDIGO FUENTE - ARCHIVO: ${file.name}]:\n\n${text}`
        };
        // Guardar localmente
        const docs = loadDocs().filter(d => d.convId !== activeId);
        saveDocs([...docs, entry]);
        setUploadedDoc(entry);
        triggerToast(`Código fuente "${file.name}" cargado en memoria para auditoría.`);
      };
      reader.readAsText(file);
    }

    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // ════════════════ RENDER ════════════════
  if (!isHistoryLoaded) {
    return <div style={{ height: "100vh", backgroundColor: "#020817" }} />;
  }

  return (
    <div className="chatgpt-root">

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '0.75rem' }}>
              <img src={LOGO_SRC} alt="AuditorIA" className="sidebar-logo-img" />
              {sidebarOpen && (
                <span className="sidebar-logo-text">
                  <span className="grad-text">Auditor</span><span className="grad-ia">IA</span>
                </span>
              )}
            </a>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} title="Colapsar sidebar">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {sidebarOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7" />}
            </svg>
          </button>
        </div>

        {/* Nuevo Chat */}
        <button className="new-chat-btn" onClick={addNewChat}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {sidebarOpen && <span>Nuevo Chat</span>}
        </button>

        {/* Historial */}
        {sidebarOpen && (
          <div className="sidebar-history">
            <p className="history-label">Conversaciones</p>
            <div className="history-list">
              {convs.map(conv => (
                <div
                  key={conv.id}
                  className={`history-item ${conv.id === activeId ? "history-item--active" : ""}`}
                  onClick={() => setActiveId(conv.id)}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="history-title">{conv.title}</span>
                  <button className="history-del" onClick={ev => { ev.stopPropagation(); reqDeleteConv(conv.id); }} title="Eliminar">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer — solo cuando está abierto */}
        {sidebarOpen && (
          <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 'auto' }}>
            {user && (
              <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', marginBottom: '10px' }}>
                {user.picture ? (
                  <img src={user.picture} alt="Profile" referrerPolicy="no-referrer" style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid rgba(56,189,248,0.3)' }} />
                ) : (
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.name || user.username}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.email || user.role}</div>
                </div>
              </div>
            )}
            <button className="logout-btn" onClick={() => { localStorage.removeItem("user"); window.location.href = '/'; }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </aside>

      {/* ══════════════ MAIN CHAT ══════════════ */}
      <main className="chat-main">
        
        {!activeId ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", animation: "msg-in-left 0.4s ease" }}>
            <img src={LOGO_SRC} alt="AuditorIA" style={{ width: "90px", borderRadius: "24px", marginBottom: "24px", boxShadow: "0 10px 40px rgba(99,102,241,0.2)" }} />
            <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "12px", color: "var(--text)" }}>Bienvenido a <span className="grad-text">Auditor</span><span className="grad-ia">IA</span></h2>
            <p style={{ color: "var(--muted)", marginBottom: "30px", fontSize: "15px" }}>Comienza creando una nueva conversación para auditar.</p>
            <button className="new-chat-btn" onClick={addNewChat} style={{ margin: 0, padding: "14px 28px", fontSize: "15px" }}>
              + Crear Nueva Auditoría
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="online-dot" />
            <span className="chat-header-title">{activeConv?.title ?? "AuditorIA"}</span>
          </div>
          <div className="chat-header-right">
            <span className="header-version">v1.0 Beta</span>
            <span className="online-badge">● Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="messages-area">
          {messages.map(msg => (
            <div key={msg.id} className={`msg-row ${msg.sender === "user" ? "msg-row--user" : "msg-row--ai"}`}>
              {msg.sender === "ai" && (
                <div className="ai-avatar">
                  <img src={LOGO_SRC} alt="AI" />
                </div>
              )}
              <div className={`bubble ${msg.sender === "user" ? "bubble--user" : "bubble--ai"}`}>

                {/* Visualización elegante del archivo adjunto */}
                {msg.file && (
                  <div className="msg-file-attachment">
                    <div className="msg-file-icon">
                      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </div>
                    <div className="msg-file-details">
                      <span className="msg-file-name">{msg.file.name}</span>
                      <span className="msg-file-size">{(msg.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                )}

                {msg.sender === "ai"
                  ? <TypewriterMsg 
                      id={msg.id} 
                      text={msg.text} 
                      isNew={msg.isNew} 
                      speed={10} 
                      isCancelled={cancelledMsgIds.includes(msg.id)}
                      onStart={(id) => setTypingMessageId(id)}
                      onEnd={(id) => setTypingMessageId(prev => prev === id ? null : prev)}
                      onSavePartial={(id, partial) => {
                         setConvs(prev => prev.map(c => ({
                           ...c,
                           messages: c.messages.map(m => m.id === id ? { ...m, text: partial, isNew: false } : m)
                         })));
                      }}
                    />
                  : (msg.text ? <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMD(msg.text) }} /> : null)
                }
                <span className="msg-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}

          {typingConvId === activeId && (
            <div className="msg-row msg-row--ai">
              <div className="ai-avatar">
                <img src={LOGO_SRC} alt="AI" />
              </div>
              <div className="bubble bubble--ai bubble--typing">
                <span className="typing-text">Analizando</span>
                <span className="dot dot1" /><span className="dot dot2" /><span className="dot dot3" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="input-area">
          <input type="file" accept=".pdf,.doc,.docx,.py,.js,.ts,.jsx,.tsx,.html,.css,.json,.sql,.java,.c,.cpp,.h,.cs,.sh,.txt,.php,.rb,.go,.rs,.kt,.swift,.yml,.yaml,.xml" className="sr-only" ref={fileRef} onChange={handleUpload} />
          <div className="input-box" style={{ flexDirection: "column", alignItems: "stretch", padding: "10px" }}>

            {/* Archivo Pendiente (UI) */}
            {pendingFile && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", padding: "6px 12px", borderRadius: "8px", marginBottom: "8px", width: "fit-content" }}>
                <span style={{ fontSize: "12px", color: "#34d399", fontWeight: 600 }}>📎 {pendingFile.name}</span>
                <button onClick={() => setPendingFile(null)} style={{ background: "transparent", border: "none", color: "#34d399", cursor: "pointer", padding: "2px" }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            )}

            <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <button type="button" className="attach-btn" onClick={() => fileRef.current?.click()} disabled={isUploading || !!typingConvId} style={{ transition: 'all 0.2s ease-in-out' }} title="Adjuntar PDF o Word para auditar">
                {isUploading
                  ? <svg className="spin" width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".75" /></svg>
                  : <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
              </button>
              <button type="button" className="attach-btn" onClick={toggleListening} disabled={isUploading || !!typingConvId} style={{ color: isListening ? '#ef4444' : 'currentColor', background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'transparent', transform: isListening ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s ease-in-out' }} title={isListening ? "Detener grabación" : "Dictar por voz (Micrófono)"}>
                {isListening ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.854v2.646h2.25a.75.75 0 010 1.5H9a.75.75 0 010-1.5h2.25v-2.646a6.751 6.751 0 01-6-6.854v-1.5A.75.75 0 016 10.5z" />
                  </svg>
                )}
              </button>
              <form onSubmit={handleSend} style={{ flex: 1, display: "flex", gap: "8px", alignItems: "flex-end", position: "relative" }}>
                <textarea
                  ref={taRef} rows={1}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={isUploading || !!typingConvId}
                  placeholder={pendingFile ? "Escribe algo sobre el documento..." : (uploadedDoc ? `Pregunta sobre "${uploadedDoc.name}"…` : "Envía un mensaje o adjunta un documento para auditar…")}
                  className="chat-input"
                />
                
                {(typingConvId || typingMessageId) ? (
                  <button type="button" onClick={handleCancel} className="cancel-btn" title="Detener generación">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="5" y="5" width="14" height="14" rx="2" />
                    </svg>
                    <span className="cancel-text">Detener</span>
                  </button>
                ) : (
                  <button type="submit" disabled={(!inputText.trim() && !pendingFile) || !!typingConvId || isUploading} className="send-btn">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="send-icon">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  </button>
                )}
              </form>
            </div>
          </div>
          <p className="input-hint">
            {uploadedDoc
              ? `📎 Documento activo: ${uploadedDoc.name} · Puedes hacer preguntas sobre él`
              : "Adjunta un PDF/Word para iniciar una auditoría · Shift+Enter para nueva línea"}
          </p>
        </div>

        {/* Notificación (Toast) Global */}
        <div className={`toast-notification ${toast.show ? "toast-show" : ""}`}>
          <div className="toast-icon">
            <img src={LOGO_SRC} alt="AuditorIA" />
            <div className="toast-check">
              <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>
          <span>{toast.msg}</span>
        </div>

          </>
        )}

      </main>

      {/* Modal de Confirmación Global */}
      {confirmDialog && confirmDialog.show && (
        <div className="modal-overlay" style={{ zIndex: 999999 }}>
          <div className="modal-content">
            <h3>{confirmDialog.title}</h3>
            <p>{confirmDialog.message}</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button className="btn-confirm" onClick={confirmDialog.onConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 999999;
          animation: fadeIn 0.2s ease-out;
        }

        .modal-content {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid rgba(56, 189, 248, 0.2);
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: center;
        }

        .modal-content h3 {
          color: #f8fafc;
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 1.25rem;
        }

        .modal-content p {
          color: #94a3b8;
          font-size: 0.95rem;
          margin-bottom: 24px;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .modal-actions button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #cbd5e1;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .btn-confirm {
          background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%);
          border: none;
          color: white;
          box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
        }

        .btn-confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(56, 189, 248, 0.4);
        }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />
    </div>
  );
}
  
