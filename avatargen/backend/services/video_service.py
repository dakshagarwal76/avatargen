"""
Video Service — FFmpeg wrappers for thumbnails, duration, conversions.
"""

import asyncio
from pathlib import Path


class VideoService:

    async def extract_thumbnail(self, video_path: str, thumb_path: str) -> None:
        """Extract first frame of a video as JPEG thumbnail."""
        cmd = [
            "ffmpeg", "-y",
            "-i",       video_path,
            "-vframes", "1",
            "-vf",      "scale=640:-1",
            "-q:v",     "2",
            thumb_path,
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

    async def get_duration(self, media_path: str) -> float:
        """Get duration of a media file in seconds."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                media_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            return float(stdout.decode().strip())
        except:
            return 0.0

    async def convert_audio(self, input_path: str, output_path: str) -> None:
        """Convert audio to MP3."""
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-acodec", "libmp3lame",
            "-q:a", "2",
            output_path,
        ]
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        await proc.communicate()

    async def check_ffmpeg(self) -> bool:
        """Check if FFmpeg is available."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffmpeg", "-version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            return proc.returncode == 0
        except:
            return False
