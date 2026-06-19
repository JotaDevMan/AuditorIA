# AuditorIA - Front (Next + React)

## Tecnologías y Necesidades
* **Framework Core:** Next.js 16 (App Router) & React 19
* **Lenguaje:** TypeScript
* **Estilos:** Tailwind CSS v4 (Configurado e instalado de forma nativa a través de `@tailwindcss/postcss`).

---

## Instrucciones de Instalación

Sigue estos pasos ordenados dentro de esta carpeta para instalar y levantar el cliente web:

1.  **Asegúrate de estar en la carpeta correcta:**
    ```bash
    cd front-auditoria
    ```

2.  **Solucionar bloqueo de scripts de Node en Windows (Paso Obligatorio):**
    Dado que el proyecto utiliza `pnpm`, Windows suele bloquear la ejecución de scripts nativos de compilación de imágenes (como la librería `sharp`). Para darle permisos a tu proyecto, ejecuta:
    ```bash
    pnpm approve-builds
    ```
    *En la consola aparecerá un menú interactivo. Presiona la tecla **`a`** para seleccionar todas las dependencias y luego presiona **`Enter`** para confirmar.*

3.  **Instalar los paquetes de dependencias:**
    ```bash
    pnpm install
    ```

4.  **Ejecutar el servidor de desarrollo local:**
    ```bash
    pnpm dev
    ```

5.  **Abrir en el navegador:**
    Abre tu navegador web y ve a [http://localhost:3000](http://localhost:3000)

---

## Secciones e Interactividad de la Interfaz
La aplicación web utiliza directivas `"use client"` para simular el comportamiento real del sistema mediante estados de React:
* **`/` (Home - Chat de IA):** Interfaz limpia a pantalla completa para enviar prompts al modelo de lenguaje seleccionado.
* **`/upload` (Subir PDFs):** Panel con una zona Drag & Drop para cargar manuales o políticas internas de la organización directamente a la base vectorial.