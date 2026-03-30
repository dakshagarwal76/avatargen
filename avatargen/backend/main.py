"""
AvatarGen - Free HeyGen Alternative
Main FastAPI Application
"""

import os
import uuid
import json
import asyncio
import shutil
from pathlib import Path
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from services.tts_service import TTSService
from services.video_service import VideoService
from services.lipsync_service import LipSyncService
from config import settings

# ── Directories ────────────────────────────────────────────────────────────────
UPLOAD_DIR    = Path("storage/avatars")
AUDIO_DIR     = Path("storage/audio")
VIDEO_DIR     = Path("storage/videos")
TEMP_DIR      = Path("storage/temp")
JOBS_FILE     = Path("storage/jobs.json")

for d in [UPLOAD_DIR, AUDIO_DIR, VIDEO_DIR, TEMP_DIR]:
    d.mkdir(parents=True, exist_ok=True)

if not JOBS_FILE.exists():
    JOBS_FILE.write_text(json.dumps({}))

# ── In-memory job store ────────────────────────────────────────────────────────
jobs: dict = {}

def load_jobs():
    global jobs
    try:
        jobs = json.loads(JOBS_FILE.read_text())
    except:
        jobs = {}

def save_jobs():
    JOBS_FILE.write_text(json.dumps(jobs, indent=2))

# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    load_jobs()
    yield

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AvatarGen API",
    description="Free HeyGen Alternative — Indian Avatars & Voices",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated videos
app.mount("/videos",  StaticFiles(directory="storage/videos"),  name="videos")
app.mount("/avatars", StaticFiles(directory="storage/avatars"), name="avatars")
app.mount("/audio",   StaticFiles(directory="storage/audio"),   name="audio")

# ── Services ───────────────────────────────────────────────────────────────────
tts_service     = TTSService()
video_service   = VideoService()
lipsync_service = LipSyncService()


# ══════════════════════════════════════════════════════════════════════════════
#  VOICES
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/voices")
async def get_voices():
    """Return all available Indian + English voices."""
    return {
        "voices": tts_service.get_all_voices(),
        "languages": tts_service.get_languages(),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  TTS — Text to Speech
# ══════════════════════════════════════════════════════════════════════════════

class TTSRequest(BaseModel):
    text: str
    voice: str = "hi-IN-SwaraNeural"
    rate: str  = "+0%"     # e.g. "+10%", "-20%"
    pitch: str = "+0Hz"    # e.g. "+5Hz", "-10Hz"
    volume: str = "+0%"

@app.post("/api/tts/preview")
async def tts_preview(req: TTSRequest):
    """Generate a preview audio clip (first 300 chars)."""
    text = req.text[:300]
    audio_id   = str(uuid.uuid4())
    audio_path = AUDIO_DIR / f"{audio_id}.mp3"

    await tts_service.generate(
        text=text,
        voice=req.voice,
        output_path=str(audio_path),
        rate=req.rate,
        pitch=req.pitch,
        volume=req.volume,
    )
    return {"audio_url": f"/audio/{audio_id}.mp3", "audio_id": audio_id}


@app.post("/api/tts/generate")
async def tts_generate(req: TTSRequest):
    """Generate full TTS audio and return path."""
    audio_id   = str(uuid.uuid4())
    audio_path = AUDIO_DIR / f"{audio_id}.mp3"

    await tts_service.generate(
        text=req.text,
        voice=req.voice,
        output_path=str(audio_path),
        rate=req.rate,
        pitch=req.pitch,
        volume=req.volume,
    )
    return {
        "audio_url": f"/audio/{audio_id}.mp3",
        "audio_id":  audio_id,
        "duration":  await tts_service.get_duration(str(audio_path)),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  AVATARS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/avatars/upload")
async def upload_avatar(
    file: UploadFile = File(...),
    name: str = Form(...),
    is_video: bool = Form(False),
):
    """Upload an avatar image or short video clip."""
    ext   = Path(file.filename).suffix.lower()
    allowed_img = {".jpg", ".jpeg", ".png", ".webp"}
    allowed_vid = {".mp4", ".mov", ".webm"}

    if ext not in allowed_img | allowed_vid:
        raise HTTPException(400, "Unsupported file type. Use JPG/PNG/MP4.")

    avatar_id   = str(uuid.uuid4())
    avatar_path = UPLOAD_DIR / f"{avatar_id}{ext}"

    with open(avatar_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Generate thumbnail if video
    thumb_path = None
    if ext in allowed_vid:
        thumb_path = str(UPLOAD_DIR / f"{avatar_id}_thumb.jpg")
        await video_service.extract_thumbnail(str(avatar_path), thumb_path)

    meta = {
        "id":         avatar_id,
        "name":       name,
        "type":       "video" if ext in allowed_vid else "image",
        "path":       str(avatar_path),
        "url":        f"/avatars/{avatar_id}{ext}",
        "thumb_url":  f"/avatars/{avatar_id}_thumb.jpg" if thumb_path else f"/avatars/{avatar_id}{ext}",
        "created_at": datetime.now().isoformat(),
    }

    # Save metadata
    meta_file = UPLOAD_DIR / f"{avatar_id}.json"
    meta_file.write_text(json.dumps(meta))
    return meta


@app.get("/api/avatars")
async def list_avatars():
    """List all uploaded avatars."""
    avatars = []
    for f in UPLOAD_DIR.glob("*.json"):
        try:
            avatars.append(json.loads(f.read_text()))
        except:
            pass
    return {"avatars": sorted(avatars, key=lambda x: x["created_at"], reverse=True)}


@app.delete("/api/avatars/{avatar_id}")
async def delete_avatar(avatar_id: str):
    for f in UPLOAD_DIR.glob(f"{avatar_id}*"):
        f.unlink(missing_ok=True)
    return {"deleted": avatar_id}


# ══════════════════════════════════════════════════════════════════════════════
#  VIDEO GENERATION JOBS
# ══════════════════════════════════════════════════════════════════════════════

class VideoJobRequest(BaseModel):
    avatar_id:   str
    audio_id:    Optional[str] = None     # Use pre-generated TTS audio
    tts_text:    Optional[str] = None     # Or generate TTS inline
    tts_voice:   str = "hi-IN-SwaraNeural"
    tts_rate:    str = "+0%"
    tts_pitch:   str = "+0Hz"
    title:       str = "My Video"
    description: str = ""
    source:      str = "script"           # "script" | "notebooklm"

class NotebookLMJobRequest(BaseModel):
    avatar_id:  str
    audio_id:   str     # Pre-uploaded NotebookLM audio
    title:      str = "NotebookLM Video"
    description: str = ""


async def run_video_job(job_id: str):
    """Background task: TTS → Lip Sync → Finalize video."""
    job = jobs[job_id]
    try:
        jobs[job_id]["status"]  = "processing"
        jobs[job_id]["step"]    = "Generating audio..."
        jobs[job_id]["progress"]= 10
        save_jobs()

        audio_path = None

        # Step 1: Get audio
        if job.get("audio_id"):
            audio_path = str(AUDIO_DIR / f"{job['audio_id']}.mp3")
            if not Path(audio_path).exists():
                # Try wav
                audio_path = str(AUDIO_DIR / f"{job['audio_id']}.wav")
        elif job.get("tts_text"):
            audio_id   = str(uuid.uuid4())
            audio_path = str(AUDIO_DIR / f"{audio_id}.mp3")
            await tts_service.generate(
                text=job["tts_text"],
                voice=job.get("tts_voice", "hi-IN-SwaraNeural"),
                output_path=audio_path,
                rate=job.get("tts_rate", "+0%"),
                pitch=job.get("tts_pitch", "+0Hz"),
            )
            jobs[job_id]["audio_id"] = audio_id
        else:
            raise ValueError("No audio source provided")

        jobs[job_id]["step"]     = "Loading avatar..."
        jobs[job_id]["progress"] = 25
        save_jobs()

        # Step 2: Find avatar
        meta_file = UPLOAD_DIR / f"{job['avatar_id']}.json"
        if not meta_file.exists():
            raise ValueError(f"Avatar {job['avatar_id']} not found")
        avatar_meta  = json.loads(meta_file.read_text())
        avatar_path  = avatar_meta["path"]

        jobs[job_id]["step"]     = "Running lip sync..."
        jobs[job_id]["progress"] = 40
        save_jobs()

        # Step 3: Lip sync
        video_id    = str(uuid.uuid4())
        output_path = str(VIDEO_DIR / f"{video_id}.mp4")

        await lipsync_service.run(
            avatar_path=avatar_path,
            audio_path=audio_path,
            output_path=output_path,
            job_id=job_id,
            jobs=jobs,
        )

        jobs[job_id]["step"]     = "Finalizing..."
        jobs[job_id]["progress"] = 90
        save_jobs()

        # Step 4: Generate thumbnail
        thumb_path = str(VIDEO_DIR / f"{video_id}_thumb.jpg")
        await video_service.extract_thumbnail(output_path, thumb_path)

        duration = await video_service.get_duration(output_path)

        jobs[job_id].update({
            "status":     "completed",
            "step":       "Done!",
            "progress":   100,
            "video_id":   video_id,
            "video_url":  f"/videos/{video_id}.mp4",
            "thumb_url":  f"/videos/{video_id}_thumb.jpg",
            "duration":   duration,
            "completed_at": datetime.now().isoformat(),
        })
        save_jobs()

    except Exception as e:
        jobs[job_id].update({
            "status": "failed",
            "error":  str(e),
            "step":   f"Failed: {e}",
        })
        save_jobs()
        raise


@app.post("/api/videos/generate")
async def generate_video(req: VideoJobRequest, background_tasks: BackgroundTasks):
    """Create a video generation job."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id":          job_id,
        "title":       req.title,
        "description": req.description,
        "avatar_id":   req.avatar_id,
        "audio_id":    req.audio_id,
        "tts_text":    req.tts_text,
        "tts_voice":   req.tts_voice,
        "tts_rate":    req.tts_rate,
        "tts_pitch":   req.tts_pitch,
        "source":      req.source,
        "status":      "queued",
        "step":        "Queued...",
        "progress":    0,
        "created_at":  datetime.now().isoformat(),
    }
    save_jobs()
    background_tasks.add_task(run_video_job, job_id)
    return {"job_id": job_id, "status": "queued"}


@app.post("/api/videos/from-notebooklm")
async def generate_from_notebooklm(req: NotebookLMJobRequest, background_tasks: BackgroundTasks):
    """Generate a video from a NotebookLM audio upload."""
    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id":          job_id,
        "title":       req.title,
        "description": req.description,
        "avatar_id":   req.avatar_id,
        "audio_id":    req.audio_id,
        "tts_text":    None,
        "source":      "notebooklm",
        "status":      "queued",
        "step":        "Queued...",
        "progress":    0,
        "created_at":  datetime.now().isoformat(),
    }
    save_jobs()
    background_tasks.add_task(run_video_job, job_id)
    return {"job_id": job_id, "status": "queued"}


@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    load_jobs()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.get("/api/jobs")
async def list_jobs():
    load_jobs()
    return {
        "jobs": sorted(jobs.values(), key=lambda x: x["created_at"], reverse=True)
    }


# ══════════════════════════════════════════════════════════════════════════════
#  AUDIO UPLOAD (for NotebookLM imports)
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/api/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload an external audio file (e.g., exported from NotebookLM)."""
    ext = Path(file.filename).suffix.lower()
    if ext not in {".mp3", ".wav", ".m4a", ".ogg", ".aac"}:
        raise HTTPException(400, "Unsupported audio format")

    audio_id   = str(uuid.uuid4())
    audio_path = AUDIO_DIR / f"{audio_id}{ext}"

    with open(audio_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Normalize to mp3 if needed
    if ext != ".mp3":
        mp3_path = AUDIO_DIR / f"{audio_id}.mp3"
        await video_service.convert_audio(str(audio_path), str(mp3_path))
        audio_path.unlink(missing_ok=True)
        audio_path = mp3_path

    duration = await tts_service.get_duration(str(audio_path))

    return {
        "audio_id":  audio_id,
        "audio_url": f"/audio/{audio_id}.mp3",
        "duration":  duration,
        "filename":  file.filename,
    }


# ══════════════════════════════════════════════════════════════════════════════
#  VIDEO LIBRARY
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/videos")
async def list_videos():
    """List all completed videos."""
    load_jobs()
    videos = [j for j in jobs.values() if j.get("status") == "completed"]
    return {"videos": sorted(videos, key=lambda x: x["created_at"], reverse=True)}


@app.delete("/api/videos/{job_id}")
async def delete_video(job_id: str):
    load_jobs()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")

    vid_id = job.get("video_id")
    if vid_id:
        for f in VIDEO_DIR.glob(f"{vid_id}*"):
            f.unlink(missing_ok=True)

    del jobs[job_id]
    save_jobs()
    return {"deleted": job_id}


# ══════════════════════════════════════════════════════════════════════════════
#  HEALTH
# ══════════════════════════════════════════════════════════════════════════════

@app.get("/api/health")
async def health():
    checks = {
        "ffmpeg":   await video_service.check_ffmpeg(),
        "wav2lip":  lipsync_service.check_wav2lip(),
        "edge_tts": await tts_service.check_edge_tts(),
    }
    return {
        "status": "ok" if all(checks.values()) else "degraded",
        "checks": checks,
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    return {"message": "AvatarGen API is running. Visit /docs for API reference."}
