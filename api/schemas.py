from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Literal
from datetime import date

# --- Pessoas ---
class PersonIn(BaseModel):
    name: str
    email: Optional[str] = None

class PersonOut(PersonIn):
    id: int

# --- Linhas ---
class LineIn(BaseModel):
    name: str

class LineOut(LineIn):
    id: int

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
    published_at: date
    line_id: Optional[int] = None
    system_id: Optional[int] = None
    people: List[MediaPersonLink] = Field(default_factory=list)

class MediaOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    platform: Platform
    url: str
    published_at: str
    line_id: Optional[int]
    system_id: Optional[int]
    people: List[MediaPersonLink] = []
