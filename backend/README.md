# Framerly Backend

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn python-multipart
uvicorn main:app --reload
```

This project uses [FastAPI](https://fastapi.tiangolo.com/) for the backend API. 