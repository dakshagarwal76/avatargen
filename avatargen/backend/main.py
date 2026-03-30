"""AvatarGen API."""

import json
import shutil
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import Optional

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from services.avatar_service import AvatarService
from services.lipsync_service import LipSyncService
from services.tts_service import TTSService
from services.video_service import VideoService

UPLOAD_DIR = Path("storage/avatars")
AUDIO_DIR = Path("storage/audio")
VIDEO_DIR = Path("storage/videos")
TEMP_DIR = Path("storage/temp")
IMPORT_DIR = Path("storage/imports")
JOBS_FILE = Path("storage/jobs.json")

for d in [UPLOAD_DIR, AUDIO_DIR, VIDEO_DIR, TEMP_DIR, IMPORT_DIR]:
    d.mkdir(parents=True, exist_ok=True)
if not JOBS_FILE.exists():
    JOBS_FILE.write_text(json.dumps({}))

jobs: dict = {}


def load_jobs():
    global jobs
    try:
        jobs = json.loads(JOBS_FILE.read_text())
    except Exception:
        jobs = {}


def save_jobs():
    JOBS_FILE.write_text(json.dumps(jobs, indent=2))


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_jobs()
    yield


app = FastAPI(title="AvatarGen API", version="1.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/videos", StaticFiles(directory="storage/videos"), name="videos")
app.mount("/avatars", StaticFiles(directory="storage/avatars"), name="avatars")
app.mount("/audio", StaticFiles(directory="storage/audio"), name="audio")
app.mount("/imports", StaticFiles(directory="storage/imports"), name="imports")

tts_service = TTSService()
video_service = VideoService()
lipsync_service = LipSyncService()
avatar_service = AvatarService()


class TTSRequest(BaseModel):
    text: str
    voice: str = "hi-IN-SwaraNeural"
    rate: str = "+0%"
    pitch: str = "+0Hz"
    volume: str = "+0%"


class VideoJobRequest(BaseModel):
    avatar_id: str
    audio_id: Optional[str] = None
    tts_text: Optional[str] = None
    tts_voice: str = "hi-IN-SwaraNeural"
    tts_rate: str = "+0%"
    tts_pitch: str = "+0Hz"
    title: str = "My Video"
    description: str = ""
    source: str = "script"


class ImportVideoJobRequest(BaseModel):
    avatar_id: str
    import_video_id: str
    mode: str = "background_avatar_corner"
    title: str = "Imported Video"
    tts_text: Optional[str] = None
    tts_voice: str = "hi-IN-SwaraNeural"


@app.get("/api/voices")
async def get_voices():
    return {"voices": tts_service.get_all_voices(), "languages": tts_service.get_languages()}


@app.post("/api/tts/preview")
async def tts_preview(req: TTSRequest):
    audio_id = str(uuid.uuid4())
    out = AUDIO_DIR / f"{audio_id}.mp3"
    await tts_service.generate(req.text[:300], req.voice, str(out), req.rate, req.pitch, req.volume)
    return {"audio_url": f"/audio/{audio_id}.mp3", "audio_id": audio_id}


@app.post("/api/tts/generate")
async def tts_generate(req: TTSRequest):
    audio_id = str(uuid.uuid4())
    out = AUDIO_DIR / f"{audio_id}.mp3"
    await tts_service.generate(req.text, req.voice, str(out), req.rate, req.pitch, req.volume)
    return {"audio_url": f"/audio/{audio_id}.mp3", "audio_id": audio_id, "duration": await tts_service.get_duration(str(out))}


@app.get("/api/avatars/builtin")
async def list_builtin_avatars():
    avatars = []
    for item in avatar_service.BUILTIN_AVATARS:
        url = avatar_service.make_pollinations_url(item["prompt"], seed=item["seed"])
        avatars.append({"id": item["id"], "name": item["name"], "preview_url": url, "prompt": item["prompt"]})
    return {"avatars": avatars}


@app.post("/api/avatars/add-builtin/{builtin_id}")
async def add_builtin_avatar(builtin_id: str):
    item = next((a for a in avatar_service.BUILTIN_AVATARS if a["id"] == builtin_id), None)
    if not item:
        raise HTTPException(404, "Builtin avatar not found")

    avatar_id = str(uuid.uuid4())
    avatar_path = UPLOAD_DIR / f"{avatar_id}.jpg"
    url = avatar_service.make_pollinations_url(item["prompt"], seed=item["seed"])
    await avatar_service.download_to_path(url, avatar_path)

    meta = {
        "id": avatar_id,
        "name": item["name"],
        "type": "image",
        "path": str(avatar_path),
        "url": f"/avatars/{avatar_id}.jpg",
        "thumb_url": f"/avatars/{avatar_id}.jpg",
        "created_at": datetime.now().isoformat(),
        "source": "builtin",
    }
    (UPLOAD_DIR / f"{avatar_id}.json").write_text(json.dumps(meta))
    return meta


@app.post("/api/avatars/generate")
async def generate_avatar_from_prompt(prompt: str = Form(...), name: str = Form("Generated Avatar"), seed: int = Form(1234)):
    avatar_id = str(uuid.uuid4())
    avatar_path = UPLOAD_DIR / f"{avatar_id}.jpg"
    url = avatar_service.make_pollinations_url(prompt, seed=seed)
    await avatar_service.download_to_path(url, avatar_path)

    meta = {
        "id": avatar_id,
        "name": name,
        "type": "image",
        "path": str(avatar_path),
        "url": f"/avatars/{avatar_id}.jpg",
        "thumb_url": f"/avatars/{avatar_id}.jpg",
        "created_at": datetime.now().isoformat(),
        "source": "prompt",
        "prompt": prompt,
    }
    (UPLOAD_DIR / f"{avatar_id}.json").write_text(json.dumps(meta))
    return meta


@app.post("/api/avatars/upload")
async def upload_avatar(file: UploadFile = File(...), name: str = Form(...), is_video: bool = Form(False)):
    ext = Path(file.filename).suffix.lower()
    allowed_img = {".jpg", ".jpeg", ".png", ".webp"}
    allowed_vid = {".mp4", ".mov", ".webm"}
    if ext not in allowed_img | allowed_vid:
        raise HTTPException(400, "Unsupported file type. Use JPG/PNG/MP4.")

    avatar_id = str(uuid.uuid4())
    avatar_path = UPLOAD_DIR / f"{avatar_id}{ext}"
    with open(avatar_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if ext in allowed_vid:
        await video_service.extract_thumbnail(str(avatar_path), str(UPLOAD_DIR / f"{avatar_id}_thumb.jpg"))

    meta = {
        "id": avatar_id,
        "name": name,
        "type": "video" if ext in allowed_vid else "image",
        "path": str(avatar_path),
        "url": f"/avatars/{avatar_id}{ext}",
        "thumb_url": f"/avatars/{avatar_id}_thumb.jpg" if ext in allowed_vid else f"/avatars/{avatar_id}{ext}",
        "created_at": datetime.now().isoformat(),
        "source": "upload",
    }
    (UPLOAD_DIR / f"{avatar_id}.json").write_text(json.dumps(meta))
    return meta


@app.get("/api/avatars")
async def list_avatars():
    avatars = []
    for f in UPLOAD_DIR.glob("*.json"):
        try:
            avatars.append(json.loads(f.read_text()))
        except Exception:
            pass
    return {"avatars": sorted(avatars, key=lambda x: x["created_at"], reverse=True)}


@app.delete("/api/avatars/{avatar_id}")
async def delete_avatar(avatar_id: str):
    for f in UPLOAD_DIR.glob(f"{avatar_id}*"):
        f.unlink(missing_ok=True)
    return {"deleted": avatar_id}


async def run_video_job(job_id: str):
    job = jobs[job_id]
    try:
        jobs[job_id].update({"status": "processing", "step": "Preparing audio...", "progress": 10})
        save_jobs()

        if job.get("audio_id"):
            audio_path = str(AUDIO_DIR / f"{job['audio_id']}.mp3")
            if not Path(audio_path).exists():
                audio_path = str(AUDIO_DIR / f"{job['audio_id']}.wav")
        elif job.get("tts_text"):
            audio_id = str(uuid.uuid4())
            audio_path = str(AUDIO_DIR / f"{audio_id}.mp3")
            await tts_service.generate(job["tts_text"], job.get("tts_voice", "hi-IN-SwaraNeural"), audio_path, job.get("tts_rate", "+0%"), job.get("tts_pitch", "+0Hz"))
            jobs[job_id]["audio_id"] = audio_id
        else:
            raise ValueError("No audio source provided")

        jobs[job_id].update({"step": "Loading avatar...", "progress": 25})
        save_jobs()
        meta_file = UPLOAD_DIR / f"{job['avatar_id']}.json"
        if not meta_file.exists():
            raise ValueError("Avatar not found")
        avatar_path = json.loads(meta_file.read_text())["path"]

        jobs[job_id].update({"step": "Running lip sync...", "progress": 40})
        save_jobs()
        video_id = str(uuid.uuid4())
        speaking_video_path = str(VIDEO_DIR / f"{video_id}_speaking.mp4")
        await lipsync_service.run(avatar_path=avatar_path, audio_path=audio_path, output_path=speaking_video_path, job_id=job_id, jobs=jobs)

        final_path = str(VIDEO_DIR / f"{video_id}.mp4")
        if job.get("source") == "import_video" and job.get("import_video_path"):
            jobs[job_id].update({"step": "Compositing with uploaded video...", "progress": 85})
            save_jobs()
            await video_service.overlay_corner(job["import_video_path"], speaking_video_path, final_path)
        else:
            shutil.move(speaking_video_path, final_path)

        jobs[job_id].update({"step": "Finalizing...", "progress": 92})
        save_jobs()
        await video_service.extract_thumbnail(final_path, str(VIDEO_DIR / f"{video_id}_thumb.jpg"))

        jobs[job_id].update({
            "status": "completed",
            "step": "Done!",
            "progress": 100,
            "video_id": video_id,
            "video_url": f"/videos/{video_id}.mp4",
            "thumb_url": f"/videos/{video_id}_thumb.jpg",
            "duration": await video_service.get_duration(final_path),
            "completed_at": datetime.now().isoformat(),
        })
        save_jobs()
    except Exception as e:
        jobs[job_id].update({"status": "failed", "step": f"Failed: {e}", "error": str(e)})
        save_jobs()


@app.post("/api/videos/generate")
async def generate_video(req: VideoJobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    jobs[job_id] = req.model_dump() | {"id": job_id, "status": "queued", "step": "Queued...", "progress": 0, "created_at": datetime.now().isoformat()}
    save_jobs()
    background_tasks.add_task(run_video_job, job_id)
    return {"job_id": job_id, "status": "queued"}


@app.post("/api/imports/video")
async def upload_import_video(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in {".mp4", ".mov", ".webm", ".mkv"}:
        raise HTTPException(400, "Unsupported video format")

    video_id = str(uuid.uuid4())
    video_path = IMPORT_DIR / f"{video_id}{ext}"
    with open(video_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    audio_path = AUDIO_DIR / f"{video_id}.mp3"
    await video_service.extract_audio_from_video(str(video_path), str(audio_path))
    await video_service.extract_thumbnail(str(video_path), str(IMPORT_DIR / f"{video_id}_thumb.jpg"))

    return {
        "import_video_id": video_id,
        "video_url": f"/imports/{video_id}{ext}",
        "thumb_url": f"/imports/{video_id}_thumb.jpg",
        "audio_id": video_id,
        "duration": await video_service.get_duration(str(video_path)),
        "filename": file.filename,
    }


@app.post("/api/videos/from-import")
async def generate_from_import_video(req: ImportVideoJobRequest, background_tasks: BackgroundTasks):
    matching = list(IMPORT_DIR.glob(f"{req.import_video_id}.*"))
    import_video_path = next((str(p) for p in matching if p.suffix.lower() != ".jpg"), None)
    if not import_video_path:
        raise HTTPException(404, "Imported video not found")

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "id": job_id,
        "title": req.title,
        "avatar_id": req.avatar_id,
        "audio_id": req.import_video_id,
        "tts_text": req.tts_text,
        "tts_voice": req.tts_voice,
        "source": "import_video",
        "mode": req.mode,
        "import_video_id": req.import_video_id,
        "import_video_path": import_video_path,
        "status": "queued",
        "step": "Queued...",
        "progress": 0,
        "created_at": datetime.now().isoformat(),
    }
    save_jobs()
    background_tasks.add_task(run_video_job, job_id)
    return {"job_id": job_id, "status": "queued"}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    load_jobs()
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@app.get("/api/jobs")
async def list_jobs():
    load_jobs()
    return {"jobs": sorted(jobs.values(), key=lambda x: x.get("created_at", ""), reverse=True)}


@app.post("/api/audio/upload")
async def upload_audio(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix.lower()
    if ext not in {".mp3", ".wav", ".m4a", ".ogg", ".aac"}:
        raise HTTPException(400, "Unsupported audio format")

    audio_id = str(uuid.uuid4())
    source = AUDIO_DIR / f"{audio_id}{ext}"
    with open(source, "wb") as f:
        shutil.copyfileobj(file.file, f)

    if ext != ".mp3":
        mp3_path = AUDIO_DIR / f"{audio_id}.mp3"
        await video_service.convert_audio(str(source), str(mp3_path))
        source.unlink(missing_ok=True)

    return {"audio_id": audio_id, "audio_url": f"/audio/{audio_id}.mp3"}


@app.get("/api/videos")
async def list_videos():
    load_jobs()
    videos = [j for j in jobs.values() if j.get("status") == "completed"]
    return {"videos": sorted(videos, key=lambda x: x.get("created_at", ""), reverse=True)}


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
    jobs.pop(job_id, None)
    save_jobs()
    return {"deleted": job_id}


@app.get("/api/health")
async def health():
    checks = {
        "ffmpeg": await video_service.check_ffmpeg(),
        "wav2lip": lipsync_service.check_wav2lip(),
        "edge_tts": await tts_service.check_edge_tts(),
    }
    return {"status": "ok" if all(checks.values()) else "degraded", "checks": checks, "version": "1.1.0"}


@app.get("/")
async def root():
    return {"message": "AvatarGen API is running."}
