from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(
    prefix="/audit",
    tags=["Audit"]
)


class AuditRequest(BaseModel):
    system_name: str
    scope: str


@router.post("/generate-plan")
def generate_plan(
    request: AuditRequest
):

    return {
        "fases": [
            "Planificación",
            "Levantamiento",
            "Evaluación",
            "Informe"
        ],
        "requerimientos": [
            "Arquitectura",
            "Código fuente",
            "Base de datos"
        ],
        "diseno_evaluacion": {
            "sistema": request.system_name,
            "alcance": request.scope
        }
    }