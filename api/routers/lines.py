from typing import List
from fastapi import APIRouter, Depends
from ..core.db import get_db
from ..core.deps import require_api_key
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import lines as lines_model

router = APIRouter(prefix="/lines", tags=["lines"])

@router.post(
    "",
    response_model=schemas.LineOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_api_key)],
    summary="Criar linha",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "Linha já existe"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
)
def create_line(l: schemas.LineIn = schemas.LineIn.model_validate({"name": "Educação"})):
    db = get_db()
    return lines_model.create(db, l.name)

@router.get(
    "",
    response_model=List[schemas.LineOut],
    response_model_exclude_none=True,
    summary="Listar linhas",
)
def list_lines():
    db = get_db()
    return lines_model.list_all(db)

@router.put(
    "/{lid}",
    response_model=schemas.LineOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_api_key)],
    summary="Atualizar linha",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Linha não encontrada"},
        409: {"model": ErrorResponse, "description": "Linha já existe"},
    },
)
def update_line(lid: int, l: schemas.LineIn):
    db = get_db()
    return lines_model.update(db, lid, l.name)

@router.delete(
    "/{lid}",
    dependencies=[Depends(require_api_key)],
    summary="Excluir linha",
    responses={
        200: {"description": "OK"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Linha não encontrada"},
    },
)
def delete_line(lid: int):
    db = get_db()
    return lines_model.delete(db, lid)
