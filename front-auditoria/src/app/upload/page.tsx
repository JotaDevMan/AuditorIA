"use client";

import React, { useState } from 'react';

const SYSTEM_NAME = "AuditorIA";
const VECTOR_DB = "Chroma / FAISS";
const MAX_FILE_SIZE_MB = 10;

interface CustomFile {
  id: string;
  name: string;
  size: string;
  status: 'Procesando' | 'Indexado' | 'Error';
  uploadedAt: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<CustomFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Cargar lista de archivos subidos al iniciar
  React.useEffect(() => {
    const saved = localStorage.getItem('auditoria_files_history');
    if (saved) {
      setFiles(JSON.parse(saved));
    }
  }, []);

  // Guardar lista de archivos al actualizar
  React.useEffect(() => {
    localStorage.setItem('auditoria_files_history', JSON.stringify(files));
  }, [files]);

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`El archivo supera el límite de ${MAX_FILE_SIZE_MB}MB`);
      return;
    }

    const newFile: CustomFile = {
      id: Date.now().toString(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      status: 'Procesando',
      uploadedAt: 'Justo ahora'
    };
    setFiles(prev => [newFile, ...prev]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/documents/upload", {
        method: "POST",
        body: formData
      });
      if (res.ok) {
        setFiles(currentFiles => 
          currentFiles.map(f => f.id === newFile.id ? { ...f, status: 'Indexado' } : f)
        );
      } else {
        throw new Error("Error en el servidor");
      }
    } catch (err) {
      setFiles(currentFiles => 
        currentFiles.map(f => f.id === newFile.id ? { ...f, status: 'Error' } : f)
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-8">
      
      {/* Cabecera de la Sección */}
      <div className="border-b border-zinc-800 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Cargar Documentos de Soporte</h2>
        <p className="text-zinc-400 mt-1 text-sm">
          Añade documentos de la empresa, políticas internas o manuales técnicos. Serán procesados, divididos (Splitter) y convertidos en vectores para el contexto RAG de {SYSTEM_NAME}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ZONA DE ARRASTRE DE ARCHIVOS (DROPZONE) */}
        <div className="lg:col-span-2">
          <input 
            type="file" 
            accept=".pdf"
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
          />
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition duration-200 min-h-75 ${
              isDragging 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-zinc-800 hover:border-indigo-500 hover:bg-zinc-900/20'
            }`}
          >
            <div className="h-14 w-14 rounded-full bg-zinc-900 flex items-center justify-center text-2xl mb-4 border border-zinc-800">
              📁
            </div>
            <h3 className="font-semibold text-zinc-200">Haz clic aquí para subir tus PDFs</h3>
            <p className="text-xs text-zinc-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Soporta archivos de políticas corporativas, logs o registros de diseño. Límite máximo de {MAX_FILE_SIZE_MB} MB por archivo.
            </p>
            <div className="mt-6">
              <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                Soporte Inteligente Integrado
              </span>
            </div>
          </div>
        </div>

        {/* LISTADO DE ARCHIVOS SUBIDOS EN EL VECTOR DATABASE */}
        <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-850 rounded-2xl p-6 flex flex-col">
          <h3 className="font-semibold text-sm mb-4 flex items-center space-x-2">
            <span>📚</span>
            <span>Indexados en {VECTOR_DB}</span>
          </h3>

          <div className="space-y-4 flex-1 overflow-y-auto max-h-87.5">
            {files.map(file => (
              <div 
                key={file.id} 
                className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="truncate pr-2">
                    <span className="text-xs font-semibold text-zinc-300 block truncate" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">{file.size}</span>
                  </div>
                  <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded ${
                    file.status === 'Indexado' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                  }`}>
                    {file.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900 pt-2">
                  <span>{file.uploadedAt}</span>
                  <button 
                    onClick={() => setFiles(prev => prev.filter(f => f.id !== file.id))}
                    className="hover:text-rose-400 transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
}