# api/models/users.py
from typing import Optional, Dict, Any
from ..core.db import execute, query_one, query_all
from ..core.security import hash_password  # bcrypt

def get_by_username(db, username: str) -> Optional[Dict[str, Any]]:
    return query_one(db,
        "SELECT id, username, password_hash, role, person_id FROM user WHERE username=?",
        (username,),
    )

def get_by_id(db, uid: int) -> Optional[Dict[str, Any]]:
    return query_one(db,
        "SELECT id, username, role, person_id FROM user WHERE id=?",
        (uid,),
    )

def list_all(db):
    return query_all(db,
        "SELECT id, username, role, person_id, created_at FROM user ORDER BY username",
    )

def create(db, *, username: str, token: str, role: str = "user", person_id: Optional[int] = None):
    th = hash_password(token)
    cur = execute(db,
        "INSERT INTO user(username, password_hash, role, person_id) VALUES (?,?,?,?)",
        (username, th, role, person_id),
    )
    uid = cur.lastrowid
    return get_by_id(db, uid)
