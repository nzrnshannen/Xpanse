import os
import shutil
import tempfile
from typing import List, Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.domain import Meeting, MeetingMinute, Room
from app.core.ai import transcribe_audio, generate_meeting_minutes

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
async def meeting_endpoint(websocket: WebSocket, space_id: int, room_id: int, session: Session = Depends(get_session)):
    room = session.get(Room, room_id)
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


@router.post("/meetings/{room_id}/audio", response_model=MeetingMinute)
async def upload_meeting_audio(room_id: int, file: UploadFile = File(...), session: Session = Depends(get_session)):
    """
    Receives an audio file after a meeting ends, uses OpenAI Whisper to transcribe it,
    then uses GPT-4o-mini to generate structured Minutes of the Meeting (MoM).
    Returns the MoM.
    """
    room = session.get(Room, room_id)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    # Create a meeting record if we don't have a structured workflow for starting a meeting
    meeting = Meeting(room_id=room_id)
    session.add(meeting)
    session.commit()
    session.refresh(meeting)

    temp_file_path = ""
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_file_path = temp_file.name

        # Transcribe using Whisper
        transcript = await transcribe_audio(temp_file_path)

        # Generate MoM
        mom_data = await generate_meeting_minutes(transcript)

        # Save to database
        meeting_minute = MeetingMinute(
            meeting_id=meeting.id,
            summary=mom_data.get("summary", ""),
            decisions=mom_data.get("decisions", []),
            action_items=mom_data.get("action_items", [])
        )
        session.add(meeting_minute)
        session.commit()
        session.refresh(meeting_minute)

        return meeting_minute
    except Exception as e:
        print(f"Error processing meeting audio: {e}")
        raise HTTPException(status_code=500, detail="Failed to process meeting audio")
    finally:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@router.get("/meetings/{meeting_id}/minutes", response_model=MeetingMinute)
async def get_meeting_minutes(meeting_id: int, session: Session = Depends(get_session)):
    minute = session.exec(select(MeetingMinute).where(MeetingMinute.meeting_id == meeting_id)).first()
    if not minute:
        raise HTTPException(status_code=404, detail="Minutes not found for this meeting")
    return minute
