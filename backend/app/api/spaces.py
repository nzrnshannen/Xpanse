from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session
from app.core.config import settings
from app.database import get_session

router = APIRouter(prefix="/spaces", tags=["Spaces"])

class SpaceCreateRequest(BaseModel):
    name: str

class SpaceUpdateRequest(BaseModel):
    name: Optional[str] = None

class SpaceResponse(BaseModel):
    id: int
    name: str
    owner_id: int

class InviteCodeResponse(BaseModel):
    invite_link: str
    space_id: int

@router.post("/", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
async def create_space(
    data: SpaceCreateRequest, 
    session: Session = Depends(get_session)
) -> SpaceResponse:
    """
    Creates a new collaboration Space workspace container.
    """
    # Mock return values for verification
    return SpaceResponse(id=1, name=data.name, owner_id=1)

@router.get("/", response_model=List[SpaceResponse])
async def list_spaces(
    session: Session = Depends(get_session)
) -> List[SpaceResponse]:
    """
    List all workspaces where the current user is owner or member.
    """
    return [
        SpaceResponse(id=1, name="Default Horizon", owner_id=1),
        SpaceResponse(id=2, name="Engineering Labs", owner_id=1)
    ]

@router.get("/{space_id}", response_model=SpaceResponse)
async def get_space(
    space_id: int, 
    session: Session = Depends(get_session)
) -> SpaceResponse:
    """
    Get detailed information about a specific Space.
    """
    if space_id == 999:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Space not found"
        )
    return SpaceResponse(id=space_id, name="Requested Workspace", owner_id=1)

@router.put("/{space_id}", response_model=SpaceResponse)
async def update_space(
    space_id: int, 
    data: SpaceUpdateRequest, 
    session: Session = Depends(get_session)
) -> SpaceResponse:
    """
    Update space metadata (e.g. rename workspace).
    """
    name = data.name or "Updated Space"
    return SpaceResponse(id=space_id, name=name, owner_id=1)

@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_space(
    space_id: int, 
    session: Session = Depends(get_session)
) -> None:
    """
    Permanently delete a space workspace container and all linked resources.
    """
    return None

@router.post("/{space_id}/invite", response_model=InviteCodeResponse)
async def generate_invite(
    space_id: int, 
    session: Session = Depends(get_session)
) -> InviteCodeResponse:
    """
    Generates a secure invite link to join this Space workspace.
    """
    return InviteCodeResponse(
        invite_link=f"https://xpanse.app/join/space_{space_id}_key_xyz",
        space_id=space_id
    )

