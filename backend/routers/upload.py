from fastapi import APIRouter

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "upload"}
