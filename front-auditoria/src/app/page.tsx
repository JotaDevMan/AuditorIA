"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "./landing.css";

// ── Terminal lines ──
const TERM_LINES = [
  { delay: 300,  type: "cmd",  text: "auditor-ia --init sistema" },
  { delay: 900,  type: "out",  text: "✔  Conectando con ChromaDB Vector Store..." },
  { delay: 1500, type: "out",  text: "✔  Cargando modelos de embeddings HuggingFace..." },
  { delay: 2100, type: "out",  text: "✔  Indexando normativas ISO 27001 / COBIT 5..." },
  { delay: 2700, type: "warn", text: "⚡  Pipeline RAG activo — LLM listo para consultas" },
  { delay: 3300, type: "cmd",  text: "auditor-ia --analyze docs/sistema.pdf" },
  { delay: 4000, type: "out",  text: "✔  Fragmentando en 347 chunks semánticos..." },
  { delay: 4600, type: "out",  text: "✔  Hallazgos detectados: 12 riesgos críticos" },
  { delay: 5200, type: "out",  text: "✔  Plan de auditoría generado bajo ISO 27001:2022" },
];

const METRICS = [
  { label: "Precisión",   val: 97.4, w: "97%",  color: "#38bdf8" },
  { label: "Recall",      val: 94.1, w: "94%",  color: "#818cf8" },
  { label: "F1-Score",    val: 95.7, w: "96%",  color: "#10b981" },
  { label: "Embeddings",  val: 88.0, w: "88%",  color: "#f472b6" },
];

const FEATURES = [
  { icon:"📄", bg:"rgba(56,189,248,.12)",  title:"Análisis de Documentos", desc:"Sube PDFs y Word de tu sistema. La IA vectoriza y extrae el contexto de cada página para auditoría precisa." },
  { icon:"🔍", bg:"rgba(129,140,248,.12)", title:"Detección de Riesgos",   desc:"Identifica vulnerabilidades, brechas de control y no conformidades usando similitud semántica." },
  { icon:"📋", bg:"rgba(244,114,182,.12)", title:"Plan de Auditoría ISO",  desc:"Genera planes estructurados con controles específicos bajo ISO 27001, COBIT 2019 e ITIL v4." },
  { icon:"🛡️", bg:"rgba(52,211,153,.12)",  title:"Controles Correctivos",  desc:"Propuestas de mejora adaptadas al contexto real, priorizadas por nivel de riesgo." },
  { icon:"💬", bg:"rgba(251,191,36,.12)",  title:"Chat Contextual RAG",    desc:"Pregunta sobre tus sistemas. La IA responde usando el conocimiento indexado de tus documentos." },
  { icon:"🗄️", bg:"rgba(239,68,68,.12)",   title:"Base de Conocimiento",   desc:"Administradores alimentan el sistema con normativas. Cada documento potencia las respuestas del LLM." },
];

const NORMS = ["ISO 27001","ISO 27002","ISO 9001","COBIT 5","COBIT 2019","ITIL v4","NIST CSF","SOC 2","PCI-DSS","GDPR","Ley 1273","HIPAA","ISO 31000"];

const PIPELINE = [
  { title:"Carga de documentos",       desc:"El usuario sube PDFs o Word desde la interfaz. El administrador también puede ingresar normativas y estándares internacionales.",  tag:"FastAPI Upload", tagColor:"rgba(56,189,248,.15)", tagText:"#38bdf8" },
  { title:"Fragmentación semántica",   desc:"Los documentos son divididos en chunks de 1000 tokens con solapamiento. Cada fragmento conserva contexto suficiente para respuestas precisas.", tag:"LangChain Splitter", tagColor:"rgba(129,140,248,.15)", tagText:"#818cf8" },
  { title:"Vectorización y almacenamiento", desc:"Cada chunk es convertido en un vector de alta dimensión usando HuggingFace all-MiniLM-L6-v2 y almacenado en ChromaDB.", tag:"HuggingFace + ChromaDB", tagColor:"rgba(16,185,129,.15)", tagText:"#10b981" },
  { title:"Generación con LLM (RAG)",  desc:"Al recibir una consulta, el sistema recupera los fragmentos más relevantes y los inyecta como contexto al LLM para una respuesta fundamentada.", tag:"LLM + RAG Pipeline", tagColor:"rgba(244,114,182,.15)", tagText:"#f472b6" },
];

// ── Canvas Neural Network Background ──
function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const nodes = Array.from({length: 60}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-.5)*.3, vy: (Math.random()-.5)*.3,
      r: Math.random()*2+1,
    }));
    let raf: number;
    function draw() {
      ctx.clearRect(0,0,W,H);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if(n.x<0||n.x>W) n.vx*=-1;
        if(n.y<0||n.y>H) n.vy*=-1;
      });
      nodes.forEach((a,i) => nodes.slice(i+1).forEach(b => {
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if(d < 120) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(56,189,248,${.12*(1-d/120)})`;
          ctx.lineWidth = .5;
          ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }));
      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x,n.y,n.r,0,Math.PI*2);
        ctx.fillStyle = "rgba(56,189,248,0.35)";
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas id="bg-canvas" ref={canvasRef}/>;
}

// ── Terminal component ──
function Terminal() {
  const [lines, setLines] = useState<typeof TERM_LINES>([]);
  const [cursor, setCursor] = useState(true);
  useEffect(() => {
    const timers = TERM_LINES.map((l,i) => setTimeout(() => setLines(p => [...p, l]), l.delay));
    const ci = setInterval(() => setCursor(c => !c), 500);
    return () => { timers.forEach(clearTimeout); clearInterval(ci); };
  }, []);
  return (
    <div className="terminal">
      <div className="terminal-bar">
        <span className="term-dot red"/><span className="term-dot yellow"/><span className="term-dot green"/>
        <span className="term-title">auditoria-ia — bash — 80×24</span>
      </div>
      <div className="terminal-body">
        {lines.map((l, i) => (
          <div key={i} className="term-line show">
            {l.type === "cmd"
              ? <><span className="term-prompt">auditor@ia:~$</span><span className="term-cmd"> {l.text}</span></>
              : l.type === "warn"
              ? <span className="term-warn">{l.text}</span>
              : <span className="term-out">{l.text}</span>
            }
          </div>
        ))}
        {lines.length < TERM_LINES.length && (
          <div className="term-line show">
            <span className="term-prompt">auditor@ia:~$</span>
            <span className="term-cursor" style={{opacity: cursor?1:0}}/>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scroll reveal hook ──
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll(".reveal,.reveal-left,.reveal-right");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if(e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.15 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── ML Visual ──
function MLVisual() {
  const layers = [
    { nodes: 4, cls: "input",   label: "Input" },
    { nodes: 5, cls: "hidden1", label: "Hidden 1" },
    { nodes: 5, cls: "hidden2", label: "Hidden 2" },
    { nodes: 2, cls: "output",  label: "Output" },
  ];
  return (
    <div className="ml-visual">
      <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:".7rem",color:"#334155",marginBottom:"1.5rem",letterSpacing:"1px"}}>
        &gt; Neural Network Architecture — RAG Encoder
      </p>
      <div className="nn-container">
        {layers.map(l => (
          <div key={l.cls} className="nn-layer">
            <span className="nn-label">{l.label}</span>
            {Array.from({length: l.nodes}, (_,i) => (
              <div key={i} className={`nn-node ${l.cls}`} style={{animationDelay:`${i*.15}s`}}/>
            ))}
          </div>
        ))}
      </div>
      <div className="ml-metrics">
        {METRICS.map(m => (
          <div key={m.label} className="metric-row">
            <span className="metric-label">{m.label}</span>
            <div className="metric-bar">
              <div className="metric-fill" style={{width: m.w, background: `linear-gradient(90deg, ${m.color}, ${m.color}88)`}}/>
            </div>
            <span className="metric-val" style={{color: m.color}}>{m.val}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════
export default function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [username,  setUsername]  = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const router = useRouter();
  useReveal();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res  = await fetch("http://localhost:8000/api/v1/auth/login", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify({ username: data.username, role: data.role }));
        router.push(data.role === "administrador" ? "/admin" : "/chat");
      } else {
        setError(data.detail || "Credenciales incorrectas.");
      }
    } catch { setError("Error de conexión con el servidor."); }
    finally   { setLoading(false); }
  };

  return (
    <>
      <NeuralBackground/>

      {/* NAV */}
      <nav className="nav">
        <a href="/" style={{ textDecoration: 'none' }}>
          <div className="nav-brand" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/AuditorIA.jpg" alt="AuditorIA" style={{ height: '38px', borderRadius: '8px', marginRight: '0.6rem', border: '1px solid rgba(56,189,248,0.3)' }} />
            AuditorIA
          </div>
        </a>
        <ul className="nav-links">
          <li><a href="#features">Funciones</a></li>
          <li><a href="#pipeline">Pipeline</a></li>
          <li><a href="#norms">Normas</a></li>
        </ul>
        <button className="nav-cta" onClick={() => setShowLogin(true)}>Iniciar Sesión →</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="badge"><span className="badge-dot"/> IA especializada en Auditoría de Sistemas</div>
        <h1 className="hero-title">
          Audita tu sistema con el poder de la{" "}
          <span className="grad">Inteligencia Artificial</span>
        </h1>
        <p className="hero-sub">
          AuditorIA analiza tus documentos, detecta vulnerabilidades y genera planes de auditoría profesionales
          basados en <strong style={{color:"#94a3b8"}}>ISO 27001</strong>, <strong style={{color:"#94a3b8"}}>COBIT</strong> e <strong style={{color:"#94a3b8"}}>ITIL</strong> — todo en segundos.
        </p>
        <Terminal/>
        <div className="hero-cta">
          <button className="btn-primary" onClick={() => setShowLogin(true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            Iniciar Sesión
          </button>
          <button className="btn-ghost" onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})}>
            Ver funcionalidades ↓
          </button>
        </div>
      </section>

      {/* STATS */}
      <div className="stats-bar">
        {[["97.4%","Precisión RAG"],["ISO 27001","Framework Principal"],["< 3s","Tiempo de respuesta"],["ChromaDB","Vector Store"]].map(([n,l]) => (
          <div key={l} className="stat-item reveal">
            <div className="stat-num">{n}</div>
            <div className="stat-label">{l}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section className="features" id="features">
        <div className="features-inner">
          <div className="features-head reveal">
            <p className="section-label">Capacidades</p>
            <h2 className="section-title">Todo lo que necesitas para auditar</h2>
            <p className="section-sub">De la carga de documentos al plan de auditoría — sin fricción, con precisión profesional.</p>
          </div>
          <div className="grid-3">
            {FEATURES.map((f,i) => (
              <div key={f.title} className="card reveal" style={{transitionDelay:`${i*.08}s`}}>
                <div className="card-icon" style={{background:f.bg}}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ML SECTION */}
      <section className="ml-section">
        <div className="ml-inner">
          <div className="reveal-left">
            <p className="section-label">Machine Learning</p>
            <h2 className="section-title">Arquitectura RAG + LLM de última generación</h2>
            <p className="section-sub">Combinamos embeddings semánticos de HuggingFace con un LLM de alto rendimiento para respuestas fundamentadas y precisas sobre tus sistemas.</p>
            <div style={{marginTop:"2rem",display:"flex",flexDirection:"column",gap:".75rem"}}>
              {[
                ["🧠","Embeddings","all-MiniLM-L6-v2 (HuggingFace)"],
                ["🗄️","Vector DB","ChromaDB — búsqueda semántica"],
                ["⚡","LLM","Gemini / GPT-4o via g4f"],
                ["🔗","Orquestador","LangChain Pipeline"],
              ].map(([icon,label,val]) => (
                <div key={label} style={{display:"flex",alignItems:"center",gap:".75rem",padding:".75rem",borderRadius:"10px",background:"rgba(15,23,42,.6)",border:"1px solid rgba(255,255,255,.04)"}}>
                  <span style={{fontSize:"1.2rem"}}>{icon}</span>
                  <div>
                    <div style={{fontSize:".72rem",color:"#475569",textTransform:"uppercase",letterSpacing:"1px",fontWeight:700}}>{label}</div>
                    <div style={{fontSize:".875rem",color:"#94a3b8",fontFamily:"'JetBrains Mono',monospace"}}>{val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="reveal-right"><MLVisual/></div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="pipeline-section" id="pipeline">
        <div className="pipeline-inner">
          <div className="reveal" style={{textAlign:"center",marginBottom:"3rem"}}>
            <p className="section-label">Cómo funciona</p>
            <h2 className="section-title">Pipeline de Auditoría Inteligente</h2>
          </div>
          <div className="pipeline-steps">
            {PIPELINE.map((s,i) => (
              <div key={s.title} className="p-step reveal" style={{transitionDelay:`${i*.1}s`}}>
                <div className="p-num">{i+1}</div>
                <div className="p-content">
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                  <span className="p-tag" style={{background:s.tagColor,color:s.tagText}}>{s.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NORMS */}
      <section className="norms-section" id="norms">
        <div className="reveal">
          <p className="section-label">Marcos de referencia</p>
          <h2 className="section-title" style={{fontSize:"1.75rem"}}>Basado en estándares internacionales</h2>
        </div>
        <div className="norms-pills">
          {NORMS.map(n => <span key={n} className="pill reveal">{n}</span>)}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <span>© 2025 AuditorIA · Inteligencia Artificial para Auditoría de Sistemas</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace"}}>v1.0 Beta · RAG + LLM</span>
      </footer>

      {/* LOGIN MODAL */}
      {showLogin && (
        <div className="overlay" onClick={e => { if(e.target===e.currentTarget) setShowLogin(false); }}>
          <div className="modal">
            <button className="modal-close" onClick={() => setShowLogin(false)}>✕</button>
            <a href="/" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <img src="/AuditorIA.jpg" alt="AuditorIA" style={{ height: '48px', borderRadius: '12px', border: '2px solid rgba(56,189,248,0.3)' }} />
            </a>
            <a href="/" style={{ textDecoration: 'none' }}><div className="modal-logo">AuditorIA</div></a>
            <p className="modal-sub">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleLogin}>
              {error && <div className="form-error">⚠️ {error}</div>}
              
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="usr">Usuario</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }}>👤</span>
                  <input id="usr" type="text" className="form-input" style={{ paddingLeft: '2.8rem' }} placeholder="Ingresa tu usuario"
                    value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"/>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="form-label" htmlFor="pwd">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '1.1rem' }}>🔒</span>
                  <input id="pwd" type="password" className="form-input" style={{ paddingLeft: '2.8rem' }} placeholder="••••••••"
                    value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"/>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Verificando..." : "Iniciar Sesión →"}
              </button>
            </form>

            <div className="modal-hint">
              <div className="hint-row">
                <span className="role-badge" style={{background:"rgba(56,189,248,.15)",color:"#38bdf8"}}>USUARIO</span>
                <span>user: <code>usuario1</code> / pass: <code>usuario1</code></span>
              </div>
              <div className="hint-row">
                <span className="role-badge" style={{background:"rgba(239,68,68,.15)",color:"#ef4444"}}>ADMIN</span>
                <span>user: <code>admin123</code> / pass: <code>admin123</code></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}