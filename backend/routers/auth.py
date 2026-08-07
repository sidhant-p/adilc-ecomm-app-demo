from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..auth import create_access_token, decode_access_token, hash_password, verify_password
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse

router = APIRouter()
security = HTTPBearer()


@router.post("/register", status_code=201, response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/logout")
def logout() -> dict[str, str]:
    return {"detail": "Logged out successfully"}


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(user.email)
    return LoginResponse(access_token=access_token)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    try:
        payload = decode_access_token(credentials.credentials)
        user_email = payload.get("sub")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    if not user_email:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == user_email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return user


@router.get("/me", response_model=RegisterResponse)
def me(current_user: User = Depends(get_current_user)) -> RegisterResponse:
    return current_user
