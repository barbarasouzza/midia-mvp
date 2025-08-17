from typing import List
from fastapi import APIRouter, Depends
from ..core.db import get_db
from ..core.deps import require_auth
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import lines as lines_model

router = APIRouter(prefix="/lines", tags=["lines"])

@router.post(
    "",
    response_model=schemas.LineOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Criar linha",
)
def create_line(l: schemas.LineIn):
    db = get_db()
    return lines_model.create(db, l.name, l.system_id)

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
    dependencies=[Depends(require_auth)],
    summary="Atualizar linha",
)
def update_line(lid: int, l: schemas.LineIn):
    db = get_db()
    return lines_model.update(db, lid, l.name, l.system_id)


@router.delete(
    "/{lid}",
    dependencies=[Depends(require_auth)],
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
