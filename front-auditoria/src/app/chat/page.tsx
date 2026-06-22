"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

// ── CONFIG ──
const API_BASE = "http://localhost:8000/api/v1";
const LOGO_SRC = "/AuditorIA.jpg";
const DOCS_KEY = "auditoria_docs_v1";   // localStorage para documentos subidos (testing)
const STORE_KEY = "auditoria_convs_v1";
const ACTIVE_KEY = "auditoria_active_v1";

const WELCOME_MSG = `¡Hola! Soy **AuditorIA**, tu asistente de auditoría inteligente.

Puedo ayudarte a:
- 📄 **Subir documentos** (PDF/Word) sobre un sistema para auditarlo
- 🔍 **Responder preguntas** sobre las normas indexadas
- 🛡️ **Generar un plan de auditoría** completo basado en tu sistema

¿Qué te gustaría auditar hoy?`;

// ── TYPES ──
interface Message { id: number; sender: "user" | "ai"; text: string; time: string; isNew?: boolean; file?: { name: string; size: number }; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: number; }
interface DocEntry { name: string; size: number; uploadedAt: number; convId: string; content?: string; }

// ── MARKDOWN PARSER ──
function parseMD(raw: string, typing: boolean = false): string {
  let h = raw.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

  if (typing) h += '<span class="tcursor"></span>';

  h = h.replace(/\n{2,}/g, "</p><p>");
  h = `<p>${h}</p>`;
  h = h.replace(/\n/g, "<br/>");
  h = h.replace(/<p>\s*<\/p>/g, "");
  return h;
}

const animationProgress = new Map<number, number>();

// ── TYPEWRITER — renderiza Markdown progresivamente ──
function TypewriterMsg({ id, text, isNew, speed = 10 }: { id: number; text: string; isNew?: boolean; speed?: number }) {
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

    let i = startIdx;
    setShown(text.slice(0, i));
    setDone(false);

    const iv = setInterval(() => {
      i += 3; // velocidad suave
      if (i > text.length) i = text.length;

      setShown(text.slice(0, i));
      animationProgress.set(id, i); // guarda progreso exacto

      if (i >= text.length) {
        clearInterval(iv);
        setTimeout(() => setDone(true), 400);
      }
    }, speed);

    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, text, isNew, speed]);

  return <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMD(shown, !done) }} />;
}

// ── HELPERS ──
const ts = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const uid = () => Math.random().toString(36).slice(2);

function loadConvs(): Conversation[] {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "[]"); } catch { return []; }
}
function saveConvs(c: Conversation[]) { localStorage.setItem(STORE_KEY, JSON.stringify(c)); }

function loadDocs(): DocEntry[] {
  try { return JSON.parse(localStorage.getItem(DOCS_KEY) || "[]"); } catch { return []; }
}
function saveDocs(d: DocEntry[]) { localStorage.setItem(DOCS_KEY, JSON.stringify(d)); }

// ════════════════════════════════════════════════════════
export default function ChatPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedDoc, setUploadedDoc] = useState<DocEntry | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [toast, setToast] = useState({ show: false, msg: "" });
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // ── Init ──
  useEffect(() => {
    let stored = loadConvs();
    let aid = localStorage.getItem(ACTIVE_KEY) || "";

    if (!stored.length) {
      const first = makeNewConv();
      stored = [first];
      aid = first.id;
      saveConvs(stored);
    } else if (!stored.find(c => c.id === aid)) {
      aid = stored[0].id;
    }

    setConvs(stored.map(c => ({ ...c, messages: c.messages.map(m => ({ ...m, isNew: false })) })));
    setActiveId(aid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (convs.length) saveConvs(convs); }, [convs]);
  useEffect(() => { if (activeId) localStorage.setItem(ACTIVE_KEY, activeId); }, [activeId]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [convs, isTyping, activeId]);
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

  function makeNewConv(): Conversation {
    return { id: uid(), title: "Nueva conversación", createdAt: Date.now(), messages: [{ id: 1, sender: "ai", text: WELCOME_MSG, time: ts() }] };
  }

  const activeConv = convs.find(c => c.id === activeId);
  const messages = activeConv?.messages ?? [];

  function addNewChat() {
    const c = makeNewConv();
    setConvs(prev => [c, ...prev]);
    setActiveId(c.id);
    setInputText("");
    setUploadedDoc(null);
    setPendingFile(null);
  }

  function deleteConv(id: string) {
    let newActiveId = activeId;
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) {
        if (next.length) {
          newActiveId = next[0].id;
          setActiveId(newActiveId);
        }
        else {
          const fresh = makeNewConv();
          newActiveId = fresh.id;
          setActiveId(newActiveId);
          return [fresh];
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
  const sendToAPI = useCallback(async (prompt: string, targetConvId: string, isFirstMsg: boolean, contextText: string = "") => {
    setIsTyping(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, context: contextText })
      });
      const data = await res.json();
      const aiMsg: Message = { id: Date.now() + 1, sender: "ai", text: data.text || "Sin respuesta del servidor.", time: ts(), isNew: true };

      appendMsgToConv(targetConvId, aiMsg);
      triggerToast("Tu petición ha sido respondida");

      // Si es el primer mensaje, generamos título inteligente de fondo
      if (isFirstMsg) generateTitle(targetConvId, prompt);

    } catch {
      appendMsgToConv(targetConvId, { id: Date.now() + 1, sender: "ai", text: "❌ **Error de conexión** con el backend.", time: ts(), isNew: true });
    } finally {
      setIsTyping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !pendingFile) || isTyping || isUploading) return;

    let targetConvId = activeId;
    if (!targetConvId) {
      const c = makeNewConv();
      setConvs(prev => [c, ...prev]);
      setActiveId(c.id);
      targetConvId = c.id;
    }

    let finalPrompt = inputText.trim();

    let contextToSend = uploadedDoc?.content || "";

    // 1️⃣ Si hay archivo pendiente, extraer el texto desde el backend y guardarlo
    if (pendingFile) {
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

    await sendToAPI(finalPrompt + docContextMessage, targetConvId, isFirstMsg, contextToSend);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, isTyping, isUploading, activeId, messages, uploadedDoc, pendingFile, sendToAPI]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
  };

  // ── Seleccionar archivo — SOLO lo guarda en estado (pendingFile) ──
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeId) return;
    const file = e.target.files[0];

    // Validar tipo
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert("Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setPendingFile(file);
    if (fileRef.current) fileRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // ════════════════ RENDER ════════════════
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
                  <button className="history-del" onClick={ev => { ev.stopPropagation(); deleteConv(conv.id); }} title="Eliminar">
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
          <div className="sidebar-footer">
            <span className="sidebar-badge">🤖 GPT-4o</span>
            <span className="sidebar-badge sidebar-badge--db">🗄️ Vector DB</span>
            <button onClick={() => { localStorage.removeItem("user"); window.location.href = '/'; }} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>Cerrar Sesión</button>
          </div>
        )}
      </aside>

      {/* ══════════════ MAIN CHAT ══════════════ */}
      <main className="chat-main">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="online-dot" />
            <span className="chat-header-title">{activeConv?.title ?? "AuditorIA"}</span>
          </div>
          <div className="chat-header-right">
            {uploadedDoc && (
              <span className="doc-pill" title={uploadedDoc.name}>
                📎 {uploadedDoc.name.length > 22 ? uploadedDoc.name.slice(0, 22) + "…" : uploadedDoc.name}
              </span>
            )}
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
                  ? <TypewriterMsg id={msg.id} text={msg.text} isNew={msg.isNew} speed={10} />
                  : (msg.text ? <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMD(msg.text) }} /> : null)
                }
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
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
          <input type="file" accept=".pdf,.doc,.docx" className="sr-only" ref={fileRef} onChange={handleUpload} />
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
              <button type="button" className="attach-btn" onClick={() => fileRef.current?.click()} disabled={isUploading || isTyping} title="Adjuntar PDF o Word para auditar">
                {isUploading
                  ? <svg className="spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25" /><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".75" /></svg>
                  : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
              </button>
              <form onSubmit={handleSend} style={{ flex: 1, display: "flex", gap: "8px", alignItems: "flex-end" }}>
                <textarea
                  ref={taRef} rows={1}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={isUploading || isTyping}
                  placeholder={pendingFile ? "Escribe algo sobre el documento..." : (uploadedDoc ? `Pregunta sobre "${uploadedDoc.name}"…` : "Envía un mensaje o adjunta un documento para auditar…")}
                  className="chat-input"
                />
                <button type="submit" disabled={(!inputText.trim() && !pendingFile) || isTyping || isUploading} className="send-btn">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ transform: "rotate(45deg)" }}>
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
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

      </main>
    </div>
  );
}
  
