# api/core/security.py
import os, hmac, hashlib, base64, time, json
from passlib.hash import bcrypt

APP_SECRET = os.getenv("APP_SECRET", "change-me-please")

# Senhas
def hash_password(password: str) -> str:
    return bcrypt.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.verify(password, password_hash)
    except Exception:
        return False

# Sessão (HMAC)
def sign_session(data: dict, max_age_seconds: int = 60 * 60 * 8) -> str:
    payload = {"d": data, "exp": int(time.time()) + max_age_seconds}
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    sig = hmac.new(APP_SECRET.encode(), raw, hashlib.sha256).digest()
    return base64.urlsafe_b64encode(raw + b"." + sig).decode()

def verify_session(token: str) -> dict | None:
    try:
        blob = base64.urlsafe_b64decode(token.encode())
        raw, sig = blob.rsplit(b".", 1)
        expected = hmac.new(APP_SECRET.encode(), raw, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, expected):
            return None
        payload = json.loads(raw)
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload.get("d")
    except Exception:
        return None
