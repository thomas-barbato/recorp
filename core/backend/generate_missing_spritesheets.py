import os
import json
from pathlib import Path
from PIL import Image, ImageSequence
from django.conf import settings

FOREGROUND_PATH = Path(settings.BASE_DIR) / "recorp" / "static" / "img" / "foreground"
IGNORED_FOLDERS = {"ships"}

MAX_FRAMES = 8   # 🔥 réglable (6–12 conseillé)


def generate_spritesheet_from_gif(gif_path: Path, target_dir: Path):
    gif = Image.open(gif_path)

    frames = [frame.convert("RGBA") for frame in ImageSequence.Iterator(gif)]
    total = len(frames)

    step = max(1, total // MAX_FRAMES)
    selected = frames[::step][:MAX_FRAMES]

    frame_w, frame_h = selected[0].size
    sheet_w = frame_w * len(selected)
    sheet_h = frame_h

    spritesheet = Image.new("RGBA", (sheet_w, sheet_h))

    durations = []
    for i, frame in enumerate(selected):
        spritesheet.paste(frame, (i * frame_w, 0))
        durations.append(frame.info.get("duration", 150))

    spritesheet_path = target_dir / "spritesheet.png"
    spritesheet.save(spritesheet_path, "PNG", optimize=True)

    anim_data = {
        "frame_count": len(selected),
        "frame_width": frame_w,
        "frame_height": frame_h,
        "durations": durations
    }

    with open(target_dir / "animation.json", "w") as f:
        json.dump(anim_data, f, indent=4)

    return len(selected)


def generate_missing_spritesheets():
    logs = []
    errors = []

    for fg_type in os.listdir(FOREGROUND_PATH):
        if fg_type.lower() in IGNORED_FOLDERS:
            continue

        type_path = FOREGROUND_PATH / fg_type
        if not type_path.is_dir():
            continue

        for element_name in os.listdir(type_path):
            element_path = type_path / element_name
            if not element_path.is_dir():
                continue

            spritesheet = element_path / "spritesheet.png"
            anim_json = element_path / "animation.json"
            gif_path = element_path / "0.gif"

            if spritesheet.exists() and anim_json.exists():
                logs.append(f"… {fg_type}/{element_name} déjà OK")
                continue

            if not gif_path.exists():
                errors.append(f"❌ {fg_type}/{element_name} → 0.gif manquant")
                continue

            try:
                count = generate_spritesheet_from_gif(gif_path, element_path)
                logs.append(f"✔ {fg_type}/{element_name} → spritesheet ({count} frames)")
            except Exception as e:
                errors.append(f"❌ {fg_type}/{element_name} → {e}")

    return logs, errors
