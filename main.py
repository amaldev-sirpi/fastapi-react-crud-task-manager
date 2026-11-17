
from pathlib import Path
from typing import List

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas

from database import Base, engine, get_db


app = FastAPI(
    title="Task Manager API",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)


# Add due_date column to an existing database
def add_due_date_column_if_needed():

    inspector = inspect(engine)

    if "tasks" in inspector.get_table_names():

        columns = {
            column["name"]
            for column in inspector.get_columns("tasks")
        }

        if "due_date" not in columns:

            with engine.begin() as connection:

                connection.execute(
                    text(
                        "ALTER TABLE tasks ADD COLUMN due_date DATE"
                    )
                )


add_due_date_column_if_needed()


# Display the frontend
@app.get("/", include_in_schema=False)
def home():

    return FileResponse(
        Path(__file__).with_name("index.html")
    )


# READ - Get all tasks
@app.get(
    "/tasks/",
    response_model=List[schemas.TaskResponse]
)
def get_tasks(
    db: Session = Depends(get_db)
):

    tasks = (
        db.query(models.Task)
        .order_by(models.Task.id.desc())
        .all()
    )

    return tasks


# CREATE - Add a new task
@app.post(
    "/tasks/",
    response_model=schemas.TaskResponse,
    status_code=status.HTTP_201_CREATED
)
def create_task(
    task: schemas.TaskCreate,
    db: Session = Depends(get_db)
):

    title = task.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Task title cannot be empty"
        )

    db_task = models.Task(
        title=title,
        due_date=task.due_date,
        completed=False
    )

    db.add(db_task)

    db.commit()

    db.refresh(db_task)

    return db_task


# UPDATE - Update an existing task
@app.put(
    "/tasks/{task_id}",
    response_model=schemas.TaskResponse
)
def update_task(
    task_id: int,
    task: schemas.TaskUpdate,
    db: Session = Depends(get_db)
):

    db_task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )

    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    updates = task.model_dump(exclude_unset=True)

    # Update task title
    if "title" in updates:

        title = (updates["title"] or "").strip()

        if not title:
            raise HTTPException(
                status_code=422,
                detail="Task title cannot be empty"
            )

        db_task.title = title

    # Update or remove deadline
    if "due_date" in updates:

        db_task.due_date = updates["due_date"]

    # Update completed status
    if (
        "completed" in updates
        and updates["completed"] is not None
    ):

        db_task.completed = updates["completed"]

    db.commit()

    db.refresh(db_task)

    return db_task


# DELETE - Delete an existing task
@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db)
):

    db_task = (
        db.query(models.Task)
        .filter(models.Task.id == task_id)
        .first()
    )

    if db_task is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(db_task)

    db.commit()

    return {
        "message": "Task deleted successfully"
    }
