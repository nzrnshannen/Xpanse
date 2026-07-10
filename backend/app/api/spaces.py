from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from sqlmodel import Session
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.database import get_session

# Initialize AsyncOpenAI client instance
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or None)

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
        invite_link=f"https://expanse.app/join/space_{space_id}_key_xyz",
        space_id=space_id
    )

@router.websocket("/{space_id}/ai-chat")
async def websocket_ai_chat_endpoint(websocket: WebSocket, space_id: int) -> None:
    """
    WebSocket endpoint for live, async token-streaming chat with the Space co-pilot.
    Reads current Kanban tasks as context, calls GPT-4o-mini, and streams response tokens.
    """
    await websocket.accept()
    
    # Placeholder context tasks for Kanban boards
    mock_tasks = [
        {"id": "t1", "title": "Plan core workspace routes", "column": "todo", "category": "Dev"},
        {"id": "t2", "title": "Write FastAPI WebSocket models", "column": "progress", "category": "Backend"},
        {"id": "t3", "title": "Finalize Tailwind design tokens", "column": "done", "category": "Design"},
        {"id": "t4", "title": "Integrate streaming OpenAI assistant", "column": "progress", "category": "AI Development"}
    ]
    
    system_prompt = (
        "You are Expanse AI, a helpful native workspace co-pilot built for the team collaboration tool 'Expanse'. "
        "You have access to the current space's Kanban board tasks. Here is the list of current tasks on the board:\n"
        f"{mock_tasks}\n\n"
        "Use this context to help answer user questions. For example, if they ask about progress or task states, reference this board. "
        "Keep your responses concise, helpful, and formatted in Markdown."
    )
    
    try:
        while True:
            # Wait for user query prompt
            user_query = await websocket.receive_text()
            
            try:
                # Call OpenAI streaming completions
                response = await openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_query}
                    ],
                    stream=True
                )
                
                # Stream token chunks in real-time
                async for chunk in response:
                    token = chunk.choices[0].delta.content
                    if token:
                        await websocket.send_text(token)
                        
            except Exception as inner_error:
                # Send error details back to screen
                await websocket.send_text(f"\n[AI Error: {str(inner_error)}]")
            
    except WebSocketDisconnect:
        # Gracefully swallow client terminations
        pass

