from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

@app.get("/", response_class=HTMLResponse)
def root():
    return "<h1>Hello world</h1>"

@app.get("/api/health")
def health():
    return {"status": "ok"}