from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.init_db import init_db
from .core.handlers import register_exception_handlers
from .routers import people, lines, systems, media, reports, auth, users

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

app = FastAPI(title="Mídias Digitais - MVP")
register_exception_handlers(app)

# CORS: como vamos usar cookie, não pode usar "*"
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# init DB no startup 
@app.on_event("startup")
def _startup(): 
    init_db(verbose=False)

# rotas
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(people.router)
app.include_router(lines.router)
app.include_router(systems.router)
app.include_router(media.router)
app.include_router(reports.router)
