import os
import json
import shutil
import random
from pathlib import Path
from typing import Optional, Tuple, List
from tqdm import tqdm  # 진행바 표시 도구

# ====================================================================
# 1. 경로 설정
# ====================================================================
PROJECT_ROOT = Path(__file__).resolve().parents[2]

DATASET_DIR = PROJECT_ROOT / "datasets" / "pill_aihub"
RAW_IMAGES_DIR = DATASET_DIR / "raw" / "images"
RAW_LABELS_DIR = DATASET_DIR / "raw" / "labels"

YOLO_BASE_DIR = DATASET_DIR / "yolo"
YOLO_IMAGES_DIR = YOLO_BASE_DIR / "images"
YOLO_LABELS_DIR = YOLO_BASE_DIR / "labels"

TRAIN_IMG_DIR = YOLO_IMAGES_DIR / "train"
VAL_IMG_DIR = YOLO_IMAGES_DIR / "val"
TRAIN_LBL_DIR = YOLO_LABELS_DIR / "train"
VAL_LBL_DIR = YOLO_LABELS_DIR / "val"

VAL_RATIO = 0.2

# ====================================================================
# 2. 유틸 함수
# ====================================================================
def find_image_path(root_dir: Path, file_name: str) -> Optional[Path]:
    target_name = Path(file_name).name
    target_stem = Path(file_name).stem

    candidates = list(root_dir.rglob(target_name))
    if candidates:
        return candidates[0]

    for ext in [".jpg", ".jpeg", ".png", ".JPG", ".PNG", ".JPEG"]:
        candidates = list(root_dir.rglob(f"{target_stem}{ext}"))
        if candidates:
            return candidates[0]
    return None

def convert_to_yolo_format(bbox: List[float], img_width: int, img_height: int, class_id: int) -> str:
    x, y, w, h = bbox
    cx = (x + w / 2) / img_width
    cy = (y + h / 2) / img_height
    nw = w / img_width
    nh = h / img_height
    return f"{class_id} {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n"

def parse_coco_json(json_path: Path) -> Optional[Tuple[str, int, int, List[tuple]]]:
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return None

    if "images" not in data or not data["images"]:
        return None

    img_info = data["images"][0]
    file_name = img_info.get("file_name")
    img_w = img_info.get("width")
    img_h = img_info.get("height")
    img_id = img_info.get("id")

    if not file_name or not img_w or not img_h:
        return None

    bboxes = []
    if "annotations" in data:
        for ann in data["annotations"]:
            if img_id is not None and ann.get("image_id") != img_id:
                continue
            if "bbox" in ann:
                x, y, w, h = ann["bbox"]
                bboxes.append((0, float(x), float(y), float(w), float(h)))

    return file_name, int(img_w), int(img_h), bboxes

# ====================================================================
# 3. 메인 변환 로직
# ====================================================================
def convert_to_yolo():
    print(">>> YOLO 변환 시작...")

    if YOLO_BASE_DIR.exists():
        shutil.rmtree(YOLO_BASE_DIR)
    for d in [TRAIN_IMG_DIR, VAL_IMG_DIR, TRAIN_LBL_DIR, VAL_LBL_DIR]:
        d.mkdir(parents=True, exist_ok=True)

    print(">>> 라벨 파일 목록을 읽는 중... (잠시만 기다리세요)")
    json_files = list(RAW_LABELS_DIR.rglob("*.json"))
    print(f"발견된 라벨 파일 개수: {len(json_files)}")

    success_count = 0
    missing_count = 0
    data_pairs = []

    # tqdm을 사용하여 진행 바 표시
    print(">>> 이미지 매칭 및 변환 중...")
    for json_path in tqdm(json_files):
        parsed = parse_coco_json(json_path)
        if not parsed:
            continue

        file_name, img_w, img_h, bboxes = parsed
        real_img_path = find_image_path(RAW_IMAGES_DIR, file_name)

        if real_img_path is None:
            missing_count += 1
            continue

        yolo_lines = []
        for cls_id, x, y, w, h in bboxes:
            line = convert_to_yolo_format([x, y, w, h], img_w, img_h, cls_id)
            yolo_lines.append(line)

        if not yolo_lines:
            continue

        data_pairs.append({
            "img_src": real_img_path,
            "txt_content": "".join(yolo_lines),
            "stem": real_img_path.stem
        })
        success_count += 1

    print(f"\n>>> 결과: 성공 {success_count}개 / 실패 {missing_count}개")

    if success_count == 0:
        print("[오류] 변환된 데이터가 0개입니다.")
        return

    print(">>> 파일 저장 중... (Train/Val 분리)")
    random.shuffle(data_pairs)
    val_count = int(len(data_pairs) * VAL_RATIO)

    # 저장 할 때도 진행바 표시
    for i in tqdm(range(len(data_pairs)), desc="Saving Files"):
        item = data_pairs[i]
        if i < val_count:
            shutil.copy2(item["img_src"], VAL_IMG_DIR / item["img_src"].name)
            (VAL_LBL_DIR / f"{item['stem']}.txt").write_text(item["txt_content"], encoding="utf-8")
        else:
            shutil.copy2(item["img_src"], TRAIN_IMG_DIR / item["img_src"].name)
            (TRAIN_LBL_DIR / f"{item['stem']}.txt").write_text(item["txt_content"], encoding="utf-8")

    print("\n✅ 모든 준비 완료! 학습을 시작하세요.")

if __name__ == "__main__":
    convert_to_yolo()