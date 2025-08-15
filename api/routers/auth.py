from fastapi import APIRouter, Response, HTTPException, Depends
from pydantic import BaseModel
from ..core.db import get_db
from ..core.security import verify_password, sign_session
from ..models import users as users_model
from ..core.deps import require_auth  # mesma dependência para /me e /ping

router = APIRouter(prefix="/auth", tags=["auth"])

class LoginIn(BaseModel):
    username: str
    token: str  # segredo do usuário (armazenado como hash no banco)

@router.post("/login")
def login(payload: LoginIn, response: Response, db=Depends(get_db)):
    uname = payload.username.strip().lower()
    u = users_model.get_by_username(db, uname)
    if not u or not verify_password(payload.token, u["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    session = sign_session({"uid": u["id"], "role": u["role"]})
    response.set_cookie(
        key="session",
        value=session,
        httponly=True,
        samesite="lax",
        secure=False,             # em produção: True + HTTPS
        max_age=60 * 60 * 8,
        path="/",
    )
    return {"ok": True, "user": {"id": u["id"], "username": uname, "role": u["role"]}}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("session", path="/")
    return {"ok": True}

@router.get("/me", dependencies=[Depends(require_auth)])
def me(user=Depends(require_auth)):
    return {"user": user}

@router.get("/ping", dependencies=[Depends(require_auth)])
def ping():
    return {"ok": True}
