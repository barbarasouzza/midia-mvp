from typing import Optional
from ..core.db import execute, query_all, fetch_one_or_404, delete_or_404

def _clean_email(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    v = value.strip()
    return v if v else None

def create(db, name: str, email: Optional[str]):
    cur = execute(db, "INSERT INTO person(name,email) VALUES(?,?)", (name, _clean_email(email)))
    pid = cur.lastrowid
    return fetch_one_or_404(db, "SELECT id,name,email FROM person WHERE id=?", (pid,), "Pessoa não encontrada")

def list_all(db):
    return query_all(db, "SELECT id,name,email FROM person ORDER BY name")

def get_one(db, pid: int):
    return fetch_one_or_404(db, "SELECT id,name,email FROM person WHERE id=?", (pid,), "Pessoa não encontrada")

def update(db, pid: int, name: str, email: Optional[str]):
    execute(db, "UPDATE person SET name=?, email=? WHERE id=?", (name, _clean_email(email), pid))
    return fetch_one_or_404(db, "SELECT id,name,email FROM person WHERE id=?", (pid,), "Pessoa não encontrada")

def delete(db, pid: int):
    return delete_or_404(db, "DELETE FROM person WHERE id=?", (pid,), "Pessoa não encontrada")
