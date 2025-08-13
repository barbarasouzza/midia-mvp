from typing import Optional, List
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
import csv, io
from ..core.db import get_db
from ..core.errors import ErrorResponse
from .. import schemas
from ..models import media as media_model

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get(
    "/by-person",
    summary="Relatório por pessoa (JSON ou CSV)",
    responses={
        200: {"description": "JSON ou CSV com as mídias da pessoa"},
        422: {"model": ErrorResponse, "description": "Erro de validação"},
    },
)
def report_by_person(
    person_id: int = Query(..., description="ID da pessoa"),
    date_from: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_to: Optional[str] = Query(None, description="YYYY-MM-DD"),
    platform: Optional[schemas.Platform] = Query(None, description="vimeo ou youtube"),
    line_id: Optional[int] = Query(None),
    system_id: Optional[int] = Query(None),
    csv_export: bool = Query(False, description="Se true, retorna CSV"),
):
    db = get_db()
    items = media_model.list_all(
        db,
        platform=platform,
        person_id=person_id,
        line_id=line_id,
        system_id=system_id,
        date_from=date_from,
        date_to=date_to,
    )
    if not csv_export:
        return items

    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["media_id", "title", "platform", "url", "published_at", "line_id", "system_id"])
    for it in items:
        w.writerow([it["id"], it["title"], it["platform"], it["url"], it["published_at"], it["line_id"], it["system_id"]])
    buf.seek(0)
    headers = {"Content-Disposition": "attachment; filename=relatorio_por_pessoa.csv"}
    return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv", headers=headers)
