from ..core.db import execute, query_all, query_one, fetch_one_or_404, delete_or_404
from fastapi import HTTPException

def create(db, name: str, system_id: int | None):
    cur = db.execute(
        "INSERT INTO line (name, system_id) VALUES (?, ?)",
        (name, system_id),
    )
    db.commit()
    return get_by_id(db, cur.lastrowid)

def list_all(db):
    return [
        dict(row)
        for row in db.execute("""
            SELECT l.id, l.name, l.system_id, s.name AS system_name
            FROM line l
            LEFT JOIN system s ON l.system_id = s.id
            ORDER BY l.name
        """)
    ]

def update(db, lid: int, name: str, system_id: int | None):
    db.execute(
        "UPDATE line SET name=?, system_id=? WHERE id=?",
        (name, system_id, lid),
    )
    db.commit()
    return get_by_id(db, lid)

def get_by_id(db, lid: int):
    row = db.execute("""
        SELECT l.id, l.name, l.system_id, s.name AS system_name
        FROM line l
        LEFT JOIN system s ON l.system_id = s.id
        WHERE l.id = ?
    """, (lid,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Linha não encontrada")
    return dict(row)

def delete(db, lid: int):
    return delete_or_404(db, "DELETE FROM line WHERE id=?", (lid,), "Linha não encontrada")
