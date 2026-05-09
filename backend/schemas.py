from pydantic import BaseModel
from typing import Optional

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