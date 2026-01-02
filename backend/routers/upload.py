# backend/routers/upload.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import shutil
import os
import uuid
from pathlib import Path

# 프론트엔드 서비스(communityService.ts)가 /api/community/upload 로 요청하므로 prefix를 맞춤
router = APIRouter(
    prefix="/api/community",
    tags=["Upload"]
)

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        # 1. 저장할 폴더 절대 경로 설정 (backend/uploads)
        # 현재 파일(routers/upload.py)의 부모(routers)의 부모(backend) -> uploads
        BASE_DIR = Path(__file__).resolve().parent.parent
        UPLOAD_DIR = BASE_DIR / "uploads"

        # 폴더가 없으면 생성
        if not UPLOAD_DIR.exists():
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # 2. 파일명 랜덤 생성 (중복 방지)
        # 확장자 추출
        filename = file.filename
        ext = os.path.splitext(filename)[1] if filename else ""
        
        # 안전한 파일명 생성 (uuid 사용)
        saved_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / saved_filename

        # 3. 파일 저장
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 4. 접근 가능한 URL 반환
        # main.py에서 app.mount("/uploads", ...)로 연결해뒀으므로 접근 가능
        return {"url": f"http://127.0.0.1:8000/uploads/{saved_filename}"}

    except Exception as e:
        print(f"❌ Image Upload Failed: {e}")
        raise HTTPException(status_code=500, detail=f"이미지 업로드 실패: {str(e)}")