"""
LipSync Service — wraps Wav2Lip (open-source, completely free).

Wav2Lip GitHub: https://github.com/Rudrabha/Wav2Lip
Setup:
  git clone https://github.com/Rudrabha/Wav2Lip ../Wav2Lip
  cd ../Wav2Lip
  pip install -r requirements.txt
  # Download checkpoints from the README (Google Drive links)
  mkdir checkpoints
  # Put wav2lip_gan.pth in checkpoints/
"""

import asyncio
import os
import shutil
from pathlib import Path
from config import settings


class LipSyncService:

    def check_wav2lip(self) -> bool:
        """Check if Wav2Lip is set up correctly."""
        wav2lip_path = Path(settings.wav2lip_dir)
        checkpoint   = Path(settings.wav2lip_checkpoint)
        return wav2lip_path.exists() and (
            checkpoint.exists() or
            (wav2lip_path / "checkpoints" / "wav2lip.pth").exists()
        )

    async def run(
        self,
        avatar_path: str,
        audio_path: str,
        output_path: str,
        job_id: str,
        jobs: dict,
    ) -> None:
        """
        Run Wav2Lip inference.

        Avatar can be:
          - A static image (.jpg/.png) → Wav2Lip will animate it
          - A video (.mp4)              → Wav2Lip will re-lip-sync it

        Audio: .mp3 or .wav
        Output: .mp4
        """
        wav2lip_dir = Path(settings.wav2lip_dir).resolve()

        # Determine checkpoint
        checkpoint = Path(settings.wav2lip_checkpoint).resolve()
        if not checkpoint.exists():
            # Fallback to base model
            checkpoint = (wav2lip_dir / "checkpoints" / "wav2lip.pth").resolve()
        if not checkpoint.exists():
            raise FileNotFoundError(
                f"Wav2Lip checkpoint not found at {checkpoint}. "
                "Please download it as described in the README."
            )

        output_path_abs = Path(output_path).resolve()

        cmd = [
            "python", "inference.py",
            "--checkpoint_path", str(checkpoint),
            "--face",            str(Path(avatar_path).resolve()),
            "--audio",           str(Path(audio_path).resolve()),
            "--outfile",         str(output_path_abs),
            "--resize_factor",   str(settings.resize_factor),
            "--wav2lip_batch_size", str(settings.wav2lip_batch_size),
            "--face_det_batch_size", str(settings.face_det_batch_size),
            "--nosmooth",       # Disable temporal smoothing for sharper output
            "--pads",  "0", "15", "0", "0",  # pad face: top,bottom,left,right
        ]

        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(wav2lip_dir),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        # Stream progress from stderr
        while True:
            line = await proc.stderr.readline()
            if not line:
                break
            line_str = line.decode().strip()
            if line_str:
                # Parse Wav2Lip progress lines like "100%|████ | 240/240"
                if "/" in line_str and "%" in line_str:
                    try:
                        pct_str = line_str.split("%")[0].strip().split()[-1]
                        pct = int(float(pct_str))
                        jobs[job_id]["progress"] = 40 + int(pct * 0.45)
                        jobs[job_id]["step"] = f"Lip syncing… {pct}%"
                    except:
                        pass

        stdout, _ = await proc.communicate()

        if proc.returncode != 0:
            stderr_out = _.decode() if _ else ""
            raise RuntimeError(
                f"Wav2Lip failed (code {proc.returncode}): {stderr_out[-500:]}"
            )

        if not output_path_abs.exists():
            raise FileNotFoundError(
                "Wav2Lip ran but produced no output file. "
                "Check that your face image is clear and the audio file is valid."
            )
