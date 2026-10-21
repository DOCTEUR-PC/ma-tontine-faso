import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import groupes, membres, paiements, auth, sync

app = FastAPI(title="Tontine API", version="1.0.0")

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(groupes.router)
app.include_router(membres.router)
app.include_router(paiements.router)
app.include_router(auth.router)
app.include_router(sync.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
