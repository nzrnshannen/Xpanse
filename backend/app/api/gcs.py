from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlmodel import Session
from app.core.database import get_session

router = APIRouter(prefix="/gcs", tags=["Real-time Chat & WebSockets"])

class ChatMessageResponse(BaseModel):
    id: int
    room_id: int
    sender_id: int
    sender_name: str
    message: str
    timestamp: str

class PostMessageRequest(BaseModel):
    message: str

# WebSocket Connection Manager to coordinate broadcast messaging
class ConnectionManager:
    def __init__(self) -> None:
        # Tracks active connections per room_id
        self.active_connections: dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: int) -> None:
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: int) -> None:
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: int) -> None:
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.get("/rooms/{room_id}/messages", response_model=List[ChatMessageResponse])
async def get_chat_history(
    room_id: int, 
    session: Session = Depends(get_session)
) -> List[ChatMessageResponse]:
    """
    HTTP endpoint to fetch historic room chat logs.
    """
    return [
        ChatMessageResponse(
            id=1, 
            room_id=room_id, 
            sender_id=2, 
            sender_name="Sarah K.", 
            message="Hey team, did the new API gateway deploy?", 
            timestamp="10:02 AM"
        ),
        ChatMessageResponse(
            id=2, 
            room_id=room_id, 
            sender_id=3, 
            sender_name="Alex M.", 
            message="Yes, running health checks now. Looks solid!", 
            timestamp="10:03 AM"
        )
    ]

@router.post("/rooms/{room_id}/messages", response_model=ChatMessageResponse)
async def post_message_http(
    room_id: int,
    data: PostMessageRequest,
    session: Session = Depends(get_session)
) -> ChatMessageResponse:
    """
    HTTP POST fallback to send a message to a chat room without WebSocket connectivity.
    """
    return ChatMessageResponse(
        id=3,
        room_id=room_id,
        sender_id=1,
        sender_name="You",
        message=data.message,
        timestamp="Just now"
    )

@router.websocket("/rooms/{room_id}/ws")
async def websocket_chat_endpoint(websocket: WebSocket, room_id: int) -> None:
    """
    WebSocket endpoint for real-time bi-directional team communication.
    Broadcasts incoming payloads to all users connected to the same room.
    """
    await manager.connect(websocket, room_id)
    
    # Broadcast join event
    await manager.broadcast(
        f"{\"event\": \"join\", \"room_id\": {room_id}, \"message\": \"A user has joined the channel\"}", 
        room_id
    )
    
    try:
        while True:
            # Await raw websocket payload text
            data = await websocket.receive_text()
            
            # Broadcast the received message to all channel subscribers
            await manager.broadcast(
                f"{\"event\": \"message\", \"room_id\": {room_id}, \"message\": {repr(data)}}", 
                room_id
            )
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
        await manager.broadcast(
            f"{\"event\": \"leave\", \"room_id\": {room_id}, \"message\": \"A user has left the channel\"}", 
            room_id
        )
