import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

# Carrega .env cedo (opcional)
try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

from .core.handlers import register_exception_handlers
from .core.deps import require_api_key
from .routers import people, lines, systems, media, reports
from fastapi.openapi.utils import get_openapi

app = FastAPI(title="Mídias Digitais - MVP")
register_exception_handlers(app)
@app.on_event("startup")
def _startup():
    # import local p/ evitar ciclo
    from .core.init_db import init_db
    init_db(verbose=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ajuste depois para seu front
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/auth/ping", dependencies=[Depends(require_api_key)])
def auth_ping():
    return {"ok": True}

# registra routers
app.include_router(people.router)
app.include_router(lines.router)
app.include_router(systems.router)
app.include_router(media.router)
app.include_router(reports.router)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="API para controle e relatórios de mídias digitais (Vimeo/YouTube).",
        routes=app.routes,
    )
    openapi_schema["tags"] = [
        {"name": "people", "description": "Cadastro e gestão de pessoas."},
        {"name": "lines", "description": "Linhas do sistema (categorias/áreas)."},
        {"name": "systems", "description": "Sistemas associados."},
        {"name": "media", "description": "Publicações/mídias e vínculos com pessoas."},
        {"name": "reports", "description": "Relatórios e exportações."},
    ]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
