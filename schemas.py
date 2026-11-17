
from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


# Schema used when creating a task
class TaskCreate(BaseModel):
    title: str = Field(
        min_length=1,
        max_length=250
    )

    due_date: Optional[date] = None

    priority: Literal["low", "medium", "high"] = "medium"


# Schema used when updating a task
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=250
    )

    due_date: Optional[date] = None

    priority: Optional[Literal["low", "medium", "high"]] = None

    completed: Optional[bool] = None


# Schema used when returning task information
class TaskResponse(BaseModel):

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    completed: bool
    due_date: Optional[date] = None
    priority: Literal["low", "medium", "high"]
