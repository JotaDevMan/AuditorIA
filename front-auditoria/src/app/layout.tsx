import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ==========================================
// VARIABLES DE CONFIGURACIÓN GLOBAL (EDITABLE)
// ==========================================
const SYSTEM_NAME = "AuditorIA";
const SYSTEM_VERSION = "v1.0-Beta";
const BACKEND_SERVICE_NAME = "FastAPI";

export const metadata: Metadata = {
  title: `${SYSTEM_NAME} - Software Audit Planning System`,
  description: "Plataforma inteligente de planificación de auditorías con RAG",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 selection:bg-indigo-500/30 relative overflow-x-hidden">
        
        {/* EFECTOS DE FONDO PREMIUM */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '10s' }} />
          <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        </div>

        {/* COMPONENTE: HEADER GLOBAL */}
        <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/40 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            
            {/* Logo y Nombre del Sistema */}
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-lg bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-mono font-bold text-white text-lg">🛡️</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight bg-linear-to-r from-zinc-50 to-zinc-400 bg-clip-text text-transparent">
                  {SYSTEM_NAME}
                </span>
                <span className="hidden sm:inline text-xs text-indigo-400 font-mono ">{SYSTEM_VERSION}</span>
              </div>
            </div>

            {/* Navegación entre Pestañas */}
            <nav className="flex items-center space-x-1 bg-zinc-900/60 p-1.5 rounded-full border border-zinc-850">
              <Link 
                href="/" 
                className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 text-zinc-200 hover:text-white hover:bg-zinc-800"
              >
                💬 Chat de IA
              </Link>
              <Link 
                href="/upload" 
                className="px-4 py-1.5 text-sm font-medium rounded-full transition-all duration-200 text-zinc-200 hover:text-white hover:bg-zinc-800"
              >
                📂 Subir PDFs
              </Link>
            </nav>

            {/* Estado del Backend */}
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-zinc-400 font-mono hidden md:inline">{BACKEND_SERVICE_NAME}: Online</span>
            </div>

          </div>
        </header>

        {/* CONTENEDOR PRINCIPAL */}
        <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 flex flex-col">
          {children}
        </div>

        {/* COMPONENTE: FOOTER GLOBAL */}
        <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-500">
              © 2026 {SYSTEM_NAME}. Proyecto Universitario Demo.
            </p>
            <div className="flex items-center space-x-4 text-xs font-mono text-zinc-400">
              <span>Next.js 16</span>
              <span className="text-zinc-800">•</span>
              <span>{BACKEND_SERVICE_NAME}</span>
              <span className="text-zinc-800">•</span>
              <span>PostgreSQL</span>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
