from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import user, message

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user.router)
app.include_router(message.router)

@app.get("/")
async def read_root():
    return {"App is working"}
