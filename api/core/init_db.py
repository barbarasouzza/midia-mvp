# api/core/init_db.py
from __future__ import annotations
import os
import sqlite3
from pathlib import Path
from typing import Optional

from .security import hash_password  # usa passlib (bcrypt/pbkdf2), já existente

DB_PATH = os.getenv("DB_PATH", "app.db")
SCHEMA_PATH = os.getenv("SCHEMA_PATH", "db/schema.sql")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin").strip().lower()
ADMIN_TOKEN: Optional[str] = os.getenv("ADMIN_TOKEN")  # se None, usa 'admin123' em DEV

def _ensure_admin(conn: sqlite3.Connection, *, verbose: bool = False) -> None:
    """
    Garante a existência do usuário admin.
    - Se não existir: cria com ADMIN_TOKEN (ou 'admin123' em dev).
    - Se existir: atualiza o hash somente se ADMIN_TOKEN estiver definido.
    """
    cur = conn.execute("SELECT id FROM user WHERE username=?", (ADMIN_USERNAME,))
    row = cur.fetchone()

    if row is None:
        token = ADMIN_TOKEN or "admin123"
        ph = hash_password(token)
        conn.execute(
            "INSERT INTO user(username, password_hash, role) VALUES (?,?,?)",
            (ADMIN_USERNAME, ph, "admin"),
        )
        conn.commit()
        if verbose:
            if ADMIN_TOKEN:
                print(f"[init_db] Admin criado: {ADMIN_USERNAME}")
            else:
                print(f"[init_db] Admin criado: {ADMIN_USERNAME} (token padrão 'admin123' — DEV)")
    else:
        if ADMIN_TOKEN:
            ph = hash_password(ADMIN_TOKEN)
            conn.execute(
                "UPDATE user SET password_hash=?, role='admin' WHERE username=?",
                (ph, ADMIN_USERNAME),
            )
            conn.commit()
            if verbose:
                print(f"[init_db] Admin atualizado: {ADMIN_USERNAME}")
        else:
            if verbose:
                print(f"[init_db] Admin já existe: {ADMIN_USERNAME} (sem alteração de token)")

def init_db(db_path: str = DB_PATH, schema_path: str = SCHEMA_PATH, verbose: bool = False) -> None:
    schema_file = Path(schema_path)
    if not schema_file.exists():
        raise FileNotFoundError(f"Schema não encontrado em: {schema_file.resolve()}")

    dbp = Path(db_path)
    dbp.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(dbp))
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        sql = schema_file.read_text(encoding="utf-8")
        conn.executescript(sql)

        if verbose:
            cur = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' "
                "AND name NOT LIKE 'sqlite_%' ORDER BY name;"
            )
            tables = ", ".join(r[0] for r in cur.fetchall())
            print(f"[init_db] OK: {dbp.name} atualizado. Tabelas: {tables}")

        _ensure_admin(conn, verbose=verbose)
    finally:
        conn.commit()
        conn.close()
