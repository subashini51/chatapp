from fastapi import APIRouter, HTTPException
from models import Message  # Import the Message model
from websocket.connection import manager

router = APIRouter()

@router.post("/send_message")
async def send_message(message: Message):
    if message.room:
        await manager.send_room_message(message.room, message.sender, message.text)
    else:
        await manager.send_message(message.recipient, {"user": message.sender, "text": message.text})
    return {"status": "message sent"}

@router.get("/group_messages/{group_name}")
async def get_group_messages(group_name: str):
    if group_name in group_messages:
        return {"messages": group_messages[group_name]}
    raise HTTPException(status_code=404, detail="Group not found")
