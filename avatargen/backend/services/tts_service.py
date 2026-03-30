"""
TTS Service — uses Microsoft Edge TTS via edge-tts library.
Completely free, supports 18+ Indian language voices.
"""

import asyncio
import subprocess
from pathlib import Path
from typing import List, Dict


INDIAN_VOICES: List[Dict] = [
    # ── Hindi ──────────────────────────────────────────────────────────────
    {"id": "hi-IN-SwaraNeural",    "name": "Swara",    "lang": "Hindi",   "gender": "Female", "flag": "🇮🇳"},
    {"id": "hi-IN-MadhurNeural",   "name": "Madhur",   "lang": "Hindi",   "gender": "Male",   "flag": "🇮🇳"},
    # ── English (Indian) ───────────────────────────────────────────────────
    {"id": "en-IN-NeerjaNeural",   "name": "Neerja",   "lang": "English (Indian)", "gender": "Female", "flag": "🇮🇳"},
    {"id": "en-IN-PrabhatNeural",  "name": "Prabhat",  "lang": "English (Indian)", "gender": "Male",   "flag": "🇮🇳"},
    # ── Tamil ──────────────────────────────────────────────────────────────
    {"id": "ta-IN-PallaviNeural",  "name": "Pallavi",  "lang": "Tamil",   "gender": "Female", "flag": "🇮🇳"},
    {"id": "ta-IN-ValluvarNeural", "name": "Valluvar", "lang": "Tamil",   "gender": "Male",   "flag": "🇮🇳"},
    # ── Telugu ─────────────────────────────────────────────────────────────
    {"id": "te-IN-ShrutiNeural",   "name": "Shruti",   "lang": "Telugu",  "gender": "Female", "flag": "🇮🇳"},
    {"id": "te-IN-MohanNeural",    "name": "Mohan",    "lang": "Telugu",  "gender": "Male",   "flag": "🇮🇳"},
    # ── Bengali ────────────────────────────────────────────────────────────
    {"id": "bn-IN-TanishaaNeural", "name": "Tanishaa", "lang": "Bengali", "gender": "Female", "flag": "🇮🇳"},
    {"id": "bn-IN-BashkarNeural",  "name": "Bashkar",  "lang": "Bengali", "gender": "Male",   "flag": "🇮🇳"},
    # ── Marathi ────────────────────────────────────────────────────────────
    {"id": "mr-IN-AarohiNeural",   "name": "Aarohi",   "lang": "Marathi", "gender": "Female", "flag": "🇮🇳"},
    {"id": "mr-IN-ManoharNeural",  "name": "Manohar",  "lang": "Marathi", "gender": "Male",   "flag": "🇮🇳"},
    # ── Gujarati ───────────────────────────────────────────────────────────
    {"id": "gu-IN-DhwaniNeural",   "name": "Dhwani",   "lang": "Gujarati","gender": "Female", "flag": "🇮🇳"},
    {"id": "gu-IN-NiranjanNeural", "name": "Niranjan", "lang": "Gujarati","gender": "Male",   "flag": "🇮🇳"},
    # ── Kannada ────────────────────────────────────────────────────────────
    {"id": "kn-IN-SapnaNeural",    "name": "Sapna",    "lang": "Kannada", "gender": "Female", "flag": "🇮🇳"},
    {"id": "kn-IN-GaganNeural",    "name": "Gagan",    "lang": "Kannada", "gender": "Male",   "flag": "🇮🇳"},
    # ── Malayalam ──────────────────────────────────────────────────────────
    {"id": "ml-IN-SobhanaNeural",  "name": "Sobhana",  "lang": "Malayalam","gender": "Female","flag": "🇮🇳"},
    {"id": "ml-IN-MidhunNeural",   "name": "Midhun",   "lang": "Malayalam","gender": "Male",  "flag": "🇮🇳"},
    # ── Punjabi ────────────────────────────────────────────────────────────
    {"id": "pa-IN-VaaniNeural",    "name": "Vaani",    "lang": "Punjabi", "gender": "Female", "flag": "🇮🇳"},
    {"id": "pa-IN-OjasNeural",     "name": "Ojas",     "lang": "Punjabi", "gender": "Male",   "flag": "🇮🇳"},
    # ── Odia ───────────────────────────────────────────────────────────────
    {"id": "or-IN-SubhasiniNeural","name": "Subhasini","lang": "Odia",    "gender": "Female", "flag": "🇮🇳"},
    {"id": "or-IN-SukantNeural",   "name": "Sukant",   "lang": "Odia",    "gender": "Male",   "flag": "🇮🇳"},
]

LANGUAGE_ORDER = [
    "Hindi", "English (Indian)", "Tamil", "Telugu", "Bengali",
    "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia"
]


class TTSService:

    def get_all_voices(self) -> List[Dict]:
        return INDIAN_VOICES

    def get_languages(self) -> List[str]:
        return LANGUAGE_ORDER

    async def generate(
        self,
        text: str,
        voice: str,
        output_path: str,
        rate: str   = "+0%",
        pitch: str  = "+0Hz",
        volume: str = "+0%",
    ) -> None:
        """
        Generate speech using edge-tts.
        Output is an MP3 file at output_path.
        """
        # Build SSML-style edge-tts command
        cmd = [
            "edge-tts",
            "--voice",  voice,
            "--text",   text,
            "--rate",   rate,
            "--pitch",  pitch,
            "--volume", volume,
            "--write-media", output_path,
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode != 0:
            raise RuntimeError(
                f"edge-tts failed (code {proc.returncode}): {stderr.decode()}"
            )

    async def get_duration(self, audio_path: str) -> float:
        """Return audio duration in seconds using ffprobe."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                audio_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await proc.communicate()
            return float(stdout.decode().strip())
        except:
            return 0.0

    async def check_edge_tts(self) -> bool:
        """Check if edge-tts is installed."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "edge-tts", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            await proc.communicate()
            return proc.returncode == 0
        except:
            return False
