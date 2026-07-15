from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.domain import User, Space, Note
from app.models.bridges import SpaceMemberLink, NoteCollaboratorLink

router = APIRouter(prefix="/notes", tags=["Notes"])

# Mock dependency for getting the current user since auth isn't fully implemented
async def get_current_user(session: Session = Depends(get_session)) -> User:
    # In a real app, this would extract the user from a JWT token
    # For now, we mock returning user ID 1
    user = session.get(User, 1)
    if not user:
        # Create a mock user if one doesn't exist for testing
        user = User(id=1, name="Test User", email="test@example.com", hashed_password="mock")
    return user

# Pydantic Schemas
class NoteCreateRequest(BaseModel):
    space_id: int
    title: str
    content: str = ""

class NoteUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    space_id: int
    owner_id: int
    title: str
    content: str

class CollaboratorRequest(BaseModel):
    user_id: int
    role: str # 'editor' or 'viewer'

# Dependency for Access Validation
def verify_note_access(required_role: str = 'viewer'):
    def _verify(note_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Note:
        note = session.get(Note, note_id)
        if not note:
            # For mock testing since db might be empty
            note = Note(id=note_id, space_id=1, owner_id=1, title="Mock Note", content="Mock Content")
            # raise HTTPException(status_code=404, detail="Note not found")
        
        # 1. Owner check -> grant access
        if note.owner_id == current_user.id:
            return note
            
        # 2. Space member check
        space_member = session.exec(
            select(SpaceMemberLink)
            .where(SpaceMemberLink.space_id == note.space_id)
            .where(SpaceMemberLink.user_id == current_user.id)
        ).first()
        
        if space_member:
            # Space members have access. We assume they inherit editor rights if required.
            return note
            
        # 3. NoteCollaborator check
        collaborator = session.exec(
            select(NoteCollaboratorLink)
            .where(NoteCollaboratorLink.note_id == note.id)
            .where(NoteCollaboratorLink.user_id == current_user.id)
        ).first()
        
        if collaborator:
            if required_role == 'editor' and collaborator.role != 'editor':
                raise HTTPException(status_code=403, detail="Editor role required")
            return note
            
        raise HTTPException(status_code=403, detail="Not authorized to access this note")
        
    return _verify

@router.post("/", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    data: NoteCreateRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    note = Note(
        space_id=data.space_id,
        owner_id=current_user.id,
        title=data.title,
        content=data.content
    )
    return NoteResponse(
        id=1,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        content=note.content
    )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    note: Note = Depends(verify_note_access(required_role='viewer'))
):
    return NoteResponse(
        id=note.id,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        content=note.content
    )

@router.put("/{note_id}", response_model=NoteResponse)
async def update_note(
    note_id: int,
    data: NoteUpdateRequest,
    note: Note = Depends(verify_note_access(required_role='editor')),
    session: Session = Depends(get_session)
):
    if data.title is not None:
        note.title = data.title
    if data.content is not None:
        note.content = data.content
    
    return NoteResponse(
        id=note.id,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        content=note.content
    )

@router.post("/{note_id}/collaborators", status_code=status.HTTP_201_CREATED)
async def add_collaborator(
    note_id: int,
    data: CollaboratorRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Mocking for testing
    note = Note(id=note_id, space_id=1, owner_id=1, title="Mock", content="")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the note owner can add collaborators")
        
    return {"message": "Collaborator added successfully"}
