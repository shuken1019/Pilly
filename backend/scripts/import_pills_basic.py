# backend/scripts/import_pills_basic.py

import os
import sys
from time import sleep

import requests

# 상위 폴더(backend)를 import 경로에 추가해서 db.py를 찾을 수 있게 함
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(CURRENT_DIR)
if BACKEND_ROOT not in sys.path:
    sys.path.append(BACKEND_ROOT)

from db import get_conn  # db.py 안에 get_conn() 이미 만들어 둔 것 사용

# 🔑 네 API 정보
BASE_URL = "https://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03"
SERVICE_KEY = "http://apis.data.go.kr/1471000/MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03"


def fetch_page(page_no: int, num_of_rows: int = 100) -> dict:
    """공공데이터 API에서 한 페이지 가져오기"""
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": 1,
        "numOfRows": 500,
        "type": "json",  # JSON 으로 받기
    }
    resp = requests.get(BASE_URL, params=params)
    resp.raise_for_status()
    return resp.json()


def extract_items(data: dict):
    """
    JSON 구조 (예시):

    {
      "header": {...},
      "body": {
        "items": {
          "item": { ... }  # 또는 [ { ... }, { ... } ]
        },
        "numOfRows": "...",
        "pageNo": "...",
        "totalCount": "..."
      }
    }
    """
    body = data.get("body") or data.get("response", {}).get("body", {})
    items_container = body.get("items", {})

    # items_container 가 { "item": {...} } 또는 { "item": [ {...}, {...} ] }
    if isinstance(items_container, dict):
        item = items_container.get("item", [])
    else:
        item = items_container

    # item 이 dict 하나면 리스트로 감싸서 통일
    if isinstance(item, dict):
        return [item]
    elif isinstance(item, list):
        return item
    else:
        return []


def main():
    conn = get_conn()
    cur = conn.cursor()

    page = 1
    while True:
        print(f"▶ {page} 페이지 가져오는 중...")
        data = fetch_page(page_no=page, num_of_rows=100)
        items = extract_items(data)

        if not items:
            print("데이터 없음, 종료")
            break

        for item in items:
            # pill_mfds 테이블에 맞춰서 INSERT
            cur.execute(
                """
                INSERT INTO pill_mfds (
                    item_seq,
                    item_name,
                    entp_name,
                    drug_shape,
                    color_class1,
                    color_class2,
                    print_front,
                    print_back,
                    chart,
                    item_image,
                    leng_long,
                    leng_short,
                    thick,
                    class_no,
                    source
                ) VALUES (
                    %(ITEM_SEQ)s,
                    %(ITEM_NAME)s,
                    %(ENTP_NAME)s,
                    %(DRUG_SHAPE)s,
                    %(COLOR_CLASS1)s,
                    %(COLOR_CLASS2)s,
                    %(PRINT_FRONT)s,
                    %(PRINT_BACK)s,
                    %(CHART)s,
                    %(ITEM_IMAGE)s,
                    %(LENG_LONG)s,
                    %(LENG_SHORT)s,
                    %(THICK)s,
                    %(CLASS_NO)s,
                    'MdcinGrnIdntfcInfo'
                )
                ON DUPLICATE KEY UPDATE
                    item_name    = VALUES(item_name),
                    entp_name    = VALUES(entp_name),
                    drug_shape   = VALUES(drug_shape),
                    color_class1 = VALUES(color_class1),
                    color_class2 = VALUES(color_class2),
                    print_front  = VALUES(print_front),
                    print_back   = VALUES(print_back),
                    chart        = VALUES(chart),
                    item_image   = VALUES(item_image),
                    leng_long    = VALUES(leng_long),
                    leng_short   = VALUES(leng_short),
                    thick        = VALUES(thick),
                    class_no     = VALUES(class_no)
                """,
                item,
            )

        conn.commit()
        page += 1
        sleep(0.2)

    conn.close()
    print("✅ pill_mfds 데이터 입력 완료!")


if __name__ == "__main__":
    main()
