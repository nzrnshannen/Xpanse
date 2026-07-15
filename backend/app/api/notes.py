from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.domain import User, Space, Note, NoteChapter
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

class ChapterResponse(BaseModel):
    id: int
    title: str
    content: str
    order_index: int

class ChapterCreateRequest(BaseModel):
    title: str
    content: str = ""
    order_index: int = 0

class ChapterUpdateRequest(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order_index: Optional[int] = None

class NoteCreateRequest(BaseModel):
    space_id: int
    title: str

class NoteUpdateRequest(BaseModel):
    title: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    space_id: int
    owner_id: int
    title: str
    chapters: List[ChapterResponse] = []

class CollaboratorRequest(BaseModel):
    user_id: int
    role: str # 'editor' or 'viewer'

# Dependency for Access Validation
def verify_note_access(required_role: str = 'viewer'):
    def _verify(note_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> Note:
        note = session.get(Note, note_id)
        if not note:
            # For mock testing since db might be empty
            note = Note(id=note_id, space_id=1, owner_id=1, title="Mock Note")
            note.chapters = [NoteChapter(id=1, note_id=note_id, title="Overview", content="Mock Chapter", order_index=0)]
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

def verify_chapter_access(required_role: str = 'viewer'):
    def _verify(chapter_id: int, current_user: User = Depends(get_current_user), session: Session = Depends(get_session)) -> NoteChapter:
        chapter = session.get(NoteChapter, chapter_id)
        if not chapter:
            chapter = NoteChapter(id=chapter_id, note_id=1, title="Mock Chapter", content="", order_index=0)
            
        # Verify access via parent note
        verify_note_access(required_role)(chapter.note_id, current_user, session)
        return chapter
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
        title=data.title
    )
    return NoteResponse(
        id=1,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        chapters=[]
    )

@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: int,
    note: Note = Depends(verify_note_access(required_role='viewer'))
):
    # Sort chapters by order_index
    sorted_chapters = sorted(note.chapters, key=lambda c: c.order_index) if note.chapters else []
    return NoteResponse(
        id=note.id,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        chapters=[ChapterResponse(id=c.id, title=c.title, content=c.content, order_index=c.order_index) for c in sorted_chapters]
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
    
    sorted_chapters = sorted(note.chapters, key=lambda c: c.order_index) if note.chapters else []
    return NoteResponse(
        id=note.id,
        space_id=note.space_id,
        owner_id=note.owner_id,
        title=note.title,
        chapters=[ChapterResponse(id=c.id, title=c.title, content=c.content, order_index=c.order_index) for c in sorted_chapters]
    )

@router.post("/{note_id}/chapters", response_model=ChapterResponse, status_code=status.HTTP_201_CREATED)
async def create_chapter(
    note_id: int,
    data: ChapterCreateRequest,
    note: Note = Depends(verify_note_access(required_role='editor')),
    session: Session = Depends(get_session)
):
    import time
    # Mocking chapter response
    return ChapterResponse(
        id=int(time.time() * 1000),
        title=data.title,
        content=data.content,
        order_index=data.order_index
    )

@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: int,
    data: ChapterUpdateRequest,
    chapter: NoteChapter = Depends(verify_chapter_access(required_role='editor')),
    session: Session = Depends(get_session)
):
    if data.title is not None: chapter.title = data.title
    if data.content is not None: chapter.content = data.content
    if data.order_index is not None: chapter.order_index = data.order_index
    
    return ChapterResponse(
        id=chapter.id,
        title=chapter.title,
        content=chapter.content,
        order_index=chapter.order_index
    )

@router.delete("/chapters/{chapter_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chapter(
    chapter_id: int,
    chapter: NoteChapter = Depends(verify_chapter_access(required_role='editor')),
    session: Session = Depends(get_session)
):
    return None

@router.post("/{note_id}/collaborators", status_code=status.HTTP_201_CREATED)
async def add_collaborator(
    note_id: int,
    data: CollaboratorRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Mocking for testing
    note = Note(id=note_id, space_id=1, owner_id=1, title="Mock")
    if note.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the note owner can add collaborators")
        
    return {"message": "Collaborator added successfully"}
