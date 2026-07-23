import json
from openai import AsyncOpenAI
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY or "dummy_key")

async def transcribe_audio(file_path: str) -> str:
    """
    Transcribes an audio file using OpenAI's Whisper API.
    """
    with open(file_path, "rb") as audio_file:
        transcription = await client.audio.transcriptions.create(
            model="whisper-1", 
            file=audio_file
        )
    return transcription.text

async def generate_meeting_minutes(transcript: str) -> dict:
    """
    Generates structured Minutes of Meeting (MoM) from a transcript using GPT-4o-mini.
    """
    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={ "type": "json_object" },
        messages=[
            {
                "role": "system", 
                "content": (
                    "You are a professional meeting assistant. Your task is to extract minutes of the meeting from the provided transcript. "
                    "You must output JSON containing exactly three keys: "
                    "'summary' (a concise paragraph overview), "
                    "'decisions' (an array of string bullet points of key agreements made), and "
                    "'action_items' (an array of objects, each with 'title' (string) and 'assignee' (string, or 'Unassigned' if not mentioned))."
                )
            },
            {
                "role": "user", 
                "content": transcript
            }
        ]
    )
    
    content = response.choices[0].message.content
    if not content:
        return {"summary": "", "decisions": [], "action_items": []}
        
    return json.loads(content)
