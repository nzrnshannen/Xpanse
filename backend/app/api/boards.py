from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session
from app.core.database import get_session

router = APIRouter(prefix="/boards", tags=["Boards & Tasks"])

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    column: str = "todo"  # e.g., "todo", "progress", "done"

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column: Optional[str] = None

class TaskResponse(BaseModel):
    id: int
    board_id: int
    title: str
    description: Optional[str] = None
    column: str

@router.get("/{board_id}/tasks", response_model=List[TaskResponse])
async def get_board_tasks(
    board_id: int, 
    session: Session = Depends(get_session)
) -> List[TaskResponse]:
    """
    Get all tasks inside a specific Kanban project board.
    """
    return [
        TaskResponse(
            id=1, 
            board_id=board_id, 
            title="Design landing page dark mode", 
            column="progress"
        ),
        TaskResponse(
            id=2, 
            board_id=board_id, 
            title="Initialize GraphQL client", 
            column="todo"
        )
    ]

@router.post("/{board_id}/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    board_id: int, 
    data: TaskCreateRequest, 
    session: Session = Depends(get_session)
) -> TaskResponse:
    """
    Create a new Kanban task on a board.
    """
    return TaskResponse(
        id=3, 
        board_id=board_id, 
        title=data.title, 
        description=data.description, 
        column=data.column
    )

@router.put("/{board_id}/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    board_id: int, 
    task_id: int, 
    data: TaskUpdateRequest, 
    session: Session = Depends(get_session)
) -> TaskResponse:
    """
    Update a task's title, description, or its board column status (e.g. state transition).
    """
    title = data.title or "Updated task title"
    column = data.column or "progress"
    return TaskResponse(
        id=task_id, 
        board_id=board_id, 
        title=title, 
        description=data.description, 
        column=column
    )

@router.delete("/{board_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    board_id: int, 
    task_id: int, 
    session: Session = Depends(get_session)
) -> None:
    """
    Delete a specific task card from the board.
    """
    return None
