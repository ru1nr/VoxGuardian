from flask import Flask, request, jsonify
from flask_cors import CORS
from stt_processor import transcribe_audio
import os
import uuid
from werkzeug.utils import secure_filename
import logging
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import Error as Psycopg2Error

# Database configuration - now reads from .env file
DB_HOST = os.environ.get("DB_HOST")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME")
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASS")

# Validate required environment variables
if not all([DB_HOST, DB_NAME, DB_USER, DB_PASS]):
    raise ValueError("Missing required database environment variables. Check your .env file.")

# Debug: Print to verify variables are loaded (remove in production)
print(f"DB_HOST loaded: {DB_HOST is not None}")
print(f"DB_NAME loaded: {DB_NAME is not None}")
# Don't print actual values for security

# Upload folder setup
UPLOAD_FOLDER = os.path.join(os.getcwd(), "static", "audio")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# File upload security configuration
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a'}  # Focus on commonly supported formats
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10 MB
# Focus on commonly supported audio formats for transcription
ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4']

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])  # Add your frontend URLs

# Configure upload limits
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large (max 10MB)'}), 413

@app.route("/analyze", methods=["POST"])
def analyze():
    logger.info("🔍 /analyze route hit")

    # Check if file part exists in request
    if "audio" not in request.files:
        logger.error("❌ No audio file in request")
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    
    # Check if a file was actually selected
    if audio_file.filename == '':
        logger.error("❌ No file selected")
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    if not allowed_file(audio_file.filename):
        logger.error(f"❌ Invalid file type: {audio_file.filename}")
        return jsonify({"error": "Unsupported file type. Please upload MP3, WAV, or M4A files"}), 400

    # Validate MIME type for additional security
    if audio_file.content_type not in ALLOWED_MIME_TYPES:
        logger.error(f"❌ Invalid MIME type: {audio_file.content_type}")
        return jsonify({"error": "Invalid file format. Please upload a valid audio file"}), 400

    # Secure the filename with UUID to prevent collisions
    original_filename = secure_filename(audio_file.filename)
    if not original_filename:
        logger.error("❌ Invalid filename after sanitization")
        return jsonify({"error": "Invalid filename"}), 400
    
    # Add UUID prefix to prevent filename collisions
    filename = f"{uuid.uuid4()}_{original_filename}"
    
    # Log file information for debugging
    file_size = len(audio_file.read())
    logger.info(f"📄 MIME: {audio_file.content_type}, Size: {file_size} bytes")
    audio_file.seek(0)  # Reset stream for save()
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    logger.info(f"📁 Saving file to: {filepath}")
    
    # Save file with error handling
    try:
        audio_file.save(filepath)
        logger.info(f"✅ File saved successfully: {filename}")
    except Exception as e:
        logger.error(f"❌ File save failed: {e}")
        return jsonify({"error": "Failed to save uploaded file"}), 500

    try:
        logger.info("🧠 Running transcription...")
        with open(filepath, "rb") as f:
            transcript, confidence = transcribe_audio(f)

        emergency = confidence >= 0.7
        logger.info(f"📝 Transcript: {transcript}")
        logger.info(f"🎯 Confidence: {confidence}")
        logger.info(f"🚨 Emergency: {emergency}")

        logger.info("💾 Inserting into DB...")
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            cur = conn.cursor()
            
            # Calculate basic audio metadata (stub values for now)
            file_size = os.path.getsize(filepath)
            compression_ratio = file_size / (file_size + 1000)  # Simple approximation
            
            cur.execute("""
                INSERT INTO calls (
                    uploaded_at,
                    audio_path,
                    transcript,
                    transcript_confidence,
                    duration_seconds,
                    compression_ratio,
                    pause_count,
                    avg_pause_length_ms,
                    emotion_score,
                    speaker_count,
                    labeled_legit,
                    ai_legit_score,
                    notes
                ) VALUES (
                    NOW(), %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                filename,  # audio_path
                transcript,  # transcript
                confidence,  # transcript_confidence
                0.0,  # duration_seconds (stub for now)
                compression_ratio,  # compression_ratio
                0,  # pause_count (stub for now)
                0.0,  # avg_pause_length_ms (stub for now)
                0.5,  # emotion_score (stub for now)
                1,  # speaker_count (stub for now)
                None,  # labeled_legit (to be labeled manually later)
                confidence,  # ai_legit_score (using confidence for now)
                "Auto-generated from API"  # notes
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            logger.info("✅ DB insert success")
        except Psycopg2Error as db_error:
            logger.error(f"❌ Database error: {db_error}")
            return jsonify({"error": "Database operation failed"}), 500
        except Exception as db_error:
            logger.error(f"❌ Unexpected DB error: {db_error}")
            return jsonify({"error": "Database connection failed"}), 500

        return jsonify({
            "transcript": transcript,
            "confidence_score": round(confidence, 4),
            "emergency_detected": emergency,
            "duration_seconds": 0.0,
            "compression_ratio": round(compression_ratio, 4),
            "ai_legit_score": round(confidence, 4)
        })

    except Exception as e:
        import traceback
        logger.error("❌ ERROR in /analyze route:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
    finally:
        # Clean up uploaded file
        try:
            if os.path.exists(filepath):
                os.remove(filepath)
                logger.info(f"🗑️ Cleaned up file: {filename}")
        except Exception as cleanup_error:
            logger.error(f"⚠️ Failed to cleanup file {filename}: {cleanup_error}")

@app.route("/recent-calls", methods=["GET"])
def get_recent_calls():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM calls ORDER BY uploaded_at DESC LIMIT 20;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Transform data to match frontend expectations
        transformed_calls = []
        for i, call in enumerate(rows):
            # Generate mock emotion based on emotion_score
            emotions = ["fear", "anger", "sadness", "joy", "surprise", "neutral"]
            emotion_score = call.get("emotion_score", 0.5)
            mock_emotion = emotions[int(emotion_score * len(emotions)) % len(emotions)]
            
            transformed_call = {
                "id": call.get("id", i + 1),
                "transcript": call.get("transcript", ""),
                "confidence_score": float(call.get("transcript_confidence", 0)),
                "created_date": call.get("uploaded_at"),
                "speaker_id": f"Caller-{str(i + 1).zfill(3)}",
                "dominant_emotion": mock_emotion,
                "is_suspicious": call.get("ai_legit_score", 0) < 0.7 if call.get("ai_legit_score") else False,
                "audio_file_url": f"/audio/{call.get('audio_path')}" if call.get("audio_path") else None,
                "duration_seconds": float(call.get("duration_seconds", 0)),
                "compression_ratio": float(call.get("compression_ratio", 0)),
                "pause_count": call.get("pause_count", 0),
                "speaker_count": call.get("speaker_count", 1),
                "ai_legit_score": float(call.get("ai_legit_score", 0)) if call.get("ai_legit_score") else None
            }
            transformed_calls.append(transformed_call)
        
        return jsonify(transformed_calls)
    except Exception as e:
        logger.error(f"❌ Error fetching recent calls: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>")
def serve_audio(filename):
    return app.send_static_file(f"audio/{secure_filename(filename)}")

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy", 
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected" if DB_HOST else "not configured"
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Railway sets PORT environment variable
    app.run(debug=False, host="0.0.0.0", port=port)