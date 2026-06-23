"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean, title: string, message: string, onConfirm: () => void } | null>(null);
  
  const [unauthorized, setUnauthorized] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const triggerIntrusion = () => {
      setUnauthorized(true);
      let t = 5;
      const interval = setInterval(() => {
        t -= 1;
        setCountdown(t);
        if (t <= 0) {
          clearInterval(interval);
          if (window.history.length > 2 && document.referrer.includes(window.location.host)) {
            window.history.back();
          } else {
            const userLogged = localStorage.getItem("user");
            window.location.href = userLogged ? "/chat" : "/";
          }
        }
      }, 1000);
      return interval;
    };

    const userStr = localStorage.getItem("user");
    if (!userStr) {
      const interval = triggerIntrusion();
      setIsChecking(false);
      return () => clearInterval(interval);
    }
    const user = JSON.parse(userStr);
    
    // Validar por Rol de Base de Datos
    if (user.role !== "administrador") {
      const interval = triggerIntrusion();
      setIsChecking(false);
      return () => clearInterval(interval);
    }
    
    setIsChecking(false);
  }, []);

  if (isChecking) {
    return <div style={{ height: "100vh", backgroundColor: "#020817" }} />;
  }

  if (unauthorized) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#000", color: "#f00", fontFamily: "monospace", textAlign: "center", padding: "2rem" }}>
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "pulse 1s infinite alternate" }}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M12 8v4"/>
          <path d="M12 16h.01"/>
        </svg>
        <h1 style={{ fontSize: "2.5rem", marginTop: "2rem", textTransform: "uppercase", letterSpacing: "2px" }}>Acceso Denegado</h1>
        <p style={{ fontSize: "1.2rem", color: "#ff4444", marginTop: "1rem", maxWidth: "600px" }}>
          Alerta de intrusión: Tu cuenta no posee privilegios de administrador. El intento de acceso ha sido registrado en el log del sistema.
        </p>
        <div style={{ marginTop: "3rem", padding: "1rem 2rem", border: "1px solid #f00", borderRadius: "8px", backgroundColor: "rgba(255,0,0,0.1)" }}>
          <p style={{ margin: 0, fontSize: "1.2rem" }}>Redirigiendo a zona segura en <strong>{countdown}</strong> segundos...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.8; }
            100% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 20px red); }
          }
        `}} />
      </div>
    );
  }

  const reqUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    const fileNames = files.map(f => f.name).join(', ');
    
    setConfirmDialog({
      show: true,
      title: "Confirmar Subida",
      message: `¿Estás seguro de subir y vectorizar ${files.length} archivo(s) a la base de conocimiento oficial de AuditorIA? (${fileNames})`,
      onConfirm: () => {
        setConfirmDialog(null);
        executeUpload();
      }
    });
  };

  const executeUpload = async () => {

    setLoading(true);
    setStatus("Subiendo y vectorizando documento en PostgreSQL...");

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const res = await fetch("http://localhost:8000/api/v1/documents/admin-upload", {
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
      setFiles([]);
    }
  };

  return (
    <div className="admin-root" style={{ minHeight: '100vh', backgroundColor: '#020817', color: '#f8fafc', padding: '2rem', fontFamily: 'system-ui, -apple-system, sans-serif', position: 'relative', overflow: 'hidden' }}>
      {/* Background gradients */}
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(129,140,248,0.05) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }}></div>
      
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        {/* Navigation Bar */}
        <div className="admin-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', padding: '1rem 2rem', background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
          <div className="admin-card" style={{ backgroundColor: 'rgba(15,23,42,0.7)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(56,189,248,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)' }}>
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
              Sube documentos PDF o Word con políticas, planes de auditoría, ISOs, COBIT, etc. El sistema procesará, fragmentará y almacenará semánticamente esta información en <strong>ChromaDB</strong> para potenciar las respuestas del modelo.
            </p>

            <form onSubmit={reqUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="upload-box" style={{ border: '2px dashed rgba(56,189,248,0.3)', borderRadius: '16px', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: 'rgba(2,8,23,0.5)', transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}
                   onMouseOver={(e) => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.6)'}
                   onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'}
              >
                <input 
                  type="file" 
                  multiple
                  accept=".pdf,.doc,.docx" 
                  onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }}
                />
                
                {files.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', pointerEvents: 'none' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                      <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                    </div>
                    <div>
                      <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '1.1rem', margin: '0 0 0.25rem 0' }}>Haz clic o arrastra documentos aquí</p>
                      <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Soporta .PDF, .DOC, .DOCX (Selección múltiple permitida)</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', pointerEvents: 'none', flexWrap: 'wrap' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ color: '#10b981', fontWeight: '600', fontSize: '1.05rem', margin: '0 0 0.25rem 0' }}>{files.length} Archivo(s) seleccionado(s)</p>
                      <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                        {files.map(f => f.name).join(', ').substring(0, 50)}{files.map(f => f.name).join(', ').length > 50 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={files.length === 0 || loading}
                style={{ 
                  padding: '1.1rem', 
                  borderRadius: '12px', 
                  border: 'none', 
                  background: files.length > 0 && !loading ? 'linear-gradient(135deg, #0ea5e9, #6366f1)' : 'rgba(255,255,255,0.05)', 
                  color: files.length > 0 && !loading ? 'white' : '#64748b', 
                  fontWeight: '700', 
                  fontSize: '1rem',
                  cursor: files.length > 0 && !loading ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: files.length > 0 && !loading ? '0 8px 25px rgba(56,189,248,0.3)' : 'none',
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
          {/* Vector Visualizer Card */}
          <div className="admin-card" style={{ backgroundColor: 'rgba(15,23,42,0.7)', padding: '3rem', borderRadius: '24px', border: '1px solid rgba(16,185,129,0.15)', boxShadow: '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', marginTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>Visualizador de Vectores en Vivo</h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>Inspecciona la matemática detrás del conocimiento del modelo.</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch("http://localhost:8000/api/v1/documents/vectors");
                    const data = await res.json();
                    if (data.status === "success") {
                      (window as any).vectorData = data;
                      setStatus("✅ Muestra de vector cargada exitosamente.");
                    } else {
                      setStatus(`❌ ${data.message}`);
                    }
                  } catch (e) {
                    setStatus("❌ Error conectando con el backend para los vectores.");
                  }
                }}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', color: 'white', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}
              >
                Cargar / Actualizar Vectores
              </button>
            </div>
            
            {typeof window !== 'undefined' && (window as any).vectorData && (window as any).vectorData.status === "success" ? (
              <div style={{ backgroundColor: '#020817', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold', borderBottomLeftRadius: '16px' }}>
                  {(window as any).vectorData.dimensiones} Dimensiones Extraídas
                </div>
                
                <h4 style={{ color: '#38bdf8', marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Fragmento de texto (Archivo: {(window as any).vectorData.archivo}):</h4>
                <p style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.9rem', marginBottom: '1.5rem', borderLeft: '3px solid #38bdf8', paddingLeft: '1rem' }}>
                  "{(window as any).vectorData.texto.substring(0, 150)}..."
                </p>

                <h4 style={{ color: '#10b981', marginTop: 0, marginBottom: '0.5rem', fontSize: '1rem' }}>Representación Vectorial (Matriz de Embeddings):</h4>
                <div style={{ backgroundColor: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.3)', padding: '1rem', borderRadius: '8px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  <code style={{ color: '#6ee7b7', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '1px' }}>
                    {(window as any).vectorData.matrix_string}
                  </code>
                </div>
              </div>
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed rgba(148,163,184,0.2)', borderRadius: '16px' }}>
                <p style={{ color: '#64748b', margin: 0 }}>Haz clic en el botón superior para explorar cómo la IA está transformando tus documentos en arreglos matemáticos 3D.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {confirmDialog && confirmDialog.show && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
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
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: none; } }
        
        @media (max-width: 768px) {
          .admin-root { padding: 1rem !important; }
          .admin-nav { flex-direction: column; gap: 1rem; text-align: center; padding: 1rem !important; margin-bottom: 1.5rem !important; }
          .admin-card { padding: 1.5rem !important; }
          .upload-box { padding: 1.5rem 1rem !important; }
        }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 999999; animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: rgba(15, 23, 42, 0.95); border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; padding: 24px; width: 90%; max-width: 400px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1); animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1); text-align: center;
        }
        .modal-content h3 { color: #f8fafc; margin-top: 0; margin-bottom: 12px; font-size: 1.25rem; }
        .modal-content p { color: #94a3b8; font-size: 0.95rem; margin-bottom: 24px; line-height: 1.5; }
        .modal-actions { display: flex; gap: 12px; justify-content: center; }
        .modal-actions button { padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
        .btn-cancel { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; }
        .btn-cancel:hover { background: rgba(255, 255, 255, 0.05); }
        .btn-confirm { background: linear-gradient(135deg, #38bdf8 0%, #6366f1 100%); border: none; color: white; box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3); }
        .btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(56, 189, 248, 0.4); }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}} />
    </div>
  );
}
