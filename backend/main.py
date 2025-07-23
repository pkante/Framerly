from fastapi import FastAPI, UploadFile, File, Body
from fastapi.responses import JSONResponse
import os
import json
import subprocess

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Backend is running"}

def dummy_transcribe(video_path, transcription_path):
    # Placeholder: In real use, call Whisper here
    dummy_text = f"Transcription for {os.path.basename(video_path)}."
    with open(transcription_path, "w") as f:
        json.dump({"text": dummy_text}, f)

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        content = await file.read()
        f.write(content)
    # Dummy transcription
    transcription_path = file_location + ".transcription.json"
    dummy_transcribe(file_location, transcription_path)
    return JSONResponse(content={"filename": file.filename, "path": file_location, "status": "uploaded"})

@app.post("/fetch_url")
async def fetch_url(url: str = Body(..., embed=True)):
    # Download video using yt-dlp
    output_template = os.path.join(UPLOAD_DIR, '%(title)s.%(ext)s')
    try:
        result = subprocess.run([
            'yt-dlp',
            '-f', 'mp4',
            '-o', output_template,
            url
        ], capture_output=True, text=True, check=True)
        # Find the downloaded file (get last modified mp4 in uploads)
        files = [f for f in os.listdir(UPLOAD_DIR) if f.endswith('.mp4')]
        if not files:
            return JSONResponse(content={"error": "No video downloaded."}, status_code=500)
        latest_file = max(files, key=lambda f: os.path.getmtime(os.path.join(UPLOAD_DIR, f)))
        file_location = os.path.join(UPLOAD_DIR, latest_file)
        # Dummy transcription
        transcription_path = file_location + ".transcription.json"
        dummy_transcribe(file_location, transcription_path)
        return JSONResponse(content={"filename": latest_file, "status": "downloaded"})
    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"error": e.stderr or str(e)}, status_code=500)

@app.get("/transcription/{filename}")
def get_transcription(filename: str):
    transcription_path = os.path.join(UPLOAD_DIR, filename + ".transcription.json")
    if not os.path.exists(transcription_path):
        return JSONResponse(content={"error": "Transcription not found."}, status_code=404)
    with open(transcription_path) as f:
        data = json.load(f)
    return data
