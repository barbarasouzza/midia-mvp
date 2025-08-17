# models/media.py
from typing import Optional
from ..core.db import execute, query_all, query_one, delete_or_404
from .. import schemas

def _media_people(db, mid: int):
    return query_all(db, "SELECT person_id, role FROM media_person WHERE media_id=?", (mid,))

def create(db, m: schemas.MediaIn):
    cur = execute(
        db,
        """
        INSERT INTO media(title, description, platform, url, published_at, line_id, system_id, updated_at)
        VALUES(?,?,?,?,?,?,?, datetime('now'))
        """,
        (m.title, m.description, m.platform, str(m.url), m.published_at.isoformat(), m.line_id, m.system_id),
    )
    mid = cur.lastrowid
    for link in m.people:
        execute(db, "INSERT INTO media_person(media_id, person_id, role) VALUES(?,?,?)",
                (mid, link.person_id, link.role))
    return get_one(db, mid)

def get_one(db, mid: int):
    row = query_one(db, "SELECT * FROM media WHERE id=?", (mid,))
    if not row:
        from fastapi import HTTPException
        raise HTTPException(404, "Mídia não encontrada")
    row["people"] = _media_people(db, mid)
    return row

def list_all(db, *, platform: Optional[str]=None, person_id: Optional[int]=None,
             line_id: Optional[int]=None, system_id: Optional[int]=None,
             date_from: Optional[str]=None, date_to: Optional[str]=None):
    filters, args = [], []
    base = "SELECT m.* FROM media m"

    if person_id is not None:
        base += " JOIN media_person mp ON mp.media_id = m.id AND mp.person_id = ?"
        args.append(person_id)
    if platform:
        filters.append("m.platform = ?");   args.append(platform)
    if line_id is not None:
        filters.append("m.line_id = ?");    args.append(line_id)
    if system_id is not None:
        filters.append("m.system_id = ?");  args.append(system_id)
    if date_from:
        filters.append("m.published_at >= ?"); args.append(date_from)
    if date_to:
        filters.append("m.published_at <= ?"); args.append(date_to)

    if filters:
        base += " WHERE " + " AND ".join(filters)
    base += " ORDER BY m.published_at DESC"

    rows = query_all(db, base, tuple(args))
    for r in rows:
        r["people"] = _media_people(db, r["id"])
    return rows

# ---------------------------
# PUT (total): substitui o recurso inteiro
# Campos opcionais que vierem ausentes assumem None (vira NULL no DB)
# Sempre ressincroniza 'people'
# ---------------------------
def update_full(db, mid: int, m: schemas.MediaIn):
    execute(
        db,
        """
        UPDATE media
        SET title=?,
            description=?,
            platform=?,
            url=?,
            published_at=?,
            line_id=?,
            system_id=?,
            updated_at=datetime('now')
        WHERE id=?
        """,
        (m.title, m.description, m.platform, str(m.url),
         m.published_at.isoformat(), m.line_id, m.system_id, mid),
    )
    execute(db, "DELETE FROM media_person WHERE media_id=?", (mid,))
    for link in m.people:
        execute(db, "INSERT INTO media_person(media_id, person_id, role) VALUES(?,?,?)",
                (mid, link.person_id, link.role))
    return get_one(db, mid)

# ---------------------------
# PATCH (parcial): só atualiza os campos enviados
# 'people' só é alterado se vier no payload
# ---------------------------
def patch(db, mid: int, m: schemas.MediaIn):
    data = m.model_dump(exclude_unset=True)

    if not data:
        return get_one(db, mid)

    people = data.pop("people", None)

    if "url" in data:
        data["url"] = str(m.url)
    if "published_at" in data:
        data["published_at"] = m.published_at.isoformat()

    allowed = {"title", "description", "platform", "url", "published_at", "line_id", "system_id"}

    set_parts, args = [], []
    for key, val in data.items():
        if key in allowed:
            set_parts.append(f"{key}=?")
            args.append(val)

    if set_parts:
        set_parts.append("updated_at=datetime('now')")
        sql = f"UPDATE media SET {', '.join(set_parts)} WHERE id=?"
        args.append(mid)
        execute(db, sql, tuple(args))

    if people is not None:
        execute(db, "DELETE FROM media_person WHERE media_id=?", (mid,))
        for link in people:
            execute(db, "INSERT INTO media_person(media_id, person_id, role) VALUES(?,?,?)",
                    (mid, link["person_id"], link["role"]))

    return get_one(db, mid)

def delete(db, mid: int):
    return delete_or_404(db, "DELETE FROM media WHERE id=?", (mid,), "Mídia não encontrada")
