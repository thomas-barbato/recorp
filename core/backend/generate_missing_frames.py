import os
import json
from pathlib import Path
from PIL import Image, ImageSequence
from django.conf import settings


FOREGROUND_PATH = Path(settings.BASE_DIR) / "recorp" / "static" / "img" / "foreground"

IGNORED_FOLDERS = {"ships"}  # ne pas traiter


def extract_gif_frames(element_path: Path, errors: list, logs: list):
    """
    Lit 0.gif dans element_path et génère frames/*.png + animation.json
    """

    gif_path = element_path / "0.gif"

    if not gif_path.exists():
        return

    frames_dir = element_path / "frames"
    frames_dir.mkdir(exist_ok=True)

    try:
        gif = Image.open(gif_path)
        frame_durations = []
        index = 0

        for frame in ImageSequence.Iterator(gif):
            frame = frame.convert("RGBA")

            duration = frame.info.get("duration", 100)
            frame_durations.append(duration)

            out_path = frames_dir / f"frame-{index}.png"
            frame.save(out_path, "PNG")

            index += 1

        anim_json = {
            "frame_count": index,
            "durations": frame_durations
        }

        with open(frames_dir / "animation.json", "w") as f:
            json.dump(anim_json, f, indent=4)

        logs.append(f"✔ {element_path.name} → {index} frames générées")

    except Exception as e:
        errors.append(f"❌ Erreur lors de l'extraction dans {element_path} : {e}")


def generate_missing_frames():
    """
    Parcourt static/img/foreground/*/*/
    et génère frames/ si manquant.
    """

    logs = []
    errors = []

    for fg_type in os.listdir(FOREGROUND_PATH):
        if fg_type in IGNORED_FOLDERS:
            continue

        type_path = FOREGROUND_PATH / fg_type
        if not type_path.is_dir():
            continue

        for element_name in os.listdir(type_path):
            element_path = type_path / element_name
            
            if not element_path.is_dir():
                continue

            frames_path = element_path / "frames"
            if frames_path.exists():
                logs.append(f"… {fg_type}/{element_name} déjà OK")
                continue

            # créer frames
            extract_gif_frames(element_path, errors, logs)

    return logs, errors
