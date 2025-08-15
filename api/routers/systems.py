from typing import List
from fastapi import APIRouter, Depends
from ..core.db import get_db
from ..core.deps import require_auth
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import systems as systems_model

router = APIRouter(prefix="/systems", tags=["systems"])

@router.post(
    "",
    response_model=schemas.SystemOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Criar sistema",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "Sistema já existe"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
    openapi_extra={
        "requestBody": {
            "content": {"application/json": {"example": {"name": "SIGA"}}}
        }
    },
)
def create_system(s: schemas.SystemIn):
    db = get_db()
    return systems_model.create(db, s.name)

@router.get(
    "",
    response_model=List[schemas.SystemOut],
    response_model_exclude_none=True,
    summary="Listar sistemas",
)
def list_systems():
    db = get_db()
    return systems_model.list_all(db)

@router.put(
    "/{sid}",
    response_model=schemas.SystemOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Atualizar sistema",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Sistema não encontrado"},
        409: {"model": ErrorResponse, "description": "Sistema já existe"},
    },
)
def update_system(sid: int, s: schemas.SystemIn):
    db = get_db()
    return systems_model.update(db, sid, s.name)

@router.delete(
    "/{sid}",
    dependencies=[Depends(require_auth)],
    summary="Excluir sistema",
    responses={
        200: {"description": "OK"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Sistema não encontrado"},
    },
)
def delete_system(sid: int):
    db = get_db()
    return systems_model.delete(db, sid)
