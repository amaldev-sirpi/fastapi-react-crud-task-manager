
from sqlalchemy import Boolean, Column, Date, Integer, String

from database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    completed = Column(
        Boolean,
        default=False,
        nullable=False
    )

    due_date = Column(
        Date,
        nullable=True
    )

    priority = Column(
        String(20),
        default="medium",
        nullable=False
    )
