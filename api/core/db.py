import os
import sqlite3
from typing import Any, Iterable, List, Dict
from fastapi import HTTPException

DB_PATH = os.getenv("DB_PATH", "app.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def execute(db, q: str, args: Iterable[Any] = ()):
    cur = db.execute(q, args)
    db.commit()
    return cur

def query_all(db, q: str, args: Iterable[Any] = ()) -> List[Dict]:
    cur = db.execute(q, args)
    return [dict(r) for r in cur.fetchall()]

def query_one(db, q: str, args: Iterable[Any] = ()) -> Dict | None:
    cur = db.execute(q, args)
    r = cur.fetchone()
    return dict(r) if r else None

def fetch_one_or_404(db, q: str, args=(), not_found_msg: str = "Recurso não encontrado"):
    cur = db.execute(q, args)
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=not_found_msg)
    return dict(row)

def delete_or_404(db, q: str, args=(), not_found_msg: str = "Recurso não encontrado"):
    cur = db.execute(q, args)
    db.commit()
    # Em SQLite, rowcount costuma refletir linhas afetadas para DELETE
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail=not_found_msg)
    return {"ok": True}
