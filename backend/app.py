from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Set
import logging
import json

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# User database
fake_users_db = {
    "suba": {"username": "suba", "hashed_password": "password1", "token": "token1"},
    "sindhu": {"username": "sindhu", "hashed_password": "password2", "token": "token2"},
    "dhamodhran": {"username": "dhamodhran", "hashed_password": "password3", "token": "token3"},
    "leesa": {"username": "leesa", "hashed_password": "password4", "token": "token4"},
    "mohendran": {"username": "mohendran", "hashed_password": "password5", "token": "token5"},
    "deepan": {"username": "deepan", "hashed_password": "password6", "token": "token6"},
    "sathish": {"username": "sathish", "hashed_password": "password7", "token": "token7"},
}

class LoginRequest(BaseModel):
    username: str
    password: str

# Offline messages and group configuration
rooms: Dict[str, Set[str]] = {"opcode_convo": {"leesa", "mohendran", "deepan", "sathish"}}
group_messages: Dict[str, List[Dict[str, str]]] = {"opcode_convo": []}

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

    async def send_room_message(self, room: str, sender: str, message: str):
        if room in group_messages:
            message_data = {"sender": sender, "text": message.strip()}
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

class Message(BaseModel):
    recipient: str = None  # Optional for group messages
    sender: str
    text: str
    room: str  # Keep room for group messages
    
@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    logging.info(f"User {username} attempting to connect...")

    if username not in fake_users_db:
        await websocket.close(code=4004)  # Forbidden
        logging.warning(f"Unauthorized connection attempt by {username}")
        return

    await manager.connect(websocket, username)

    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            logging.info(f"Received from {username}: {message_data}")

            if message_data['type'] == 'one-to-one':
                recipient = message_data['recipient']
                message = message_data['text']
                await manager.send_message(recipient, {"user": username, "text": message.strip()})

            elif message_data['type'] == 'group':
                room = message_data['room']
                message = message_data['text']
                await manager.send_room_message(room, username, message)

            else:
                logging.warning(f"Unknown message type: {message_data['type']}")

    except WebSocketDisconnect:
        logging.info(f"{username} disconnected.")
        await manager.disconnect(username)
    except Exception as e:
        logging.error(f"Error receiving message: {e}")

@app.post("/send_message")
async def send_message(message: Message):
    if message.room:
        await manager.send_room_message(message.room, message.sender, message.text)
    else:
        await manager.send_message(message.recipient, {"user": message.sender, "text": message.text})
    return {"status": "message sent"}

@app.post("/login")
async def login(request: LoginRequest):
    user = fake_users_db.get(request.username)
    if user and user["hashed_password"] == request.password:
        return {"token": user["token"]}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.get("/")
async def read_root():
    return {"App is working"}

@app.get("/user_status")
async def get_user_status():
    return manager.user_status

@app.get("/group_messages/{group_name}")
async def get_group_messages(group_name: str):
    if group_name in group_messages:
        return {"messages": group_messages[group_name]}
    raise HTTPException(status_code=404, detail="Group not found")
