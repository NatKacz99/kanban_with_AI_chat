from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
api = FastAPI()

@api.get("/health")
def health():
    return {"status": "ok"}

app.mount("/api", api)
app.mount("/", StaticFiles(directory="frontend/out", html=True), name="static")