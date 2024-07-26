from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional
from passlib.context import CryptContext

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory database for users and messages
fake_users_db = {
    "user1": {"username": "user1", "hashed_password": pwd_context.hash("password1")},
    "user2": {"username": "user2", "hashed_password": pwd_context.hash("password2")},
    "user3": {"username": "user3", "hashed_password": pwd_context.hash("password3")}
}

offline_messages: Dict[str, List[str]] = {user: [] for user in fake_users_db}

@app.post("/token")
async def login(username: str = Form(...), password: str = Form(...)):
    user = fake_users_db.get(username)
    if user and pwd_context.verify(password, user['hashed_password']):
        return {"access_token": username, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/signup")
async def signup(username: str = Form(...), password: str = Form(...)):
    if username in fake_users_db:
        raise HTTPException(status_code=400, detail="Username already exists")
    fake_users_db[username] = {"username": username, "hashed_password": pwd_context.hash(password)}
    return {"message": "User created successfully"}

class UserUpdateRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

class ConnectionManager:
    def __init__(self):
        self.active_connections = {}
        self.user_status = {user: 'offline' for user in fake_users_db}

    async def connect(self, websocket: WebSocket, username: str):
        await websocket.accept()
        self.active_connections[username] = websocket
        self.user_status[username] = 'online'
        
        # Send any offline messages to the user
        if username in offline_messages and offline_messages[username]:
            for message in offline_messages[username]:
                await websocket.send_json({"type": "message", "data": message})
            offline_messages[username] = []  # Clear offline messages after sending

        await self.broadcast_status()

    def disconnect(self, username: str):
        if username in self.active_connections:
            del self.active_connections[username]
        self.user_status[username] = 'offline'
        self.broadcast_status()

    async def send_message(self, recipient: str, message: str):
        if recipient in self.active_connections:
            await self.active_connections[recipient].send_json({"type": "message", "data": message})
        else:
            # Store the message if the recipient is offline
            offline_messages.setdefault(recipient, []).append(message)

    async def broadcast_message(self, message: str):
        for connection in self.active_connections.values():
            await connection.send_json({"type": "message", "data": message})

    async def broadcast_status(self):
        status_message = {"type": "status", "data": self.user_status}
        for connection in self.active_connections.values():
            await connection.send_json(status_message)

manager = ConnectionManager()

@app.websocket("/ws/{username}")
async def websocket_endpoint(websocket: WebSocket, username: str):
    if username not in fake_users_db:
        await websocket.close(code=4004)  # Forbidden
        return
    
    await manager.connect(websocket, username)
    try:
        while True:
            data = await websocket.receive_text()
            if ":" in data:
                recipient, message = data.split(":", 1)
                if recipient in fake_users_db:
                    message_to_send = f"{username} to {recipient}: {message}"
                    await manager.send_message(recipient, message_to_send)
                    await websocket.send_json({"type": "message", "data": message_to_send})  # Send back to sender
            else:
                message_to_send = f"{username}: {data}"
                await manager.broadcast_message(message_to_send)
    except WebSocketDisconnect:
        manager.disconnect(username)

@app.get("/")
async def read_root():
    return {"App is working"}

@app.get("/user_status")
async def get_user_status():
    return manager.user_status 

@app.get("/users", response_model=List[str])
async def get_users():
    return list(fake_users_db.keys())

@app.delete("/users/{username}")
async def delete_user(username: str):
    if username in fake_users_db:
        del fake_users_db[username]  # Remove the user from the database
        if username in manager.active_connections:
            manager.disconnect(username)  # Disconnect if the user is online
        return {"message": "User deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="User not found")

@app.put("/users/{username}")
async def update_user(username: str, user_update: UserUpdateRequest):
    if username not in fake_users_db:
        raise HTTPException(status_code=404, detail="User not found")

    if user_update.username:
        fake_users_db[user_update.username] = fake_users_db.pop(username)
        username = user_update.username

    if user_update.password:
        fake_users_db[username]["hashed_password"] = pwd_context.hash(user_update.password)

    return {"message": "User updated successfully"}
