from ..core.db import execute, query_all, query_one, fetch_one_or_404, delete_or_404

def create(db, name: str):
    cur = execute(db, "INSERT INTO line(name) VALUES(?)", (name,))
    lid = cur.lastrowid
    return fetch_one_or_404(db, "SELECT id,name FROM line WHERE id=?", (lid,), "Linha não encontrada")

def list_all(db):
    return query_all(db, "SELECT id,name FROM line ORDER BY name")

def update(db, lid: int, name: str):
    execute(db, "UPDATE line SET name=? WHERE id=?", (name, lid))
    return fetch_one_or_404(db, "SELECT id,name FROM line WHERE id=?", (lid,), "Linha não encontrada")

def delete(db, lid: int):
    return delete_or_404(db, "DELETE FROM line WHERE id=?", (lid,), "Linha não encontrada")
