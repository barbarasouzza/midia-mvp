from typing import List
from fastapi import APIRouter, Depends
from ..core.db import get_db
from ..core.deps import require_auth
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import people as people_model

router = APIRouter(prefix="/people", tags=["people"])

@router.post(
    "",
    response_model=schemas.PersonOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Criar pessoa",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "E-mail já cadastrado"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
    openapi_extra={
        "requestBody": {
            "content": {
                "application/json": {
                    "example": {"name": "Alice", "email": "alice@exemplo.com"}
                }
            }
        }
    },
)
def create_person(p: schemas.PersonIn):
    """Cria uma nova pessoa (nome e e-mail opcional)."""
    db = get_db()
    return people_model.create(db, p.name, p.email)

@router.get(
    "",
    response_model=List[schemas.PersonOut],
    response_model_exclude_none=True,
    summary="Listar pessoas",
)
def list_people():
    """Lista todas as pessoas ordenadas por nome."""
    db = get_db()
    return people_model.list_all(db)

@router.get(
    "/{pid}",
    response_model=schemas.PersonOut,
    response_model_exclude_none=True,
    summary="Obter pessoa por ID",
    responses={404: {"model": ErrorResponse, "description": "Pessoa não encontrada"}},
)
def get_person(pid: int):
    db = get_db()
    return people_model.get_one(db, pid)

@router.put(
    "/{pid}",
    response_model=schemas.PersonOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Atualizar pessoa",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Pessoa não encontrada"},
        409: {"model": ErrorResponse, "description": "E-mail já cadastrado"},
    },
)
def update_person(pid: int, p: schemas.PersonIn):
    db = get_db()
    return people_model.update(db, pid, p.name, p.email)

@router.delete(
    "/{pid}",
    dependencies=[Depends(require_auth)],
    summary="Excluir pessoa",
    responses={
        200: {"description": "OK"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Pessoa não encontrada"},
    },
)
def delete_person(pid: int):
    db = get_db()
    return people_model.delete(db, pid)
