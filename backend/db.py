import os
import sqlite3
import uuid
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

        # Users, boards, and columns are created during registration.

DEFAULT_COLUMNS = ["Backlog", "Discovery", "In Progress", "Review", "Done"]

def seed_default_columns(conn, board_id: str):
    for position, title in enumerate(DEFAULT_COLUMNS):
        column_id = f"col-{uuid.uuid4().hex}"
        conn.execute(
            "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
            (column_id, board_id, title, position)
        )

def create_user_with_board(conn, username: str, password_hash: str):
    user_id = f"user-{uuid.uuid4().hex}"
    conn.execute(
        "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
        (user_id, username, password_hash)
    )

    board_id = f"board-{uuid.uuid4().hex}"
    conn.execute(
        "INSERT INTO boards (id, user_id, name) VALUES (?, ?, ?)",
        (board_id, user_id, "Main Board")
    )

    seed_default_columns(conn, board_id)
    return user_id, board_id