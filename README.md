# AuditorIA - Software Audit Planning System

Este repositorio contiene la aplicación **AuditorIA**, una plataforma inteligente que asiste en la planificación de auditorías de software, basándose en normativas internacionales como ISO 25040, ISO 12207 e ISO 14764.

El proyecto está organizado como un **monorepo**, con el código unificado pero separado por componentes lógicos.

## Estructura General del Proyecto

* **`front-auditoria/`**: Aplicación web del cliente construida con Next.js, React y Tailwind CSS.
* **`api-auditoria/`**: API central construida con FastAPI y Python.

---

## Requisitos Previos Globales

Antes de intentar instalar cualquiera de las dos carpetas, debes asegurar que tu computadora cuenta con los siguientes entornos:

1.  **Node.js** (Versión 18 LTS o superior) -> [Descargar aquí](https://nodejs.org/)
2.  **Python** (Versión 3.10 o superior) -> [Descargar aquí](https://www.python.org/)
3.  **pnpm** (Gestor de paquetes global rápido necesario para el Frontend). Para instalarlo globalmente, abre tu consola y ejecuta:
    ```bash
    npm install -g pnpm
    ```

---

## Clonado e Inicio Rápido

1. Clona este repositorio en tu máquina local:
   ```bash
   git clone <URL_DE_TU_REPOSITORIO_GITHUB>
   ```
2. Entra a la carpeta raíz:
   ```bash 
   cd auditoria
   ```
3. Sigue las instrucciones de instalación específicas dentro de cada carpeta (**front-auditoria** y **api-auditoria**) detalladas en sus respectivos archivos de documentación internos **README.md**.

## Arquitectura del Sistema

La arquitectura de AuditorIA se compone de los siguientes elementos:

1. **Frontend (Cliente Web)**: 
   - Desarrollado con **Next.js** (React) y **Tailwind CSS**.
   - Proporciona una interfaz web responsiva, accesible y con estética moderna (3D, glassmorphism) donde los usuarios pueden interactuar con la IA, subir documentos y ver estadísticas.

2. **Backend (API REST)**:
   - Desarrollado en **Python** utilizando el framework **FastAPI**.
   - Actúa como el puente entre el cliente web, la base de datos de usuarios y el motor de IA.

3. **Inteligencia Artificial y RAG**:
   - **RAG (Retrieval-Augmented Generation)**: Se utiliza **ChromaDB** como base de datos vectorial local. Los documentos (normativas, políticas, etc.) son procesados con embeddings de HuggingFace y almacenados aquí.
   - **Motor LLM**: Integra GPT4Free (g4f) configurado estrictamente bajo un prompt de sistema que obliga a la IA a seguir el método de auditoría de software, y contemplar las fases (Planificación, Ejecución, Informe, Seguimiento), junto con requerimientos de evaluación y diseño de evaluación según estándares ISO.

4. **Base de Datos Relacional**:
   - Se utiliza **PostgreSQL** (con SQLAlchemy en el backend) para el registro y autenticación (login) de usuarios, y para almacenar información estructurada del sistema.
   
## Características Clave del Proyecto (Evaluación)
- **RAG y Automatización**: Implementado en el backend usando ChromaDB y un modelo LLM en tiempo real.
- **Fases y Normativas (ISO)**: Completamente integradas en la lógica (prompt) de la IA, asegurando que los planes de auditoría generados sigan las fases del proceso, los requerimientos/diseños de evaluación y las normas ISO 25040, 12207 y 14764.
- **Base de Datos y API**: Sistema robusto con FastAPI y PostgreSQL.
- **UI Responsiva**: Frontend moderno y adaptativo en Next.js.

Proyecto universitario de Auditoría de Software - 2026.