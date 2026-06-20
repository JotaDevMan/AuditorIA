"use client";

import React, { useState, useRef } from 'react';

// ==========================================
// VARIABLES DE CONFIGURACIÓN DEL CHAT
// ==========================================
const SYSTEM_NAME = "AuditorIA Premium";
const LLM_MODEL = "GPT-4o (Stable)";   
const VECTOR_DB = "ChromaDB";          
const WELCOME_MESSAGE = `¡Hola! Soy tu asistente auditor inteligente. He sido entrenado para evaluar procesos y código mediante las normas indexadas. ¿Qué te gustaría auditar hoy?`;

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  isNew?: boolean;
}

const TypewriterText = ({ text, speed = 15, isNew }: { text: string, speed?: number, isNew?: boolean }) => {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);

  React.useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      return;
    }
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText((prev) => text.substring(0, prev.length + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, isNew, speed]);

  return <>{displayedText}</>;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar historial al iniciar
  React.useEffect(() => {
    const saved = localStorage.getItem('auditoria_chat_history_v2');
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([{
        id: 1,
        sender: 'ai',
        text: WELCOME_MESSAGE,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, []);

  // Guardar historial al actualizar
  React.useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('auditoria_chat_history_v2', JSON.stringify(messages));
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Llamada a la API real de FastAPI
    fetch("http://localhost:8000/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: inputText })
    })
    .then(res => res.json())
    .then(data => {
      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.text || "Hubo un error en la respuesta del bot.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isNew: true
      };
      setMessages(prev => [...prev, aiMsg]);
    })
    .catch(err => {
      console.error(err);
      const errMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "❌ Error de conexión: Asegúrate de que el backend FastAPI esté encendido en el puerto 8000.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    })
    .finally(() => {
      setIsTyping(false);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          sender: 'ai',
          text: `✅ Documento "${file.name}" subido e indexado correctamente en ChromaDB. Ya puedes hacerme preguntas sobre este documento.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isNew: true
        }]);
      } else {
        throw new Error("Fallo al subir archivo");
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'ai',
        text: `❌ Hubo un error procesando el archivo "${file.name}". Verifica la conexión.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col space-y-4 min-h-[600px]">
      
      {/* PANEL PRINCIPAL DE INTERACCIÓN */}
      <section className="flex-1 bg-[#0f0f13] border border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative">
        
        {/* Cabecera del Chat Premium */}
        <div className="bg-white/[0.02] border-b border-white/10 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <h3 className="font-bold text-[15px] text-white tracking-wide">{SYSTEM_NAME}</h3>
              <p className="text-[11px] text-zinc-400 font-medium tracking-wider uppercase">Motor RAG Activo</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-full font-mono shadow-inner">
              🤖 {LLM_MODEL}
            </span>
            <span className="text-xs bg-rose-500/10 text-rose-300 border border-rose-500/20 px-3 py-1.5 rounded-full font-mono hidden sm:inline shadow-inner">
              🗄️ {VECTOR_DB}
            </span>
          </div>
        </div>

        {/* Caja de Mensajes */}
        <div className="flex-1 p-8 space-y-6 overflow-y-auto max-h-[500px] min-h-[400px] scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-2xl p-5 text-[15px] leading-relaxed shadow-xl transition-all duration-300 ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm border border-indigo-400/20 shadow-indigo-500/10' 
                  : 'bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-tl-sm text-zinc-100 shadow-black/50'
              }`}>
                <p className="whitespace-pre-wrap">
                  {msg.sender === 'ai' ? (
                    <TypewriterText text={msg.text} isNew={msg.isNew} speed={15} />
                  ) : (
                    msg.text
                  )}
                </p>
                <span className="block text-[10px] text-right mt-3 opacity-50 font-mono tracking-wider">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-900/80 border border-zinc-700/50 rounded-2xl rounded-tl-sm p-5 text-sm text-zinc-400 flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>Analizando contexto de auditoría...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input de Entrada de Texto + Adjuntar */}
        <div className="p-4 bg-zinc-950/80 border-t border-white/10">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3 max-w-4xl mx-auto w-full">
            
            {/* Input File Oculto */}
            <input 
              type="file" 
              accept=".pdf"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />

            {/* Botón de Adjuntar PDF (NUEVO) */}
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isTyping}
              className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition duration-200 flex-shrink-0 disabled:opacity-50"
              title="Adjuntar norma ISO o documento PDF"
            >
              {isUploading ? (
                <span className="animate-spin text-xl">⏳</span>
              ) : (
                <span className="text-xl">📎</span>
              )}
            </button>

            {/* Barra de Texto */}
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isUploading || isTyping}
              placeholder={`Solicita una auditoría o pregúntame sobre los documentos...`} 
              className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 hover:border-zinc-700 rounded-xl px-5 py-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-white placeholder-zinc-500 transition-all shadow-inner disabled:opacity-50"
            />
            
            {/* Botón Enviar */}
            <button 
              type="submit" 
              disabled={isUploading || isTyping || !inputText.trim()}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-4 px-8 rounded-xl text-[15px] transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:shadow-none disabled:transform-none"
            >
              Auditar 🚀
            </button>
          </form>
          <div className="text-center mt-3">
             <span className="text-[10px] text-zinc-500 font-medium tracking-wide uppercase">Solo los documentos indexados forman el conocimiento del sistema</span>
          </div>
        </div>

      </section>

    </div>
  );
}