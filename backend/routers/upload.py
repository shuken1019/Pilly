from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
from wand.image import Image

router = APIRouter()

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # 1. 고유한 파일명 생성
        file_uuid = str(uuid.uuid4())
        # 파일명에서 확장자 추출 (소문자로 변환)
        if "." in file.filename:
            file_extension = file.filename.split(".")[-1].lower()
        else:
            file_extension = "jpg" # 확장자가 없으면 기본 jpg

        file_name = f"{file_uuid}.{file_extension}"
        file_location = os.path.join(UPLOAD_DIR, file_name)

        # 2. 일단 원본 파일을 저장
        with open(file_location, "wb+") as file_object:
            file_object.write(await file.read())

        # 3. HEIC 파일이면 JPG로 변환
        if file_extension == 'heic':
            jpg_file_name = f"{file_uuid}.jpg"
            jpg_file_location = os.path.join(UPLOAD_DIR, jpg_file_name)

            # Wand 라이브러리로 변환
            with Image(filename=file_location) as img:
                img.format = 'jpeg'
                img.save(filename=jpg_file_location)

            # 원본 삭제 및 경로 업데이트
            os.remove(file_location)
            file_name = jpg_file_name
            file_location = jpg_file_location
            print(f"✅ HEIC 변환 완료: {jpg_file_location}")

        print(f"이미지 저장 완료: {file_location}")

        # URL 반환
        file_url = f"/uploads/{file_name}"
        return {"filename": file_name, "file_url": file_url, "location": file_location}

    except Exception as e:
        print(f"이미지 업로드 실패: {str(e)}")
        return JSONResponse(status_code=500, content={"message": f"이미지 업로드 실패: {str(e)}"})
