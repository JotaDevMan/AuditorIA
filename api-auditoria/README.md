# AuditorIA - Backend API (FastAPI)

Este servicio es el backend y el **orquestador central** del sistema **AuditorIA**. Se encarga de recibir los prompts del frontend, procesar la lectura de documentos PDF, transformarlos en vectores (embeddings), interactuar con el pipeline RAG y comunicarse con los modelos de lenguaje (LLM).

## Arquitectura Modular Interna (`app/`)

Para trabajar de forma ordenada en equipo y evitar conflictos en Git, el código del backend está modularizado en la carpeta `app/` mediante paquetes de Python (inicializados con archivos `__init__.py` vacíos):

```
api-auditoria/
├── venv/                  # Entorno virtual local (ignorado en git)
├── main.py                # Punto de entrada de FastAPI que unifica las rutas
├── requirements.txt       # Lista de dependencias del proyecto
└── app/                   # Módulo principal de la aplicación
    ├── database.py        # Configuración de variables (.env) y PostgreSQL
    ├── rag/               # Pipeline RAG (Lectura de PDFs y ChromaDB)
    ├── services/          # Conexión con APIs de IA (OpenAI / GPT)
    └── routes/            # Endpoints HTTP (chat.py y documents.py)
```

## Tecnologías y Necesidades

* **Framework Principal:** FastAPI.
* **Base de Datos Vectorial:** Chroma DB (Base de datos embebida local; no requiere instalar software externo, se ejecuta en la memoria de la API).
* **Procesamiento de Datos:** PyPDF (Lectura de PDFs) y LangChain (Estructuración del pipeline RAG).
* **Entorno Aislado:** Python Virtual Environment (`venv`) obligatorio para evitar conflictos de librerías globales en tu sistema.

---

## Instrucciones de Instalación

Para evitar conflictos de versiones de librerías globales en tu máquina (como el gestor de componentes de Streamlit u otras dependencias), **es mandatorio crear e instalar todo dentro de un entorno aislado**.

1.  **Asegúrate de estar en la carpeta del backend:**
    ```bash
    cd api-auditoria
    ```

2.  **Crear el Entorno Virtual (`venv`):**
    ```bash
    python -m venv venv
    ```

3.  **Activar el Entorno Virtual (Según tu Terminal/Consola):**
    * **En Windows (PowerShell - Consola interna de VS Code):**
        ```powershell
        .\venv\Scripts\Activate.ps1
        ```
        *Nota: Si PowerShell te da un error en rojo sobre restricciones de ejecución, desbloquea los scripts corriendo:* `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process` *y vuelve a activar el entorno virtual.*
    * **En Windows (CMD clásico):**
        ```cmd
        .\venv\Scripts\activate.bat
        ```
        
    *(Verás el indicador verde `(venv)` al inicio de tu línea de comandos confirmando que está activo).*

4.  **Instalar todo lo necesario para api-auditoria:**
    ```bash
    pip install -r requirements.txt
    ```

5.  **Ejecutar el servidor en modo desarrollo:**
    Para arrancar el backend vigilando los cambios de tu código en vivo (requiere tener el archivo `main.py` base en la carpeta):
    ```bash
    fastapi dev main.py
    ```

6.  **Verificación y Documentación Interactiva:**
    El servidor correrá en `http://127.0.0.1:8000`. Puedes ingresar a las rutas de prueba autogeneradas por FastAPI en:
    * **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

7. Crear su propio archivo .env local y pegar su clave de OpenAI (OPENAI_API_KEY).

8. Ejecutar fastapi dev main.py y ¡listo! Tienen el mismo entorno exacto que tú.

