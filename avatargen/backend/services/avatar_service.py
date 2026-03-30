"""Avatar service for built-in and prompt-generated avatars."""

from __future__ import annotations

import base64
import hashlib
import urllib.parse
import urllib.request
from pathlib import Path


class AvatarService:
    BUILTIN_AVATARS = [
        {"id": "builtin_priya", "name": "Priya (Presenter)", "prompt": "ultra realistic indian woman studio portrait, neutral expression, sharp focus", "seed": 101},
        {"id": "builtin_arjun", "name": "Arjun (Instructor)", "prompt": "ultra realistic indian man professional headshot, looking at camera", "seed": 102},
        {"id": "builtin_kavya", "name": "Kavya (Corporate)", "prompt": "realistic indian woman business attire, frontal portrait, soft lighting", "seed": 103},
        {"id": "builtin_rahul", "name": "Rahul (Explainer)", "prompt": "realistic indian male host portrait, neutral face, cinematic lighting", "seed": 104},
        {"id": "builtin_neha", "name": "Neha (Educator)", "prompt": "realistic indian woman teacher portrait, warm smile, eye-level camera", "seed": 105},
        {"id": "builtin_vikram", "name": "Vikram (News)", "prompt": "realistic indian male news anchor portrait, studio background", "seed": 106},
        {"id": "builtin_ananya", "name": "Ananya (Tech)", "prompt": "realistic indian woman tech presenter portrait, modern lighting", "seed": 107},
        {"id": "builtin_aman", "name": "Aman (Coach)", "prompt": "realistic indian man coach portrait, centered face, clear eyes", "seed": 108},
        {"id": "builtin_meera", "name": "Meera (Storyteller)", "prompt": "realistic indian woman storyteller portrait, cinematic depth of field", "seed": 109},
        {"id": "builtin_rohan", "name": "Rohan (Startup)", "prompt": "realistic indian startup founder portrait, office background blur", "seed": 110},
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

    def make_fallback_url(self, seed: int, width: int = 768, height: int = 768) -> str:
        return f"https://picsum.photos/seed/avatargen-{seed}/{width}/{height}"

    async def _generate_placeholder(self, output_path: Path) -> bool:
        try:
            tiny_png = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Z8ioAAAAASUVORK5CYII=")
            output_path.write_bytes(tiny_png)
            return True
        except Exception:
            return False

    async def download_to_path(self, url: str, output_path: Path, *, fallback_url: str | None = None) -> dict:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        candidates = [url] + ([fallback_url] if fallback_url else [])

        last_err = None
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        }

        for candidate in candidates:
            if not candidate:
                continue
            try:
                req = urllib.request.Request(candidate, headers=headers)
                with urllib.request.urlopen(req, timeout=120) as res:
                    data = res.read()
                output_path.write_bytes(data)
                return {"ok": True, "provider": "pollinations" if candidate == url else "fallback", "url": candidate}
            except Exception as exc:
                last_err = exc

        if await self._generate_placeholder(output_path):
            return {"ok": True, "provider": "placeholder", "url": None}

        raise RuntimeError(f"Avatar image download failed: {last_err}")

    def builtin_preview(self, item: dict) -> dict:
        pollinations = self.make_pollinations_url(item["prompt"], seed=item["seed"])
        fallback = self.make_fallback_url(item["seed"])
        return {
            "id": item["id"],
            "name": item["name"],
            "prompt": item["prompt"],
            "seed": item["seed"],
            "preview_url": pollinations,
            "fallback_preview_url": fallback,
        }
    async def download_to_path(self, url: str, output_path: Path) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(url, timeout=120) as res:
            data = res.read()
        output_path.write_bytes(data)

    def generated_avatar_id(self, prompt: str) -> str:
        digest = hashlib.sha1(prompt.encode("utf-8")).hexdigest()[:12]
        return f"gen_{digest}"
