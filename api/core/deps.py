from fastapi import Request, HTTPException, Depends
from ..core.db import get_db, query_one
from ..core.security import verify_session

def require_auth(request: Request, db=Depends(get_db)):
    token = request.cookies.get("session")
    if token:
        data = verify_session(token)
        if data and "uid" in data:
            user = query_one(db, "SELECT id, username, role, person_id FROM user WHERE id=?", (data["uid"],))
            if user:
                return user
    raise HTTPException(status_code=401, detail="Unauthorized")

# compat: se algum arquivo ainda importar require_user, mantém o alias
require_user = require_auth
