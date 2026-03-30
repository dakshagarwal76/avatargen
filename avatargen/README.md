# AvatarGen 🎬🇮🇳
### Free HeyGen Alternative — Indian Avatars & Voices

> A fully open-source, zero-cost AI video generation platform built for Indian creators.  
> Comparable to HeyGen — powered by **Wav2Lip** (lip sync) + **Microsoft Edge TTS** (Indian voices) + **FFmpeg**.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🎙️ **Indian Voices** | 22+ voices across Hindi, Tamil, Telugu, Bengali, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, English (Indian) |
| 🎭 **Lip Sync** | Wav2Lip — state-of-the-art open-source lip sync, works on any face photo or video |
| 📓 **NotebookLM Video Import** | Upload NotebookLM videos, auto-extract audio, and generate avatar-over-video output |
| 💸 **100% Free** | No API keys, no subscriptions, no per-video costs. Ever. |
| 🇮🇳 **Indian-First** | Designed for Indian avatars, Indian languages, Indian creators |
| 🔧 **Self-Hosted** | Runs on your own machine, full data privacy |

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| FFmpeg | Any | `sudo apt install ffmpeg` / `brew install ffmpeg` |
| Git | Any | [git-scm.com](https://git-scm.com) |

**GPU (optional but recommended):** Wav2Lip runs on CPU but is slow (~5–10 min/video). With a CUDA GPU it takes ~30s.

---

### Step 1 — Clone & Setup

```bash
git clone https://github.com/YOUR_ORG/avatargen.git
cd avatargen
bash setup.sh
```

The setup script will:
- Clone Wav2Lip alongside this repo
- Install all Python and npm dependencies
- Guide you through downloading the Wav2Lip checkpoint

---

### Step 2 — Download Wav2Lip Checkpoint

Due to Google Drive restrictions, the model weights must be downloaded manually.

**Recommended (higher quality): `wav2lip_gan.pth`**
→ [Download from SharePoint](https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/Eb3LEzbfuKlJiR600lQWRxgBIY27JZg80f7V9jtFfbnu9A?e=TBVBM4)

**Alternative (faster): `wav2lip.pth`**  
→ [Download from SharePoint](https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/EdjI7bZlgApMqsVoEUUXpLsBxqXbn5z8dvmCx15-6Z1bHg?e=n9ljGW)

Place the file at: `../Wav2Lip/checkpoints/wav2lip_gan.pth`

```
avatargen/          ← this repo
Wav2Lip/            ← auto-cloned by setup.sh
  checkpoints/
    wav2lip_gan.pth ← download this manually
```

---

### Step 3 — Start

```bash
bash start.sh
```

Open → **http://localhost:5173**  
API docs → **http://localhost:8000/docs**

---

## 🎯 How to Create a Video

### Option A — From Script
1. Go to **Create Video**
2. Type your script (any Indian language or English)
3. Choose a voice (e.g. `Swara` for Hindi Female)
4. Select an avatar (upload one in **Avatar Studio** first)
5. Click **Generate Video** → done in ~2–10 minutes

### Option B — From NotebookLM
1. Export your NotebookLM video and upload it in **NotebookLM Video Import**.
2. Pick an import mode (background+corner avatar or replacement workflow).
3. Select an avatar, optionally replace the script/voice, and generate.

---

## 🗣️ Available Indian Voices

| Language | Female Voice | Male Voice |
|---|---|---|
| Hindi | Swara | Madhur |
| English (Indian) | Neerja | Prabhat |
| Tamil | Pallavi | Valluvar |
| Telugu | Shruti | Mohan |
| Bengali | Tanishaa | Bashkar |
| Marathi | Aarohi | Manohar |
| Gujarati | Dhwani | Niranjan |
| Kannada | Sapna | Gagan |
| Malayalam | Sobhana | Midhun |
| Punjabi | Vaani | Ojas |
| Odia | Subhasini | Sukant |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AvatarGen                                   │
├──────────────────────┬──────────────────────────────────────────┤
│   Frontend           │   Backend                                │
│   React + Vite       │   FastAPI (Python)                      │
│   :5173              │   :8000                                  │
│                      │                                          │
│   Pages:             │   Services:                              │
│   • Dashboard        │   • TTS → edge-tts (free, 22 voices)    │
│   • Avatar Studio    │   • LipSync → Wav2Lip (open source)     │
│   • Create Video     │   • Video → FFmpeg (free)               │
│   • NotebookLM       │   • Storage → local filesystem          │
│   • Video Library    │                                          │
└──────────────────────┴──────────────────────────────────────────┘
```

**Technology Choices:**

| Component | Technology | Why |
|---|---|---|
| Text-to-Speech | [edge-tts](https://github.com/rany2/edge-tts) | Free, Microsoft Neural voices, 22 Indian languages |
| Lip Sync | [Wav2Lip](https://github.com/Rudrabha/Wav2Lip) | Best free open-source lip sync, research-grade |
| Video Processing | FFmpeg | Industry standard, completely free |
| Backend | FastAPI | Fast, async, great for file handling |
| Frontend | React + Vite | Fast dev experience, great ecosystem |

---

## ⚡ Performance Tips

**CPU (no GPU):**
- Set `RESIZE_FACTOR=2` in `.env` for 2x faster processing (lower resolution)
- Short videos (< 60s) take ~5–10 minutes on CPU
- Run on a machine with 8+ GB RAM for best results

**GPU (CUDA):**
- Processing drops to ~20–60 seconds per video
- Ensure PyTorch with CUDA is installed in the Wav2Lip env
- Set `WAV2LIP_BATCH_SIZE=256` for faster batching

---

## 📁 Project Structure

```
avatargen/
├── backend/
│   ├── main.py              # FastAPI app, all routes
│   ├── config.py            # Settings (env-based)
│   ├── services/
│   │   ├── tts_service.py   # edge-tts wrapper, all Indian voices
│   │   ├── lipsync_service.py # Wav2Lip runner
│   │   └── video_service.py # FFmpeg utils
│   └── storage/             # Generated files (gitignored)
│       ├── avatars/
│       ├── audio/
│       └── videos/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── Dashboard.jsx
│       │   ├── AvatarStudio.jsx
│       │   ├── CreateVideo.jsx
│       │   ├── NotebookLMImport.jsx
│       │   └── VideoLibrary.jsx
│       ├── App.jsx
│       └── main.jsx
├── setup.sh      # One-time setup
├── start.sh      # Launch dev servers
└── docker-compose.yml
```

---

## 🔮 Roadmap to Production

When you're ready to scale beyond free tiers:

| Feature | Free (Current) | Paid Upgrade |
|---|---|---|
| TTS | edge-tts (22 Indian voices) | ElevenLabs, Murf, Bhashini Enterprise |
| Lip Sync | Wav2Lip (self-hosted) | SyncLabs API, HeyGen API |
| Avatars | Photo/video upload | Stable Diffusion, DALL-E 3 |
| Hosting | Local | AWS/GCP/Azure with GPU instances |
| Storage | Local filesystem | S3, Cloudflare R2 |
| Queue | In-memory | Redis + Celery |
| Auth | None | Clerk, Auth0, Firebase |

**Bhashini API** (India's government free AI for Indian languages):  
→ https://bhashini.gov.in/ulca/model/search  
→ Completely free, supports 22 Indian languages, built by MeitY

---

## 🐛 Troubleshooting

**"Wav2Lip checkpoint not found"**  
→ Download `wav2lip_gan.pth` from the link in Step 2 and place it in `../Wav2Lip/checkpoints/`

**"edge-tts not found"**  
→ Run: `pip install edge-tts`

**"FFmpeg not found"**  
→ Ubuntu: `sudo apt install ffmpeg`  
→ macOS: `brew install ffmpeg`  
→ Windows: Download from [ffmpeg.org](https://ffmpeg.org)

**Videos generate but face doesn't move much**  
→ The face image needs to be clear, well-lit, and front-facing. Side profiles work poorly.

**Very slow generation (CPU)**  
→ Add `RESIZE_FACTOR=2` to `backend/.env` — 2x faster, slightly lower resolution.

---

## 📄 License

This project is MIT licensed.  
Wav2Lip is licensed under its own [license](https://github.com/Rudrabha/Wav2Lip/blob/master/LICENSE).  
edge-tts is MIT licensed.

---

*Built with ❤️ for Indian creators.*
