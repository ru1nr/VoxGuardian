from flask import Flask, request, jsonify
from flask_cors import CORS
from stt_processor import transcribe_audio
import os
import uuid
from werkzeug.utils import secure_filename

import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import Error as Psycopg2Error

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

# Database configuration - use environment variables in production
DB_HOST = os.environ.get("DB_HOST", "database-1.cf8e84ksosls.us-east-2.rds.amazonaws.com")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "voxguardian")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "owe5Pry?bog")  # Replace with your RDS master password

app = Flask(__name__)
CORS(app)

# Configure upload limits
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large (max 10MB)'}), 413

@app.route("/analyze", methods=["POST"])
def analyze():
    print("🔍 /analyze route hit")

    # Check if file part exists in request
    if "audio" not in request.files:
        print("❌ No audio file in request")
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    
    # Check if a file was actually selected
    if audio_file.filename == '':
        print("❌ No file selected")
        return jsonify({"error": "No file selected"}), 400

    # Validate file extension
    if not allowed_file(audio_file.filename):
        print(f"❌ Invalid file type: {audio_file.filename}")
        return jsonify({"error": "Unsupported file type. Please upload MP3, WAV, or M4A files"}), 400

    # Validate MIME type for additional security
    if audio_file.content_type not in ALLOWED_MIME_TYPES:
        print(f"❌ Invalid MIME type: {audio_file.content_type}")
        return jsonify({"error": "Invalid file format. Please upload a valid audio file"}), 400

    # Secure the filename with UUID to prevent collisions
    original_filename = secure_filename(audio_file.filename)
    if not original_filename:
        print("❌ Invalid filename after sanitization")
        return jsonify({"error": "Invalid filename"}), 400
    
    # Add UUID prefix to prevent filename collisions
    filename = f"{uuid.uuid4()}_{original_filename}"
    
    # Log file information for debugging
    file_size = len(audio_file.read())
    print(f"📄 MIME: {audio_file.content_type}, Size: {file_size} bytes")
    audio_file.seek(0)  # Reset stream for save()
    
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    print(f"📁 Saving file to: {filepath}")
    
    # Save file with error handling
    try:
        audio_file.save(filepath)
        print(f"✅ File saved successfully: {filename}")
    except Exception as e:
        print(f"❌ File save failed: {e}")
        return jsonify({"error": "Failed to save uploaded file"}), 500

    try:
        print("🧠 Running transcription...")
        with open(filepath, "rb") as f:
            transcript, confidence = transcribe_audio(f)

        emergency = confidence >= 0.7
        print(f"📝 Transcript: {transcript}")
        print(f"🎯 Confidence: {confidence}")
        print(f"🚨 Emergency: {emergency}")

        print("💾 Inserting into DB...")
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASS
            )
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO calls (transcript, confidence_score, emergency_detected, audio_file_name, created_at)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
            """, (transcript, confidence, emergency, filename))
            conn.commit()
            cur.close()
            conn.close()
            print("✅ DB insert success")
        except Psycopg2Error as db_error:
            print(f"❌ Database error: {db_error}")
            return jsonify({"error": "Database operation failed"}), 500
        except Exception as db_error:
            print(f"❌ Unexpected DB error: {db_error}")
            return jsonify({"error": "Database connection failed"}), 500

        return jsonify({
            "transcript": transcript,
            "confidence_score": round(confidence, 4),
            "emergency_detected": emergency
        })

    except Exception as e:
        import traceback
        print("❌ ERROR in /analyze route:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    
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
        cur.execute("SELECT * FROM calls ORDER BY created_at DESC LIMIT 20;")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        # Transform data to match frontend expectations
        transformed_calls = []
        for i, call in enumerate(rows):
            # Generate mock data for missing fields
            emotions = ["fear", "anger", "sadness", "joy", "surprise", "neutral"]
            mock_emotion = emotions[i % len(emotions)]
            
            transformed_call = {
                "id": call.get("id", i + 1),
                "transcript": call.get("transcript", ""),
                "confidence_score": float(call.get("confidence_score", 0)),
                "created_date": call.get("created_at"),
                "speaker_id": f"Caller-{str(i + 1).zfill(3)}",  # Generate speaker ID
                "dominant_emotion": mock_emotion,
                "is_suspicious": call.get("emergency_detected", False),  # Map emergency_detected to is_suspicious
                "audio_file_url": f"/audio/{call.get('audio_file_name')}" if call.get("audio_file_name") else None
            }
            transformed_calls.append(transformed_call)
        
        return jsonify(transformed_calls)  # Return array directly, not wrapped in "calls"
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/audio/<filename>")
def serve_audio(filename):
    return app.send_static_file(f"audio/{secure_filename(filename)}")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # Railway sets PORT environment variable
    app.run(debug=False, host="0.0.0.0", port=port)