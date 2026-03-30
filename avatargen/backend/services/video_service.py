"""Video Service — FFmpeg wrappers for thumbnails, duration, conversions."""

import asyncio


class VideoService:
    async def extract_thumbnail(self, video_path: str, thumb_path: str) -> None:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-vframes", "1", "-vf", "scale=640:-1", "-q:v", "2", thumb_path]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

    async def get_duration(self, media_path: str) -> float:
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
                media_path, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            return float(stdout.decode().strip())
        except Exception:
            return 0.0

    async def convert_audio(self, input_path: str, output_path: str) -> None:
        cmd = ["ffmpeg", "-y", "-i", input_path, "-acodec", "libmp3lame", "-q:a", "2", output_path]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

    async def extract_audio_from_video(self, video_path: str, output_path: str) -> None:
        cmd = ["ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "libmp3lame", "-q:a", "2", output_path]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

    async def overlay_corner(self, background_video: str, overlay_video: str, output_path: str, position: str = "bottom-right") -> None:
        positions = {
            "bottom-right": "W-w-24:H-h-24",
            "bottom-left": "24:H-h-24",
            "top-right": "W-w-24:24",
            "top-left": "24:24",
        }
        coords = positions.get(position, positions["bottom-right"])
        filter_complex = f"[1:v]scale=iw*0.33:-1[ov];[0:v][ov]overlay={coords}"
        cmd = [
            "ffmpeg", "-y", "-i", background_video, "-i", overlay_video,
            "-filter_complex", filter_complex,
            "-map", "0:a?", "-map", "0:v", "-map", "1:a?",
            "-c:v", "libx264", "-preset", "veryfast", "-crf", "23", "-shortest", output_path,
        ]
        proc = await asyncio.create_subprocess_exec(*cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        await proc.communicate()

    async def check_ffmpeg(self) -> bool:
        try:
            proc = await asyncio.create_subprocess_exec("ffmpeg", "-version", stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
            await proc.communicate()
            return proc.returncode == 0
        except Exception:
            return False
