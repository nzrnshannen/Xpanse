import os
import shutil
import tempfile
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.domain import Meeting, MeetingMinute, Room

router = APIRouter(tags=["meetings"])

class ConnectionManager:
    def __init__(self):
        # room_id -> list of active connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, room_id: int, websocket: WebSocket):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, room_id: int, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, room_id: int, message: dict, exclude: WebSocket = None):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                if connection != exclude:
                    await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/spaces/{space_id}/meetings/{room_id}")
async def meeting_endpoint(websocket: WebSocket, space_id: int, room_id: int, session: AsyncSession = Depends(get_session)):
    room = await session.get(Room, room_id)
    if not room or room.space_id != space_id:
        await websocket.close(code=4004)
        return

    await manager.connect(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast signaling messages to other peers in the room
            await manager.broadcast(room_id, data, exclude=websocket)
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
        await manager.broadcast(room_id, {"type": "peer-left"})




@router.get("/meetings/{meeting_id}/minutes", response_model=MeetingMinute)
async def get_meeting_minutes(meeting_id: int, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(MeetingMinute).where(MeetingMinute.meeting_id == meeting_id))
    minute = result.scalars().first()
    if not minute:
        raise HTTPException(status_code=404, detail="Minutes not found for this meeting")
    return minute
