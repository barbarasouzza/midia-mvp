# api/routers/users.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..core.db import get_db
from ..core.deps import require_auth          # vamos derivar o require_admin a partir dele
from ..models import users as users_model

router = APIRouter(prefix="/users", tags=["users"])

def require_admin(user=Depends(require_auth)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return user

class UserCreate(BaseModel):
    username: str = Field(min_length=3)
    token: str = Field(min_length=4)                 # segredo do usuário (hash no banco)
    role: str = Field(default="user", pattern="^(admin|user)$")
    person_id: Optional[int] = None

@router.post("", dependencies=[Depends(require_admin)])
def create_user(payload: UserCreate, db=Depends(get_db)):
    return users_model.create(
        db,
        username=payload.username.strip().lower(),
        token=payload.token,
        role=payload.role,
        person_id=payload.person_id,
    )

@router.get("", dependencies=[Depends(require_admin)])
def list_users(db=Depends(get_db)):
    return users_model.list_all(db)
