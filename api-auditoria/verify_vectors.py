import sys
import os

# Asegurar que el path sea correcto para importar 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.rag.vector_store import get_vector_store

def main():
    print("\n🔍 CONECTANDO CON LA BASE DE DATOS VECTORIAL (CHROMA DB)...")
    vs = get_vector_store()
    collection = vs._collection
    
    count = collection.count()
    if count == 0:
        print("⚠️ La base de datos está vacía. No hay vectores aún.")
        return

    print(f"✅ ¡Conexión exitosa! Se encontraron {count} fragmentos vectorizados.")
    print("\nExtrayendo una muestra real de los vectores almacenados...\n")
    
    # get() con include explícito asegura que los embeddings se devuelvan
    data = collection.get(include=["embeddings", "documents", "metadatas"])
    
    if data is None or not data.get('ids'):
        print("❌ Error: No se pudieron recuperar los vectores (data is None).")
        return

    try:
        if 'embeddings' not in data:
            print("❌ Error: La llave 'embeddings' no existe.")
            return
    except Exception:
        pass

    print("==================================================")
    print("📋 METADATOS Y TEXTO ORIGINAL (Primer fragmento):")
    print(f"ID del fragmento: {data['ids'][0]}")
    print(f"Texto extraído: '{data['documents'][0][:150]}...'")
    print("==================================================")
    
    print(f"\n🧠 REPRESENTACIÓN VECTORIAL (MATRIZ DE EMBEDDINGS):")
    print(f"Este texto ha sido convertido en arreglos matemáticos de {len(data['embeddings'][0])} dimensiones.")
    print(f"Muestra de los {len(data['embeddings'])} vectores:")
    
    matrix_repr = []
    for vector in data['embeddings']:
        first_three = ", ".join([f"{num:.3f}" for num in vector[:3]])
        last_three = ", ".join([f"{num:.3f}" for num in vector[-3:]])
        matrix_repr.append(f"[{first_three}, ... , {last_three}]")
        
    final_output = "[" + ", ".join(matrix_repr) + "]"
    print(final_output)
    print()

if __name__ == "__main__":
    main()
