"""
FastAPI application factory.
Boots the adilc-ecomm-app backend on port 8000.
CORS is restricted to the Vite dev-server origin (http://localhost:5173).
Fails fast at startup if SECRET_KEY is not set in the environment.
"""
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

SECRET_KEY: str = os.getenv("SECRET_KEY", "")
if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY environment variable is not set. "
        "Copy .env.example to .env and set a real secret value before starting the server."
    )

app = FastAPI(title="adilc-ecomm-app", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict:
    """Liveness probe - confirms the server is running."""
    return {"status": "ok"}
