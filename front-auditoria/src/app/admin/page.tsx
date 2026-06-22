"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus("Subiendo y vectorizando documento en PostgreSQL...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`✅ Éxito: ${data.detail || 'Documento indexado correctamente en la base de datos vectorial.'}`);
      } else {
        setStatus(`❌ Error: ${data.detail || 'Fallo al procesar'}`);
      }
    } catch (err) {
      setStatus("❌ Error de conexión con el servidor backend.");
    } finally {
      setLoading(false);
      setFile(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020817', color: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background gradients */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
      
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '1rem 2rem', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '900', letterSpacing: '-1px', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', cursor: 'pointer', margin: 0 }}>
              Auditor<span style={{ color: '#f8fafc', WebkitTextFillColor: '#f8fafc' }}>IA</span> <span style={{ fontSize: '1rem', fontWeight: '500', color: '#64748b', WebkitTextFillColor: '#64748b', marginLeft: '0.5rem' }}>| Admin</span>
            </h1>
          </Link>
          <button onClick={() => { localStorage.removeItem("user"); window.location.href='/'; }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(239,68,68,0.1)' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Cerrar Sesión
          </button>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          
          {/* Main Card */}
          <div style={{ backgroundColor: 'rgba(15,23,42,0.7)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(56,189,248,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Base de Conocimientos (RAG)</h2>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Alimenta la inteligencia de la IA con normativas y estándares.</p>
              </div>
            </div>
            
            <p style={{ color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: '1.7', fontSize: '0.95rem' }}>
              Sube documentos PDF o Word con políticas, planes de auditoría, ISOs, COBIT, etc. El sistema procesará, fragmentará y almacenará semánticamente esta información en <strong>PostgreSQL/ChromaDB</strong> para potenciar las respuestas del modelo.
            </p>

            <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ border: '2px dashed rgba(56,189,248,0.3)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(2,8,23,0.5)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                   onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.6)'}
                   onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'}
              >
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                />
                
                {!file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'none' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    </div>
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Haz clic o arrastra un documento aquí</p>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Soporta .PDF, .DOC, .DOCX (Max 20MB)</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', pointerEvents: 'none' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ color: '#10b981', fontWeight: '600', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>Archivo seleccionado</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={!file || loading}
                style={{ 
                  padding: '1.1rem', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: file && !loading ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'rgba(255,255,255,0.05)', 
                  color: file && !loading ? 'white' : '#64748b', 
                  fontWeight: '700', 
                  fontSize: '1rem',
                  cursor: file && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: file && !loading ? '0 8px 25px rgba(56,189,248,0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {loading ? (
                  <>
                    <svg className="spin" width="20" height="20" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8z" opacity=".75"/>
                    </svg>
                    Procesando y Vectorizando...
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                    Subir y Procesar en Vector Store
                  </>
                )}
              </button>
            </form>

            {status && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '12px', backgroundColor: status.includes('❌') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${status.includes('❌') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`, color: status.includes('❌') ? '#fca5a5' : '#6ee7b7', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '500', fontSize: '0.95rem', animation: 'fadeIn 0.3s ease' }}>
                {status.includes('❌') ? (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ) : (
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                )}
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
      `}} />
    </div>
  );
}
