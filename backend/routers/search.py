from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["search"])


@router.get("/ping")
async def ping():
    return {"status": "ok", "service": "search"}
