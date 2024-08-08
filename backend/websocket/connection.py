from fastapi import WebSocket, WebSocketDisconnect
import logging
from typing import Dict, List, Set
from models import Message
from database.fake_db import fake_users_db  # Import fake_users_db

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_status: Dict[str, str] = {user: 'offline' for user in fake_users_db}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        self.user_status[username] = 'online'
        logging.info(f"User {username} connected.")
        await self.broadcast_status()

    async def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
            self.user_status[username] = 'offline'
            logging.info(f"User {username} disconnected.")
            await self.broadcast_status()

    async def send_message(self, recipient: str, message: Dict[str, str]):
        if recipient in self.active_connections:
            await self.active_connections[recipient].send_json({"type": "message", "data": message})
        else:
            offline_messages.setdefault(recipient, []).append(message)

    async def send_room_message(self, room: str, sender: str, message: str):
        if room in group_messages:
            message_data = {"user": sender, "text": message.strip()}
            group_messages[room].append(message_data)
            await self.broadcast_room_message(room, message_data)

    async def broadcast_room_message(self, room: str, message: Dict[str, str]):
        for username in rooms[room]:
            if username in self.active_connections:
                await self.active_connections[username].send_json({"type": "message", "data": message})

    async def broadcast_status(self):
        status_message = {"type": "status", "data": self.user_status}
        for connection in self.active_connections.values():
            await connection.send_json(status_message)

manager = ConnectionManager()
