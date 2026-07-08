from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import database
from pydantic import BaseModel
from sqlalchemy.orm import Session
import base64
import json

security_scheme = HTTPBearer()

# --- Pydantic Models ---
class UserResponse(BaseModel):
    id: str
    email: str

    class Config:
        from_attributes = True

def verify_mock_token(token: str) -> dict:
    if not token.startswith("mockjwt."):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization token"
        )
    try:
        parts = token.split(".")
        payload_b64 = parts[1]
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        payload_json = base64.b64decode(payload_b64).decode("utf-8")
        return json.loads(payload_json)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid mock token payload: {str(e)}"
        )

# --- Dependencies ---
def get_current_user(cred: HTTPAuthorizationCredentials = Depends(security_scheme), db: Session = Depends(database.get_db)):
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = cred.credentials
    payload = verify_mock_token(token)
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims"
        )
        
    user = db.query(database.User).filter(database.User.id == user_id).first()
    if not user:
        try:
            new_user = database.User(id=user_id, email=email, hashed_password="mock_google_user")
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
        except Exception as e:
            db.rollback()
            user = db.query(database.User).filter(database.User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=500, detail=f"Database user registration failed: {str(e)}")
    return user

def get_current_user_optional(cred: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)), db: Session = Depends(database.get_db)):
    if not cred or not cred.credentials:
        return None
    try:
        return get_current_user(cred, db)
    except HTTPException:
        return None

# --- Router ---
router = APIRouter(tags=["auth"])

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: database.User = Depends(get_current_user)):
    return current_user


