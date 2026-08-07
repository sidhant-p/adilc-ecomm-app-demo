from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import require_jwt_secret
from .database import Base, engine
from .routers import auth_router

app = FastAPI(title="Ecomm Auth API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/auth")


@app.on_event("startup")
def on_startup() -> None:
    require_jwt_secret()
    Base.metadata.create_all(bind=engine)
