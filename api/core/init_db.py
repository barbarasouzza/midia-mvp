# api/core/init_db.py
from __future__ import annotations
import os
import sqlite3
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", "app.db")
SCHEMA_PATH = os.getenv("SCHEMA_PATH", "db/schema.sql")

def init_db(db_path: str = DB_PATH, schema_path: str = SCHEMA_PATH, verbose: bool = False) -> None:
    schema_file = Path(schema_path)
    if not schema_file.exists():
        raise FileNotFoundError(f"Schema não encontrado em: {schema_file.resolve()}")

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON;")
        sql = schema_file.read_text(encoding="utf-8")
        conn.executescript(sql)

        if verbose:
            cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
            tables = ", ".join(r[0] for r in cur.fetchall())
            print(f"[init_db] OK: {db_path} atualizado. Tabelas: {tables}")
    finally:
        conn.commit()
        conn.close()
