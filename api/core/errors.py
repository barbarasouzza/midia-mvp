# api/core/errors.py
from pydantic import BaseModel
from typing import Any, Optional

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None
