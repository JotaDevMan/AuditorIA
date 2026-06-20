"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

// ── CONFIG ──
const API_BASE   = "http://localhost:8000/api/v1";
const LOGO_SRC   = "/AuditorIA.jpg";
const DOCS_KEY   = "auditoria_docs_v1";   // localStorage para documentos subidos (testing)
const STORE_KEY  = "auditoria_convs_v1";
const ACTIVE_KEY = "auditoria_active_v1";

const WELCOME_MSG = `¡Hola! Soy **AuditorIA**, tu asistente de auditoría inteligente.

Puedo ayudarte a:
- 📄 **Subir documentos** (PDF/Word) sobre un sistema para auditarlo
- 🔍 **Responder preguntas** sobre las normas indexadas en ChromaDB
- 🛡️ **Generar un plan de auditoría** completo basado en tu sistema

¿Qué te gustaría auditar hoy?`;

// ── TYPES ──
interface Message     { id: number; sender: "user"|"ai"; text: string; time: string; isNew?: boolean; }
interface Conversation { id: string; title: string; messages: Message[]; createdAt: number; }
interface DocEntry    { name: string; size: number; uploadedAt: number; convId: string; }

// ── MARKDOWN PARSER ──
function parseMD(raw: string): string {
  let h = raw.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  h = h.replace(/```([\s\S]*?)```/g, (_,c) => `<pre><code>${c.trim()}</code></pre>`);
  h = h.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  h = h.replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/\*([^*\n]+?)\*/g,     "<em>$1</em>");
  h = h.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  h = h.replace(/^## (.+)$/gm,  "<h2>$1</h2>");
  h = h.replace(/^# (.+)$/gm,   "<h1>$1</h1>");
  h = h.replace(/^---$/gm,      "<hr/>");
  h = h.replace(/^[-*] (.+)$/gm,"<li>$1</li>");
  h = h.replace(/(<li>[\s\S]*?<\/li>)/g, m => `<ul>${m}</ul>`);
  h = h.replace(/^> (.+)$/gm,   "<blockquote>$1</blockquote>");
  h = h.replace(/\n{2,}/g,      "</p><p>");
  h = `<p>${h}</p>`;
  h = h.replace(/\n/g,           "<br/>");
  h = h.replace(/<p>\s*<\/p>/g,  "");
  return h;
}

// ── TYPEWRITER — texto plano mientras escribe → MD cuando termina ──
function TypewriterMsg({ text, isNew, speed=10 }: { text:string; isNew?:boolean; speed?:number }) {
  const [shown, setShown] = useState(isNew ? "" : text);
  const [done,  setDone]  = useState(!isNew);

  useEffect(() => {
    if (!isNew) { setShown(text); setDone(true); return; }
    let i = 0; setShown(""); setDone(false);
    const iv = setInterval(() => {
      i++; setShown(text.slice(0, i));
      if (i >= text.length) { clearInterval(iv); setTimeout(() => setDone(true), 500); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, isNew, speed]);

  if (done) return <div className="md-body" dangerouslySetInnerHTML={{ __html: parseMD(text) }} />;
  return (
    <div className="md-body">
      <span style={{ whiteSpace: "pre-wrap" }}>{shown}</span>
      <span className="tcursor">▋</span>
    </div>
  );
}

// ── HELPERS ──
const ts  = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [convs,       setConvs]       = useState<Conversation[]>([]);
  const [activeId,    setActiveId]    = useState<string>("");
  const [inputText,   setInputText]   = useState("");
  const [isTyping,    setIsTyping]    = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedDoc, setUploadedDoc] = useState<DocEntry|null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);

  // ── Init ──
  useEffect(() => {
    let stored = loadConvs();
    let aid    = localStorage.getItem(ACTIVE_KEY) || "";
    if (!stored.length || !stored.find(c => c.id === aid)) {
      const first = makeNewConv();
      stored = [first]; aid = first.id;
      saveConvs(stored);
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
    const doc  = docs.filter(d => d.convId === activeId).slice(-1)[0] ?? null;
    setUploadedDoc(doc);
  }, [activeId]);

  function makeNewConv(): Conversation {
    return { id: uid(), title: "Nueva conversación", createdAt: Date.now(), messages: [{ id: 1, sender: "ai", text: WELCOME_MSG, time: ts() }] };
  }

  const activeConv = convs.find(c => c.id === activeId);
  const messages   = activeConv?.messages ?? [];

  function addNewChat() {
    const c = makeNewConv();
    setConvs(prev => [c, ...prev]);
    setActiveId(c.id);
    setInputText("");
    setUploadedDoc(null);
  }

  function deleteConv(id: string) {
    setConvs(prev => {
      const next = prev.filter(c => c.id !== id);
      if (id === activeId) {
        if (next.length) setActiveId(next[0].id);
        else { const fresh = makeNewConv(); return [fresh]; }
      }
      return next;
    });
    // Limpiar docs de esa conversación
    saveDocs(loadDocs().filter(d => d.convId !== id));
  }

  function updateConv(id: string, msgs: Message[]) {
    setConvs(prev => prev.map(c => {
      if (c.id !== id) return c;
      const title = msgs.find(m => m.sender === "user")?.text.slice(0, 40) ?? c.title;
      return { ...c, messages: msgs, title };
    }));
  }

  // ── Send mensaje al backend ──
  const sendToAPI = useCallback(async (prompt: string, currentMsgs: Message[]) => {
    setIsTyping(true);
    try {
      const res  = await fetch(`${API_BASE}/chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: prompt }) });
      const data = await res.json();
      const aiMsg: Message = { id: Date.now() + 1, sender: "ai", text: data.text || "Sin respuesta del servidor.", time: ts(), isNew: true };
      updateConv(activeId, [...currentMsgs, aiMsg]);
    } catch {
      updateConv(activeId, [...currentMsgs, { id: Date.now() + 1, sender: "ai", text: "❌ **Error de conexión** con el backend. Asegúrate de que FastAPI esté corriendo en el puerto 8000.", time: ts(), isNew: true }]);
    } finally {
      setIsTyping(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // ── Enviar mensaje de texto ──
  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping || isUploading || !activeId) return;
    const userMsg: Message = { id: Date.now(), sender: "user", text: inputText, time: ts() };
    const next = [...messages, userMsg];
    updateConv(activeId, next);
    setInputText("");
    // Si hay doc subido, lo menciona en el contexto
    const docContext = uploadedDoc ? `\n\n[Contexto: El usuario ha subido el documento "${uploadedDoc.name}" para auditar.]` : "";
    await sendToAPI(inputText + docContext, next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, isTyping, isUploading, activeId, messages, uploadedDoc, sendToAPI]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
  };

  // ── Subir archivo — SOLO localStorage, sin indexar en ChromaDB ──
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !activeId) return;
    const file = e.target.files[0];

    // Validar tipo
    if (!file.name.match(/\.(pdf|docx|doc)$/i)) {
      alert("Solo se permiten archivos PDF o Word (.pdf, .doc, .docx)");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setIsUploading(true);

    // 1️⃣ Guardar SOLO metadata en localStorage (sin subir al backend)
    const entry: DocEntry = { name: file.name, size: file.size, uploadedAt: Date.now(), convId: activeId };
    const docs = loadDocs().filter(d => d.convId !== activeId); // 1 doc por conv
    saveDocs([...docs, entry]);
    setUploadedDoc(entry);
    if (fileRef.current) fileRef.current.value = "";

    // 2️⃣ Mostrar mensaje del usuario con el nombre del archivo
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    const userText = `📎 Adjunté el documento **${file.name}** (${sizeMB} MB). Ayúdame a planificar la auditoría de este sistema.`;
    const userMsg: Message = { id: Date.now(), sender: "user", text: userText, time: ts() };
    const next = [...messages, userMsg];
    updateConv(activeId, next);

    // 3️⃣ Enviar prompt al chat API (usa conocimiento de ChromaDB que ya tiene indexado)
    //    El archivo NO se sube — la IA responde con su base de normas ya indexadas
    const auditPrompt = `El usuario adjuntó un documento llamado "${file.name}" que describe un sistema que desea auditar. Usando tu conocimiento de normas de auditoría ya disponibles (ISO 27001, COBIT 5, ITIL, etc.), genera una **Planificación de Auditoría de Sistema** estructurada que incluya:

1. **Objetivos de la auditoría**
2. **Alcance propuesto** (áreas y procesos a cubrir)
3. **Normas y estándares aplicables** (ISO 27001, COBIT, etc.)
4. **Controles clave a verificar**
5. **Riesgos identificados comúnmente en este tipo de sistemas**
6. **Cronograma de actividades sugerido**
7. **Recomendaciones preliminares**

Responde de forma profesional, clara y estructurada.`;

    await sendToAPI(auditPrompt, next);
    setIsUploading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, messages, sendToAPI]);

  // ════════════════ RENDER ════════════════
  return (
    <div className="chatgpt-root">

      {/* ══════════════ SIDEBAR ══════════════ */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : "sidebar--closed"}`}>

        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={LOGO_SRC} alt="AuditorIA" className="sidebar-logo-img" />
            {sidebarOpen && (
              <span className="sidebar-logo-text">
                <span className="grad-text">Auditor</span><span className="grad-ia">IA</span>
              </span>
            )}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(p => !p)} title="Colapsar sidebar">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {sidebarOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
                : <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M6 5l7 7-7 7"/>}
            </svg>
          </button>
        </div>

        {/* Nuevo Chat */}
        <button className="new-chat-btn" onClick={addNewChat}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
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
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
                  </svg>
                  <span className="history-title">{conv.title}</span>
                  <button className="history-del" onClick={ev => { ev.stopPropagation(); deleteConv(conv.id); }} title="Eliminar">
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
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
            <span className="sidebar-badge sidebar-badge--db">🗄️ ChromaDB</span>
          </div>
        )}
      </aside>

      {/* ══════════════ MAIN CHAT ══════════════ */}
      <main className="chat-main">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left">
            <span className="online-dot"/>
            <span className="chat-header-title">{activeConv?.title ?? "AuditorIA"}</span>
          </div>
          <div className="chat-header-right">
            {uploadedDoc && (
              <span className="doc-pill" title={uploadedDoc.name}>
                📎 {uploadedDoc.name.length > 22 ? uploadedDoc.name.slice(0,22)+"…" : uploadedDoc.name}
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
                {msg.sender === "ai"
                  ? <TypewriterMsg text={msg.text} isNew={msg.isNew} speed={10}/>
                  : <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.text}</p>}
                <span className="msg-time">{msg.time}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="msg-row msg-row--ai">
              <div className="ai-avatar">
                <img src={LOGO_SRC} alt="AI"/>
              </div>
              <div className="bubble bubble--ai bubble--typing">
                <span className="typing-text">Analizando</span>
                <span className="dot dot1"/><span className="dot dot2"/><span className="dot dot3"/>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="input-area">
          <input type="file" accept=".pdf,.doc,.docx" className="sr-only" ref={fileRef} onChange={handleUpload}/>
          <div className="input-box">
            <button type="button" className="attach-btn" onClick={() => fileRef.current?.click()} disabled={isUploading || isTyping} title="Adjuntar PDF o Word para auditar">
              {isUploading
                ? <svg className="spin" width="16" height="16" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".75"/></svg>
                : <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"/></svg>}
            </button>
            <form onSubmit={handleSend} style={{ flex: 1, display: "flex", gap: "8px", alignItems: "flex-end" }}>
              <textarea
                ref={taRef} rows={1}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKey}
                disabled={isUploading || isTyping}
                placeholder={uploadedDoc ? `Pregunta sobre "${uploadedDoc.name}"…` : "Envía un mensaje o adjunta un documento para auditar…"}
                className="chat-input"
              />
              <button type="submit" disabled={!inputText.trim() || isTyping || isUploading} className="send-btn">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ transform: "rotate(45deg)" }}>
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>
          <p className="input-hint">
            {uploadedDoc
              ? `📎 Documento activo: ${uploadedDoc.name} · Puedes hacer preguntas sobre él`
              : "Adjunta un PDF/Word para iniciar una auditoría · Shift+Enter para nueva línea"}
          </p>
        </div>

      </main>
    </div>
  );
}