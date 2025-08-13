from ..core.db import execute, query_all, query_one, fetch_one_or_404, delete_or_404

def _media_people(db, mid: int):
    return query_all(db, "SELECT person_id, role FROM media_person WHERE media_id=?", (mid,))

def create(db, m):
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

def list_all(db, *, platform=None, person_id=None, line_id=None, system_id=None, date_from=None, date_to=None):
    filters, args = [], []
    base = "SELECT m.* FROM media m"

    if person_id:
        base += " JOIN media_person mp ON mp.media_id = m.id AND mp.person_id = ?"
        args.append(person_id)
    if platform:
        filters.append("m.platform = ?");   args.append(platform)
    if line_id:
        filters.append("m.line_id = ?");    args.append(line_id)
    if system_id:
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

def update(db, mid: int, m):
    execute(
        db,
        """
        UPDATE media SET title=?, description=?, platform=?, url=?, published_at=?, line_id=?, system_id=?, updated_at=datetime('now')
        WHERE id=?
        """,
        (m.title, m.description, m.platform, str(m.url), m.published_at.isoformat(), m.line_id, m.system_id, mid),
    )
    execute(db, "DELETE FROM media_person WHERE media_id=?", (mid,))
    for link in m.people:
        execute(db, "INSERT INTO media_person(media_id, person_id, role) VALUES(?,?,?)",
                (mid, link.person_id, link.role))
    return get_one(db, mid)

def delete(db, mid: int):
    return delete_or_404(db, "DELETE FROM media WHERE id=?", (mid,), "Mídia não encontrada")
