from fastapi import APIRouter, HTTPException
from models import LoginRequest  # Import the LoginRequest model
from database.fake_db import fake_users_db
from websocket.connection import manager  # Import the connection manager

router = APIRouter()

@router.post("/login")
async def login(request: LoginRequest):
    user = fake_users_db.get(request.username)
    if user and user["hashed_password"] == request.password:
        return {"token": user["token"]}
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@router.get("/user_status")
async def get_user_status():
    return manager.user_status
