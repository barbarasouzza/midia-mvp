from ..core.db import execute, query_all, fetch_one_or_404, delete_or_404

def create(db, name: str):
    cur = execute(db, "INSERT INTO system(name) VALUES(?)", (name,))
    sid = cur.lastrowid
    return fetch_one_or_404(db, "SELECT id,name FROM system WHERE id=?", (sid,), "Sistema não encontrado")

def list_all(db):
    return query_all(db, "SELECT id,name FROM system ORDER BY name")

def update(db, sid: int, name: str):
    execute(db, "UPDATE system SET name=? WHERE id=?", (name, sid))
    return fetch_one_or_404(db, "SELECT id,name FROM system WHERE id=?", (sid,), "Sistema não encontrado")

def delete(db, sid: int):
    return delete_or_404(db, "DELETE FROM system WHERE id=?", (sid,), "Sistema não encontrado")
