# schemas.py (Pydantic v2)
from typing import Optional, List, Literal
from datetime import date
from pydantic import BaseModel, HttpUrl, Field, ConfigDict

# --- Pessoas ---
class PersonIn(BaseModel):
    name: str
    email: Optional[str] = None

class PersonOut(PersonIn):
    id: int

# --- Linhas ---
class LineIn(BaseModel):
    name: str
    system_id: Optional[int] = None

class LineOut(BaseModel):
    id: int
    name: str
    system_id: Optional[int] = None
    system_name: Optional[str] = None

# --- Sistemas ---
class SystemIn(BaseModel):
    name: str

class SystemOut(SystemIn):
    id: int

# --- Mídias ---
Role = Literal["responsavel", "participante"]
Platform = Literal["vimeo", "youtube"]

class MediaPersonLink(BaseModel):
    person_id: int
    role: Role

class MediaIn(BaseModel):
    title: str
    description: Optional[str] = None
    platform: Platform
    url: HttpUrl
    published_at: date                  # será serializado como "YYYY-MM-DD"
    line_id: Optional[int] = None       # ausente/None = sem vínculo
    system_id: Optional[int] = None
    people: List[MediaPersonLink] = Field(default_factory=list)

class MediaOut(MediaIn):
    id: int
    # Se você retornar objetos/rows, isso ajuda a montar a resposta:
    model_config = ConfigDict(from_attributes=True)
