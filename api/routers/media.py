from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from ..core.db import get_db
from ..core.deps import require_auth
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import media as media_model

router = APIRouter(prefix="/media", tags=["media"])

create_example = {
    "title": "Live de Abertura",
    "description": "Evento anual",
    "platform": "youtube",
    "url": "https://youtube.com/watch?v=abc123",
    "published_at": "2025-08-10",
    "line_id": 1,
    "system_id": 1,
    "people": [{"person_id": 1, "role": "responsavel"}],
}

@router.post(
    "",
    response_model=schemas.MediaOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Criar mídia",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        409: {"model": ErrorResponse, "description": "Conflito de integridade (UNIQUE/CHECK)"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
    openapi_extra={
        "requestBody": {"content": {"application/json": {"example": create_example}}}
    },
)
def create_media(m: schemas.MediaIn):
    db = get_db()
    return media_model.create(db, m)

@router.get(
    "/{mid}",
    response_model=schemas.MediaOut,
    response_model_exclude_none=True,
    summary="Obter mídia por ID",
    responses={404: {"model": ErrorResponse, "description": "Mídia não encontrada"}},
)
def get_media(mid: int):
    db = get_db()
    return media_model.get_one(db, mid)

@router.get(
    "",
    response_model=List[schemas.MediaOut],
    response_model_exclude_none=True,
    summary="Listar/filtrar mídias",
)
def list_media(
    platform: Optional[schemas.Platform] = Query(None, description="vimeo ou youtube"),
    person_id: Optional[int] = Query(None, description="Filtra por pessoa (participação)"),
    line_id: Optional[int] = Query(None, description="Filtra por linha"),
    system_id: Optional[int] = Query(None, description="Filtra por sistema"),
    date_from: Optional[str] = Query(None, description="Data inicial (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Data final (YYYY-MM-DD)"),
):
    db = get_db()
    return media_model.list_all(
        db,
        platform=platform,
        person_id=person_id,
        line_id=line_id,
        system_id=system_id,
        date_from=date_from,
        date_to=date_to,
    )

@router.put(
    "/{mid}",
    response_model=schemas.MediaOut,
    response_model_exclude_none=True,
    dependencies=[Depends(require_auth)],
    summary="Atualizar mídia",
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Mídia não encontrada"},
        409: {"model": ErrorResponse, "description": "Conflito de integridade (UNIQUE/CHECK)"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
    openapi_extra={
        "requestBody": {"content": {"application/json": {"example": create_example}}}
    },
)
def update_media(mid: int, m: schemas.MediaIn):
    db = get_db()
    return media_model.update(db, mid, m)

@router.delete(
    "/{mid}",
    dependencies=[Depends(require_auth)],
    summary="Excluir mídia",
    responses={
        200: {"description": "OK"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        404: {"model": ErrorResponse, "description": "Mídia não encontrada"},
    },
)
def delete_media(mid: int):
    db = get_db()
    return media_model.delete(db, mid)
