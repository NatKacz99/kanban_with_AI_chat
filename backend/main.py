from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from .auth import hash_password, verify_password, create_token
from .auth_middleware import get_current_user
from .schemas import RegisterRequest, LoginRequest, TokenResponse
import uuid
from .ai import call_openrouter, call_openrouter_structured

from .db import get_connection, init_db
from .schemas import ColumnCreate, ColumnUpdate, CardCreate, CardUpdate, CardMove
from .schemas import AIChatRequest, AIChatResponse, BoardState
from .ai_schema import AI_RESPONSE_SCHEMA

app = FastAPI()

@app.on_event("startup")
def on_startup():
    init_db()

def build_board(conn, board_id: str):
    columns = conn.execute(
        "SELECT * FROM columns WHERE board_id = ? ORDER BY position",
        (board_id,)
    ).fetchall()
    cards = conn.execute(
        "SELECT cards.* FROM cards JOIN columns ON columns.id = cards.column_id WHERE columns.board_id = ? ORDER BY cards.position",
        (board_id,)
    ).fetchall()

    card_map = {
        card["id"]: {
            "id": card["id"],
            "title": card["title"],
            "details": card["details"] or "",
        }
        for card in cards
    }

    cards_by_column = {}
    for card in cards:
        cards_by_column.setdefault(card["column_id"], []).append(card["id"])

    return {
        "columns": [
            {
                "id": col["id"],
                "title": col["title"],
                "cardIds": cards_by_column.get(col["id"], []),
            }
            for col in columns
        ],
        "cards": card_map,
    }

def update_positions(conn, column_id, card_ids):
    for index, card_id in enumerate(card_ids):
        conn.execute(
            "UPDATE cards SET position = ? WHERE id = ?",
            (index, card_id)
        )

def seed_default_columns(conn, board_id: str):
    default_columns = ["Backlog", "Discovery", "In Progress", "Review", "Done"]
    for position, title in enumerate(default_columns):
        column_id = f"col-{uuid.uuid4().hex}"
        conn.execute(
            "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
            (column_id, board_id, title, position)
        )

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    with get_connection() as conn:
        existing_user = conn.execute(
            "SELECT id FROM users WHERE username = ?",
            (payload.username,)
        ).fetchone()
        if existing_user:
            raise HTTPException(status_code=409, detail="Username taken")

        user_id = f"user-{uuid.uuid4().hex}"
        password_hash = hash_password(payload.password)
        conn.execute(
            "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
            (user_id, payload.username, password_hash)
        )

        board_id = f"board-{uuid.uuid4().hex}"
        conn.execute(
            "INSERT INTO boards (id, user_id, name) VALUES (?, ?, ?)",
            (board_id, user_id, "Main Board")
        )
        seed_default_columns(conn, board_id)
        return {"ok": True}

@app.post("/api/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, username, password FROM users WHERE username = ?",
            (payload.username,)
        ).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not verify_password(payload.password, user["password"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_token(user["id"], user["username"])
        return TokenResponse(access_token=token)

@app.get("/api/board")
def get_board(user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        return build_board(conn, board["id"])

@app.post("/api/board/replace")
def replace_board(payload: BoardState, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        board_id = board["id"]

        conn.execute(
            "DELETE FROM cards WHERE column_id IN (SELECT id FROM columns WHERE board_id = ?)",
            (board_id,)
        )
        conn.execute("DELETE FROM columns WHERE board_id = ?",
            (board_id,)
        )

        for position, column in enumerate(payload.columns):
            conn.execute(
                "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
                (column.id, board_id, column.title, position)
            )

        for column in payload.columns:
            for position, card_id in enumerate(column.cardIds):
                card = payload.cards.get(card_id)
                if not card:
                    raise HTTPException(status_code=400, detail=f"Missing card data for {card_id}")
                conn.execute(
                    "INSERT INTO cards (id, column_id, title, details, position) VALUES (?, ?, ?, ?, ?)",
                    (card.id, column.id, card.title, card.details or "", position)
                )

        return build_board(conn, board_id)

@app.post("/api/columns")
def create_column(payload: ColumnCreate, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")

        board_id = board["id"]

        col_id = f"col-{uuid.uuid4().hex}"
        position = payload.position
        if position is None:
            row = conn.execute(
                "SELECT COALESCE(MAX(position), -1) as p FROM columns WHERE board_id = ?",
                (board_id,)
            ).fetchone()
            position = row["p"] + 1

        conn.execute(
            "INSERT INTO columns (id, board_id, title, position) VALUES (?, ?, ?, ?)",
            (col_id, board_id, payload.title, position)
        )
        return build_board(conn, board_id)

@app.put("/api/columns/{column_id}")
def update_column(column_id: str, payload: ColumnUpdate, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        res = conn.execute(
            "UPDATE columns SET title = ? WHERE id = ? AND board_id = ?",
            (payload.title, column_id, board["id"])
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Column not found")
        return build_board(conn, board["id"])

@app.delete("/api/columns/{column_id}")
def delete_column(column_id: str, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        conn.execute(
            "DELETE FROM cards WHERE column_id IN (SELECT id FROM columns WHERE id = ? AND board_id = ?)",
            (column_id, board["id"])
        )
        res = conn.execute(
            "DELETE FROM columns WHERE id = ? AND board_id = ?",
            (column_id, board["id"])
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Column not found")
        return build_board(conn, board["id"])

@app.post("/api/cards")
def create_card(payload: CardCreate, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        allowed = conn.execute(
            "SELECT 1 FROM columns WHERE id = ? AND board_id = ?",
            (payload.columnId, board["id"])
        ).fetchone()
        if not allowed:
            raise HTTPException(status_code=404, detail="Column not found")
        card_id = f"card-{uuid.uuid4().hex}"
        position = payload.position
        if position is None:
            row = conn.execute(
                "SELECT COALESCE(MAX(position), -1) as p FROM cards WHERE column_id = ?",
                (payload.columnId,)
            ).fetchone()
            position = row["p"] + 1

        conn.execute(
            "INSERT INTO cards (id, column_id, title, details, position) VALUES (?, ?, ?, ?, ?)",
            (card_id, payload.columnId, payload.title, payload.details, position)
        )
        return build_board(conn, board["id"])

@app.put("/api/cards/{card_id}")
def update_card(card_id: str, payload: CardUpdate, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        res = conn.execute(
            "UPDATE cards SET title = ?, details = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND column_id IN (SELECT id FROM columns WHERE board_id = ?)",
            (payload.title, payload.details, card_id, board["id"])
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Card not found")
        return build_board(conn, board["id"])

@app.delete("/api/cards/{card_id}")
def delete_card(card_id: str, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        res = conn.execute(
            "DELETE FROM cards WHERE id = ? AND column_id IN (SELECT id FROM columns WHERE board_id = ?)",
            (card_id, board["id"])
        )
        if res.rowcount == 0:
            raise HTTPException(status_code=404, detail="Card not found")
        return build_board(conn, board["id"])

@app.post("/api/cards/{card_id}/move")
def move_card(card_id: str, payload: CardMove, user=Depends(get_current_user)):
    with get_connection() as conn:
        board = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        card = conn.execute(
            "SELECT cards.* FROM cards JOIN columns ON columns.id = cards.column_id WHERE cards.id = ? AND columns.board_id = ?",
            (card_id, board["id"])
        ).fetchone()
        if not card:
            raise HTTPException(status_code=404, detail="Card not found")

        from_column = card["column_id"]
        to_column = payload.toColumnId
        allowed = conn.execute(
            "SELECT 1 FROM columns WHERE id = ? AND board_id = ?",
            (to_column, board["id"])
        ).fetchone()
        if not allowed:
            raise HTTPException(status_code=404, detail="Column not found")

        from_cards = conn.execute(
            "SELECT id FROM cards WHERE column_id = ? ORDER BY position",
            (from_column,)
        ).fetchall()
        to_cards = conn.execute(
            "SELECT id FROM cards WHERE column_id = ? ORDER BY position",
            (to_column,)
        ).fetchall()

        from_ids = [r["id"] for r in from_cards if r["id"] != card_id]
        to_ids = [r["id"] for r in to_cards]

        insert_at = payload.toPosition
        if insert_at is None or insert_at < 0 or insert_at > len(to_ids):
            to_ids.append(card_id)
        else:
            to_ids.insert(insert_at, card_id)

        conn.execute(
            "UPDATE cards SET column_id = ? WHERE id = ?",
            (to_column, card_id)
        )

        update_positions(conn, from_column, from_ids)
        update_positions(conn, to_column, to_ids)

        return build_board(conn, board["id"])

@app.get("/api/ai/test")
def ai_test():
    answer = call_openrouter("2+2")
    return {"answer": answer}

@app.post("/api/ai/chat", response_model=AIChatResponse)
def ai_chat(payload: AIChatRequest, user=Depends(get_current_user)):
    with get_connection() as conn:
        board_row = conn.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user["user_id"],)
        ).fetchone()
        if not board_row:
            raise HTTPException(status_code=404, detail="Board not found")
        board = build_board(conn, board_row["id"])

    system_prompt = (
        "You are an assistant for a kanban project management app."
        "You will receive the current board state and the user's request."
        "Return JSON that matches the provided schema."
        "Set 'board' to null if no changes are needed."
    )

    messages = [
        {
            "role": "user",
            "content": (
                "Board state:\n"
                f"{board}\n\n"
                "Conversation history:\n"
                f"{[m.dict() for m in payload.history]}\n\n"
                "User request:\n"
                f"{payload.message}"
            )
        }
    ]

    result = call_openrouter_structured(system_prompt, messages, AI_RESPONSE_SCHEMA)

    if result.get("board") is None:
        return AIChatResponse(reply=result["reply"], board=None)

    validated_board = BoardState(**result["board"])
    return AIChatResponse(reply=result["reply"], board=validated_board)

static_dir = Path("frontend/out")
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")