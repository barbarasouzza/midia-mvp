# api/core/handlers.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.status import (
    HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED, HTTP_404_NOT_FOUND,
    HTTP_409_CONFLICT, HTTP_422_UNPROCESSABLE_ENTITY, HTTP_500_INTERNAL_SERVER_ERROR
)
import sqlite3
import re
from uuid import uuid4

def _infer_conflict_message_from_sqlite(err: sqlite3.IntegrityError) -> str:
    """
    Tenta transformar a mensagem crua do SQLite em algo amigável.
    Ex.: UNIQUE constraint failed: line.name  -> 'Linha já existe com esse nome'
    """
    msg = str(err)

    # UNIQUE em line.name
    if "UNIQUE constraint failed: line.name" in msg:
        return "Linha já existe com esse nome"
    # UNIQUE em system.name
    if "UNIQUE constraint failed: system.name" in msg:
        return "Sistema já existe com esse nome"
    # UNIQUE em person.email
    if "UNIQUE constraint failed: person.email" in msg:
        return "Já existe pessoa com esse e-mail"

    # CHECK de platform
    if re.search(r"CHECK constraint failed: .*platform", msg):
        return "Valor de 'platform' inválido (use 'vimeo' ou 'youtube')"

    # CHECK de role
    if re.search(r"CHECK constraint failed: .*role", msg):
        return "Valor de 'role' inválido (use 'responsavel' ou 'participante')"

    # fallback
    return "Violação de integridade do banco (verifique dados únicos e restrições)"

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        # Padroniza respostas de HTTPException lançadas manualmente (404, 401, 409 etc.)
        status_code = exc.status_code
        # códigos legíveis
        code_map = {
            HTTP_401_UNAUTHORIZED: "unauthorized",
            HTTP_404_NOT_FOUND: "not_found",
            HTTP_409_CONFLICT: "conflict",
        }
        code = code_map.get(status_code, "http_error")
        return JSONResponse(
            status_code=status_code,
            content={
                "code": code,
                "message": exc.detail if isinstance(exc.detail, str) else "Erro",
                "details": None if isinstance(exc.detail, str) else exc.detail,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "code": "validation_error",
                "message": "Erro de validação dos dados enviados",
                "details": exc.errors(),  # mantém os detalhes de onde quebrou
            },
        )

    @app.exception_handler(sqlite3.IntegrityError)
    async def sqlite_integrity_handler(request: Request, exc: sqlite3.IntegrityError):
        # Converte para 409 com mensagem amigável
        return JSONResponse(
            status_code=HTTP_409_CONFLICT,
            content={
                "code": "conflict",
                "message": _infer_conflict_message_from_sqlite(exc),
                "details": None,
            },
        )

    @app.middleware("http")
    async def catch_all_exceptions(request: Request, call_next):
        """
        Última rede de segurança: se algo escapar dos handlers acima,
        devolvemos 500 com um request_id (ajuda nos logs).
        """
        try:
            return await call_next(request)
        except Exception as exc:
            req_id = str(uuid4())
            # Log simples no stdout; em prod, use logger estruturado
            print(f"[internal_error] id={req_id} path={request.url.path} error={repr(exc)}")
            return JSONResponse(
                status_code=HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "code": "internal_error",
                    "message": "Erro interno inesperado",
                    "details": {"request_id": req_id},
                },
            )
