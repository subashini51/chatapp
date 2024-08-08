from pydantic import BaseModel
from typing import Optional

class LoginRequest(BaseModel):
    username: str
    password: str

class Message(BaseModel):
    recipient: Optional[str]  # Optional for group messages
    sender: str
    text: str
    room: str  # Keep room for group messages
