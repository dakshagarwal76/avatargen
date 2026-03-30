from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Wav2Lip path (clone it alongside backend)
    wav2lip_dir: str = "../Wav2Lip"
    wav2lip_checkpoint: str = "../Wav2Lip/checkpoints/wav2lip_gan.pth"

    # Whether to use enhanced (GAN) or base Wav2Lip model
    use_gan_model: bool = True

    # Resize factor for Wav2Lip (higher = faster but lower quality)
    resize_factor: int = 1  # 1 = full quality

    # Pad face crop (pixels: up, down, left, right)
    face_det_batch_size: int = 16
    wav2lip_batch_size: int = 128

    # Storage
    storage_dir: str = "storage"

    class Config:
        env_file = ".env"

settings = Settings()
