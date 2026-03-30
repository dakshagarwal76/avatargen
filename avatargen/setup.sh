#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
#  AvatarGen — Local Setup Script
#  Run once: bash setup.sh
# ═══════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║        AvatarGen — Setup Script              ║"
echo "║   Free HeyGen Alternative (Indian Voices)    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── 1. Check deps ───────────────────────────────────────────────────
echo -e "${YELLOW}[1/6] Checking dependencies...${NC}"

command -v python3 &>/dev/null || { echo -e "${RED}✗ python3 not found. Please install Python 3.10+${NC}"; exit 1; }
command -v pip    &>/dev/null  || command -v pip3 &>/dev/null || { echo -e "${RED}✗ pip not found.${NC}"; exit 1; }
command -v node   &>/dev/null  || { echo -e "${RED}✗ node not found. Install Node.js 18+${NC}"; exit 1; }
command -v npm    &>/dev/null  || { echo -e "${RED}✗ npm not found.${NC}"; exit 1; }
command -v ffmpeg &>/dev/null  || { echo -e "${RED}✗ ffmpeg not found. Install with: sudo apt install ffmpeg (or brew install ffmpeg)${NC}"; exit 1; }
command -v git    &>/dev/null  || { echo -e "${RED}✗ git not found.${NC}"; exit 1; }

echo -e "${GREEN}✓ All core dependencies found${NC}"

# ── 2. Clone Wav2Lip ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[2/6] Setting up Wav2Lip...${NC}"

if [ ! -d "../Wav2Lip" ]; then
    echo "Cloning Wav2Lip repository..."
    git clone https://github.com/Rudrabha/Wav2Lip ../Wav2Lip
    echo -e "${GREEN}✓ Wav2Lip cloned${NC}"
else
    echo -e "${GREEN}✓ Wav2Lip already exists${NC}"
fi

# Install Wav2Lip deps
echo "Installing Wav2Lip Python dependencies..."
cd ../Wav2Lip
pip install -r requirements.txt -q
cd -
echo -e "${GREEN}✓ Wav2Lip deps installed${NC}"

# ── 3. Download Wav2Lip checkpoint ─────────────────────────────────
echo ""
echo -e "${YELLOW}[3/6] Checking Wav2Lip checkpoints...${NC}"

CHECKPOINT_DIR="../Wav2Lip/checkpoints"
mkdir -p "$CHECKPOINT_DIR"

if [ ! -f "$CHECKPOINT_DIR/wav2lip_gan.pth" ]; then
    echo ""
    echo -e "${YELLOW}⚠  Wav2Lip GAN checkpoint not found.${NC}"
    echo ""
    echo "  You need to download the checkpoint manually (Google Drive restriction):"
    echo ""
    echo "  Option A — Wav2Lip GAN (better quality, recommended):"
    echo "  → https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/Eb3LEzbfuKlJiR600lQWRxgBIY27JZg80f7V9jtFfbnu9A?e=TBVBM4"
    echo "  Save as: ../Wav2Lip/checkpoints/wav2lip_gan.pth"
    echo ""
    echo "  Option B — Wav2Lip base (faster, slightly lower quality):"
    echo "  → https://iiitaphyd-my.sharepoint.com/:u:/g/personal/radrabha_m_research_iiit_ac_in/EdjI7bZlgApMqsVoEUUXpLsBxqXbn5z8dvmCx15-6Z1bHg?e=n9ljGW"
    echo "  Save as: ../Wav2Lip/checkpoints/wav2lip.pth"
    echo ""
    echo -e "${YELLOW}  After downloading, re-run this script or start the servers manually.${NC}"
    echo ""
else
    echo -e "${GREEN}✓ Checkpoint found: wav2lip_gan.pth${NC}"
fi

# Face detection model
if [ ! -f "$CHECKPOINT_DIR/s3fd.pth" ]; then
    echo "Downloading face detection model (s3fd)..."
    wget -q --show-progress \
        "https://www.adrianbulat.com/downloads/python-fan/s3fd-619a316812.pth" \
        -O "$CHECKPOINT_DIR/s3fd.pth" 2>/dev/null || \
    echo -e "${YELLOW}  Could not auto-download s3fd. Wav2Lip will download it on first run.${NC}"
fi

# ── 4. Backend Python deps ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}[4/6] Installing backend Python dependencies...${NC}"

cd backend
pip install -r requirements.txt -q
cd ..
echo -e "${GREEN}✓ Backend deps installed${NC}"

# Create storage dirs
mkdir -p storage/{avatars,audio,videos,temp}

# ── 5. Frontend npm deps ────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[5/6] Installing frontend dependencies...${NC}"

cd frontend
npm install --silent
cd ..
echo -e "${GREEN}✓ Frontend deps installed${NC}"

# ── 6. Done ─────────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}[6/6] Creating .env file...${NC}"

if [ ! -f "backend/.env" ]; then
    cat > backend/.env << 'EOF'
WAV2LIP_DIR=../../Wav2Lip
WAV2LIP_CHECKPOINT=../../Wav2Lip/checkpoints/wav2lip_gan.pth
USE_GAN_MODEL=true
RESIZE_FACTOR=1
EOF
    echo -e "${GREEN}✓ .env created${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  Setup Complete! 🎉                      ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Start the app with:                                     ║"
echo "║                                                          ║"
echo "║    bash start.sh                                         ║"
echo "║                                                          ║"
echo "║  Or manually:                                            ║"
echo "║    Terminal 1:  cd backend && uvicorn main:app --reload  ║"
echo "║    Terminal 2:  cd frontend && npm run dev               ║"
echo "║                                                          ║"
echo "║  Then open: http://localhost:5173                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
