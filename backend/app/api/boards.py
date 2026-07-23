from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, model_validator
from sqlmodel import Session, select
from app.database import get_session
from app.models.domain import Board, BoardColumn, Task, Space

router = APIRouter(prefix="/boards", tags=["Boards & Tasks"])

# Pydantic Schemas

# Global Preset Labels
PRESET_LABELS = [
    {"name": "Dev", "color": "#A855F7"},
    {"name": "Backend", "color": "#3B82F6"},
    {"name": "Design", "color": "#EC4899"},
    {"name": "QA", "color": "#EAB308"},
    {"name": "Urgent", "color": "#EF4444"},
]

class TaskLabel(BaseModel):
    name: str
    color: str
    is_custom: bool = False
    
    @model_validator(mode='after')
    def validate_label(self):
        if not self.is_custom:
            valid_preset = any(p["name"] == self.name and p["color"] == self.color for p in PRESET_LABELS)
            if not valid_preset:
                raise ValueError(f"Label '{self.name}' with color '{self.color}' is not a valid preset. Set is_custom=True for custom labels.")
        return self

class BoardCreateRequest(BaseModel):
    space_id: int
    name: str

class BoardColumnCreate(BaseModel):
    name: str

class BoardColumnUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[int] = None

class ColumnReorderItem(BaseModel):
    column_id: int
    position: int

class TaskCreateRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "Task"
    labels: Optional[List[TaskLabel]] = None

class TaskUpdateRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    column_id: Optional[int] = None
    position: Optional[int] = None
    category: Optional[str] = None
    labels: Optional[List[TaskLabel]] = None


# Board Endpoints

@router.get("/labels/presets")
async def get_preset_labels():
    return PRESET_LABELS

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_board(
    data: BoardCreateRequest,
    session: Session = Depends(get_session)
):
    space = session.get(Space, data.space_id)
    if not space:
        raise HTTPException(status_code=404, detail="Space not found")
        
    new_board = Board(space_id=data.space_id, name=data.name)
    session.add(new_board)
    session.commit()
    session.refresh(new_board)

    # Create default columns
    cols = [
        BoardColumn(board_id=new_board.id, name="To Do", position=0),
        BoardColumn(board_id=new_board.id, name="In Progress", position=1),
        BoardColumn(board_id=new_board.id, name="Done", position=2)
    ]
    session.add_all(cols)
    session.commit()
    session.refresh(new_board)
    return new_board

# Column Endpoints

@router.get("/{board_id}/columns")
async def get_columns(
    board_id: int,
    session: Session = Depends(get_session)
):
    board = session.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    statement = select(BoardColumn).where(BoardColumn.board_id == board_id).order_by(BoardColumn.position)
    columns = session.exec(statement).all()
    
    # Return with tasks
    result = []
    for c in columns:
        c_tasks = sorted(c.tasks, key=lambda t: t.position)
        result.append({
            "id": c.id,
            "board_id": c.board_id,
            "name": c.name,
            "position": c.position,
            "tasks": c_tasks
        })
    return result

@router.post("/{board_id}/columns", status_code=status.HTTP_201_CREATED)
async def create_column(
    board_id: int,
    data: BoardColumnCreate,
    session: Session = Depends(get_session)
):
    board = session.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
        
    statement = select(BoardColumn).where(BoardColumn.board_id == board_id).order_by(BoardColumn.position.desc())
    last_col = session.exec(statement).first()
    next_pos = last_col.position + 1 if last_col else 0

    new_column = BoardColumn(board_id=board_id, name=data.name, position=next_pos)
    session.add(new_column)
    session.commit()
    session.refresh(new_column)
    
    return {
        "id": new_column.id,
        "board_id": new_column.board_id,
        "name": new_column.name,
        "position": new_column.position,
        "tasks": []
    }

@router.put("/{board_id}/columns/reorder")
async def reorder_columns(
    board_id: int,
    items: List[ColumnReorderItem],
    session: Session = Depends(get_session)
):
    board = session.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
        
    for item in items:
        col = session.get(BoardColumn, item.column_id)
        if col and col.board_id == board_id:
            col.position = item.position
            session.add(col)
            
    session.commit()
    return {"success": True}

@router.put("/columns/{column_id}")
async def update_column(
    column_id: int,
    data: BoardColumnUpdate,
    session: Session = Depends(get_session)
):
    column = session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
        
    if data.name is not None:
        column.name = data.name
    if data.position is not None:
        column.position = data.position
        
    session.add(column)
    session.commit()
    session.refresh(column)
    return column

@router.delete("/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_column(
    column_id: int,
    session: Session = Depends(get_session)
):
    column = session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
        
    board_id = column.board_id
    
    # Safe delete strategy: check if there are tasks. 
    # Let's move them to the first available column (that isn't this one)
    statement = select(BoardColumn).where(BoardColumn.board_id == board_id, BoardColumn.id != column_id).order_by(BoardColumn.position)
    first_col = session.exec(statement).first()
    
    if first_col and column.tasks:
        for t in column.tasks:
            t.column_id = first_col.id
            session.add(t)
            
    session.delete(column)
    session.commit()
    return None

# Task Endpoints

@router.post("/columns/{column_id}/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(
    column_id: int,
    data: TaskCreateRequest,
    session: Session = Depends(get_session)
):
    column = session.get(BoardColumn, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
        
    statement = select(Task).where(Task.column_id == column_id).order_by(Task.position.desc())
    last_task = session.exec(statement).first()
    next_pos = last_task.position + 1 if last_task else 0
    
    new_task = Task(
        column_id=column_id,
        title=data.title,
        description=data.description,
        position=next_pos,
        category=data.category,
        labels=[label.model_dump() for label in data.labels] if data.labels is not None else []
    )
    session.add(new_task)
    session.commit()
    session.refresh(new_task)
    return new_task

@router.put("/tasks/{task_id}")
async def update_task(
    task_id: int,
    data: TaskUpdateRequest,
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.column_id is not None:
        task.column_id = data.column_id
    if data.position is not None:
        task.position = data.position
    if data.category is not None:
        task.category = data.category
    if data.labels is not None:
        task.labels = [label.model_dump() for label in data.labels]
        
    session.add(task)
    session.commit()
    session.refresh(task)
    return task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    session: Session = Depends(get_session)
):
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    session.delete(task)
    session.commit()
    return None
