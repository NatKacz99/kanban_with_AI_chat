from fastapi import Header, HTTPException
from .auth import decode_token

def get_current_user(authorization: str | None = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.replace("Bearer ", "")
    try:
        payload = decode_token(token)
        return {"user_id": payload["user_id"], "username": payload["username"]}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")