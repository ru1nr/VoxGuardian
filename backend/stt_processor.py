import whisper
import tempfile
import os
import subprocess
import wave
import contextlib
import torch
import ffmpeg

model = whisper.load_model("base")

EMERGENCY_KEYWORDS = {
    "fire", "gun", "shot", "shooting", "stabbed", "accident", "ambulance",
    "help", "emergency", "unconscious", "injury", "injured", "kill", "killed"
}

def get_duration(file_path):
    with contextlib.closing(wave.open(file_path, 'rb')) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        return frames / float(rate)

def keyword_score(transcript: str) -> float:
    words = set(transcript.lower().split())
    matches = EMERGENCY_KEYWORDS.intersection(words)
    return round(min(len(matches) / 5.0, 1.0), 4)

def speech_density_score(transcript: str, duration: float) -> float:
    if duration == 0:
        return 0.0
    wps = len(transcript.split()) / duration
    normalized = min(wps / 3.0, 1.0)
    return round(normalized, 4)

def repetition_penalty(transcript: str) -> float:
    words = transcript.lower().split()
    frequent = [w for w in set(words) if words.count(w) > 6 and len(w) > 2]
    return -0.05 if frequent else 0.0

def silence_penalty(transcript: str, duration: float) -> float:
    if duration == 0:
        return -0.05
    words = len(transcript.split())
    if duration > 10 and words < 8:
        return -0.05
    return 0.0

def calculate_confidence(transcript: str, compression_ratio: float, duration: float) -> float:
    base = 1.0 - compression_ratio
    density = speech_density_score(transcript, duration)
    keywords = keyword_score(transcript)
    rep_pen = repetition_penalty(transcript)
    sil_pen = silence_penalty(transcript, duration)

    weighted_score = (
        (base * 0.55) +
        (density * 0.20) +
        (keywords * 0.20) +
        rep_pen +
        sil_pen
    )

    return round(max(0.0, min(weighted_score, 1.0)), 4)

def transcribe_audio(audio_file):
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp:
        tmp.write(audio_file.read())
        tmp_path = tmp.name

    try:
        wav_path = tmp_path.replace(".mp3", ".wav")
        subprocess.run([
            "ffmpeg", "-y", "-i", tmp_path, "-ac", "1", "-ar", "16000", wav_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        duration = get_duration(wav_path)

        result = model.transcribe(tmp_path)
        transcript = result["text"].strip()
        compression_ratio = result.get("compression_ratio", 0.0)

        confidence = calculate_confidence(transcript, compression_ratio, duration)

        return transcript, confidence

    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        if os.path.exists(wav_path):
            os.remove(wav_path)