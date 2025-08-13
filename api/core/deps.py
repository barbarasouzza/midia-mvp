import os
from fastapi import Header, HTTPException

API_TOKEN = os.getenv("API_TOKEN")

def require_api_key(x_api_key: str = Header(default=None)):
    if API_TOKEN and x_api_key == API_TOKEN:
        return True
    raise HTTPException(status_code=401, detail="Unauthorized")
