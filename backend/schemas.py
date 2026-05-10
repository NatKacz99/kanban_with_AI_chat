from pydantic import BaseModel
from typing import Dict, List, Optional

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str

class ColumnCreate(BaseModel):
    title: str
    position: Optional[int] = None

class ColumnUpdate(BaseModel):
    title: str

class CardCreate(BaseModel):
    columnId: str
    title: str
    details: str = ""
    position: Optional[int] = None

class CardUpdate(BaseModel):
    title: str
    details: str

class CardMove(BaseModel):
    toColumnId: str
    toPosition: Optional[int] = None

class AIMessage(BaseModel):
    role: str
    content: str

class CardState(BaseModel):
    id: str
    title: str
    details: str = ""

class ColumnState(BaseModel):
    id: str
    title: str
    cardIds: List[str]

class BoardState(BaseModel):
    columns: List[ColumnState]
    cards: Dict[str, CardState]

class AIChatRequest(BaseModel):
    message: str
    history: List[AIMessage] = []

class AIChatResponse(BaseModel):
    reply: str
    board: Optional[BoardState] = None