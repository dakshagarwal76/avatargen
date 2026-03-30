"""Avatar service for built-in and prompt-generated avatars."""

from __future__ import annotations

import hashlib
import urllib.parse
import urllib.request
from pathlib import Path


class AvatarService:
    BUILTIN_AVATARS = [
        {
            "id": "builtin_priya",
            "name": "Priya (Presenter)",
            "prompt": "ultra realistic indian woman studio portrait, neutral expression, sharp focus, natural skin texture",
            "seed": 101,
        },
        {
            "id": "builtin_arjun",
            "name": "Arjun (Instructor)",
            "prompt": "ultra realistic indian man professional headshot, looking at camera, clean background",
            "seed": 102,
        },
        {
            "id": "builtin_kavya",
            "name": "Kavya (Corporate)",
            "prompt": "realistic indian woman business attire, frontal portrait, soft lighting",
            "seed": 103,
        },
        {
            "id": "builtin_rahul",
            "name": "Rahul (Explainer)",
            "prompt": "realistic indian male host portrait, neutral face, cinematic lighting",
            "seed": 104,
        },
    ]

    def make_pollinations_url(self, prompt: str, *, seed: int, width: int = 768, height: int = 768) -> str:
        encoded = urllib.parse.quote(prompt)
        return (
            f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}"
            f"&seed={seed}&nologo=true&enhance=true&model=flux"
        )

    async def download_to_path(self, url: str, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=120) as res:
            data = res.read()
        output_path.write_bytes(data)

    def generated_avatar_id(self, prompt: str) -> str:
        digest = hashlib.sha1(prompt.encode("utf-8")).hexdigest()[:12]
        return f"gen_{digest}"
