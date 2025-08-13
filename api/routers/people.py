from typing import List
from fastapi import APIRouter, Depends
from ..core.db import get_db
from ..core.deps import require_api_key
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import people as people_model

router = APIRouter(
    prefix="/people",
    tags=["people"],
)

@router.post(
    "",
    response_model=schemas.PersonOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_api_key)],
    summary="Criar pessoa",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "E-mail já cadastrado"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
)
def create_person(
    p: schemas.PersonIn = schemas.PersonIn.model_validate(
        {"name": "Alice", "email": "alice@exemplo.com"}
    )
):
    """
    Cria uma nova pessoa (nome e e-mail opcional).
    """
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
    responses={
        404: {"model": ErrorResponse, "description": "Pessoa não encontrada"},
    },
)
def get_person(pid: int):
    db = get_db()
    return people_model.get_one(db, pid)

@router.put(
    "/{pid}",
    response_model=schemas.PersonOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_api_key)],
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
    dependencies=[Depends(require_api_key)],
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
