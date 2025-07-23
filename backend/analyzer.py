def analyze_transcript(transcript):
    text = transcript.lower()
    emergency_keywords = ["fire", "accident", "help", "bleeding", "gunshot", "unconscious"]
    detected = any(word in text for word in emergency_keywords)
    tone = "urgent" if detected else "neutral"
    anomaly_score = 0.2 if detected else 0.6

    return {
        "emergency_detected": detected,
        "emotion_tone": tone,
        "anomaly_score": anomaly_score
    }