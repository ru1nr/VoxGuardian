FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload directory
RUN mkdir -p static/audio

# Expose port
EXPOSE $PORT

# Use Gunicorn instead of Flask dev server
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "1", "--preload", "--timeout", "300", "app:app"]
