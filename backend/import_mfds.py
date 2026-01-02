import os
import math
import time
import requests
from dotenv import load_dotenv

from db import get_conn  # db.py 에 있는 함수

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

SERVICE_KEY = os.getenv("MFDS_SERVICE_KEY")
if not SERVICE_KEY:
    raise RuntimeError("MFDS_SERVICE_KEY 가 .env 에 없습니다!")

BASE_URL = (
    "https://apis.data.go.kr/1471000/"
    "MdcinGrnIdntfcInfoService03/getMdcinGrnIdntfcInfoList03"
)


def fetch_page(page_no: int, num_rows: int = 100):
    params = {
        "serviceKey": SERVICE_KEY,
        "pageNo": page_no,
        "numOfRows": num_rows,
        "type": "json",
    }
    resp = requests.get(BASE_URL, params=params, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    body = data.get("body") or data.get("response", {}).get("body")
    if body is None:
        print(f"[WARN] page {page_no}: body 없음. raw={data}")
        return [], 0

    total_count = body.get("totalCount", 0)
    items = body.get("items")
    if isinstance(items, dict):
        items = [items]
    elif items is None:
        items = []

    return items, total_count


def normalize_numeric_fields(item: dict):
    for key in ["LENG_LONG", "LENG_SHORT", "THICK"]:
        val = item.get(key)
        if val in (None, "", " "):
            item[key] = None
        else:
            try:
                item[key] = float(val)
            except ValueError:
                item[key] = None


def upsert_items(conn, items):
    for item in items:
        normalize_numeric_fields(item)
        item["SOURCE"] = "MFDS"

    sql = """
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
        %(SOURCE)s
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
        class_no     = VALUES(class_no),
        source       = VALUES(source)
    """
    with conn.cursor() as cur:
        cur.executemany(sql, items)
    conn.commit()


def import_all(num_rows: int = 100):
    first_items, total_count = fetch_page(1, num_rows=num_rows)
    if total_count == 0:
        print("[ERROR] totalCount 가 0 입니다. serviceKey, 파라미터를 확인하세요.")
        return

    total_pages = math.ceil(total_count / num_rows)
    print(f"총 {total_count}건 / 페이지 {total_pages}개")

    conn = get_conn()
    try:
        if first_items:
            upsert_items(conn, first_items)
            print(f"1 / {total_pages} 페이지 완료 (rows={len(first_items)})")

        for page in range(2, total_pages + 1):
            items, _ = fetch_page(page, num_rows=num_rows)
            if not items:
                print(f"{page} 페이지: 데이터 없음, 중단")
                break

            upsert_items(conn, items)
            print(f"{page} / {total_pages} 페이지 완료 (rows={len(items)})")
            time.sleep(0.2)
    finally:
        conn.close()
        print("DB 연결 종료")


if __name__ == "__main__":
    import_all(num_rows=100)
