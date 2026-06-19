"use client";

import React, { useState } from 'react';

// ==========================================
// VARIABLES DE CONFIGURACIÓN DEL CHAT (EDITABLE)
// ==========================================
const SYSTEM_NAME = "AuditorIA";
const LLM_MODEL = "GPT-4o";           // Modelo de lenguaje por defecto
const VECTOR_DB = "Chroma / FAISS";   // Base de datos vectorial
const WELCOME_MESSAGE = `¡Hola! Soy tu asistente inteligente ${SYSTEM_NAME}. He indexado con éxito las normas ISO de auditoría y seguridad. ¿Qué plan de auditoría o requerimiento de evaluación te gustaría diseñar hoy?`;

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  time: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      text: WELCOME_MESSAGE,
      time: '10:50 AM'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    // Simulación de respuesta de la IA (Mock usando las variables del sistema)
    setTimeout(() => {
      const aiResponseText = `Entendido. Basándome en el contexto de las normas ISO analizadas y almacenadas en nuestra base vectorial ${VECTOR_DB}, he procesado tu consulta mediante el modelo ${LLM_MODEL}. He estructurado un borrador preliminar. ¿Te gustaría guardarlo en la base de datos PostgreSQL o exportar el reporte?`;
      
      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiResponseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col space-y-4 min-h-[550px]">
      
      {/* PANEL PRINCIPAL DE INTERACCIÓN */}
      <section className="flex-1 bg-zinc-900/30 border border-zinc-850 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* Cabecera del Chat */}
        <div className="bg-zinc-900/60 border-b border-zinc-850 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></div>
            <div>
              <h3 className="font-semibold text-sm text-zinc-200">Asistente {SYSTEM_NAME}</h3>
              <p className="text-[10px] text-zinc-500">Sesión de Auditoría Activa</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded font-mono">
              🤖 {LLM_MODEL}
            </span>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded font-mono hidden sm:inline">
              🗄️ {VECTOR_DB}
            </span>
          </div>
        </div>

        {/* Caja de Mensajes */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[450px] min-h-[350px]">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                msg.sender === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-200'
              }`}>
                <p>{msg.text}</p>
                <span className="block text-[10px] text-right mt-2 opacity-60 font-mono">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-4 text-sm text-zinc-400">
                <span className="animate-pulse">Escribiendo análisis de auditoría con {LLM_MODEL}...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input de Entrada de Texto */}
        <form onSubmit={handleSendMessage} className="p-4 bg-zinc-900/60 border-t border-zinc-850 flex items-center space-x-3">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Escribe un prompt para que ${SYSTEM_NAME} analice tu código o procesos...`} 
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-200 placeholder-zinc-500 transition"
          />
          <button 
            type="submit" 
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-5 rounded-xl text-sm transition shadow-lg shadow-indigo-600/15"
          >
            Enviar 🚀
          </button>
        </form>

      </section>

    </div>
  );
}