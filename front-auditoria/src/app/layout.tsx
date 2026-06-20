import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AuditorIA — Auditoría Inteligente con IA",
  description: "Plataforma premium de planificación de auditorías con RAG, GPT y ChromaDB.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[#0d0d10] text-zinc-100 antialiased selection:bg-indigo-500/30">
        {children}
      </body>
    </html>
  );
}
