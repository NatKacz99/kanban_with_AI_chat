import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", "app.db")

@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()

def init_db():
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS boards (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS columns (
                id TEXT PRIMARY KEY,
                board_id TEXT NOT NULL,
                title TEXT NOT NULL,
                position INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(board_id) REFERENCES boards(id)
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                column_id TEXT NOT NULL,
                title TEXT NOT NULL,
                details TEXT,
                position INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(column_id) REFERENCES columns(id)
            )
            """
        )

        conn.execute(
            "INSERT OR IGNORE INTO users (id, username) VALUES (?, ?)",
            ("user", "user")
        )
        conn.execute(
            "INSERT OR IGNORE INTO boards (id, user_id, name) VALUES (?, ?, ?)",
            ("board-1", "user", "Main Board")
        )

        count = conn.execute("SELECT COUNT(*) as c FROM columns").fetchone()["c"]
        if count == 0:
            columns = [
                ("col-backlog", "board-1", "Backlog", 0),
                ("col-discovery", "board-1", "Discovery", 1),
                ("col-progress", "board-1", "In Progress", 2),
                ("col-review", "board-1", "Review", 3),
                ("col-done", "board-1", "Done", 4)
            ]
            conn.executemany(
                "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
                columns
            )