#!/usr/bin/env python3
"""Lightweight transcription API using whisper.cpp"""
import os, subprocess, uuid, re
from flask import Flask, request, jsonify

app = Flask(__name__)

WHISPER_CLI = os.environ.get("WHISPER_CLI", "/opt/whisper.cpp/build/bin/whisper-cli")
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "/opt/whisper.cpp/models/ggml-small.bin")

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "file" in request.files:
        audio_data = request.files["file"].read()
    else:
        audio_data = request.get_data()
    if not audio_data:
        return jsonify({"error": "No audio data"}), 400
    tmp_id = uuid.uuid4().hex[:12]
    ogg_path = f"/tmp/{tmp_id}.ogg"
    wav_path = f"/tmp/{tmp_id}.wav"
    try:
        with open(ogg_path, "wb") as f:
            f.write(audio_data)
        conv = subprocess.run(
            ["ffmpeg", "-y", "-i", ogg_path, "-ar", "16000", "-ac", "1", "-f", "wav", wav_path],
            capture_output=True, timeout=30,
        )
        if conv.returncode != 0:
            return jsonify({"error": "ffmpeg failed"}), 500
        result = subprocess.run(
            [WHISPER_CLI, "-m", WHISPER_MODEL, "-f", wav_path, "-l", "auto",
             "--no-prints", "-t", "2"],
            capture_output=True, timeout=120,
        )
        if result.returncode != 0:
            return jsonify({"error": "whisper failed"}), 500
        raw = result.stdout.decode().strip()
        text = re.sub(r"\[\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\]\s*", "", raw)
        text = re.sub(r"\s+", " ", text).strip()
        return jsonify({"text": text})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Transcription timed out"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        for p in [ogg_path, wav_path]:
            try: os.unlink(p)
            except: pass

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=7890)
