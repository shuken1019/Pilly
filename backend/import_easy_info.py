# backend/import_easy_info.py

import os
import time
import requests
from dotenv import load_dotenv
from db import get_conn   # 기존에 쓰던 MySQL 연결 함수

# .env 읽기 (backend/.env 또는 상위 경로 .env)
load_dotenv()

SERVICE_KEY = os.getenv("MFDS_SERVICE_KEY")
if not SERVICE_KEY:
    raise RuntimeError("MFDS_SERVICE_KEY 가 .env 에 없습니다")

# e약은요 개요정보 API 엔드포인트
BASE_URL = "http://apis.data.go.kr/1471000/DrbEasyDrugInfoService/getDrbEasyDrugList"


def fetch_easy_info(item_seq: int):
    params = {
        "serviceKey": SERVICE_KEY,
        "itemSeq": item_seq,
        "pageNo": 1,
        "numOfRows": 1,
        "type": "json",
    }

    for attempt in range(5):
        try:
            resp = requests.get(BASE_URL, params=params, timeout=15)
            resp.raise_for_status()
            break

        except requests.HTTPError as e:
            status = e.response.status_code if e.response is not None else None

            # ✅ 429: 일일 호출 한도 초과 → 오늘은 여기서 전체 중단
            if status == 429:
                print(f"[ERROR] item_seq={item_seq} 429 Too Many Requests -> 호출 한도 초과, 전체 중단")
                # 특별한 예외를 올려서 main()에서 잡도록
                raise RuntimeError("RATE_LIMIT_EXCEEDED")

            # ✅ 5xx 서버 에러 → 조금 쉬고 재시도
            if status is not None and 500 <= status < 600 and attempt < 4:
                wait_sec = 5 * (attempt + 1)
                print(f"[WARN] item_seq={item_seq} 서버 {status} -> {attempt+1}차 대기 {wait_sec}초 후 재시도")
                time.sleep(wait_sec)
                continue

            # 그 외는 그냥 스킵
            print(f"[ERROR] item_seq={item_seq} HTTP 에러: {status} -> 스킵")
            return None

        except requests.RequestException as e:
            print(f"[ERROR] item_seq={item_seq} 요청 실패: {e} -> 스킵")
            return None

    else:
        print(f"[ERROR] item_seq={item_seq} 5회 재시도 실패 -> 스킵")
        return None

    # 이하 JSON 파싱 부분은 그대로 두면 됨
    data = resp.json()
    body = data.get("body")
    if not body:
        print(f"[INFO] item_seq={item_seq} body 없음 -> 스킵")
        return None

    items = body.get("items")
    if not items:
        print(f"[INFO] item_seq={item_seq} items 없음 -> 스킵")
        return None

    if isinstance(items, dict):
        items = [items]

    item = items[0]

    return {
        "item_seq": int(item.get("itemSeq")),
        "item_name": item.get("itemName"),
        "entp_name": item.get("entpName"),
        "efcy_qesitm": item.get("efcyQesitm"),
        "use_method_qesitm": item.get("useMethodQesitm"),
        "atpn_warn_qesitm": item.get("atpnWarnQesitm"),
        "atpn_qesitm": item.get("atpnQesitm"),
        "intrc_qesitm": item.get("intrcQesitm"),
        "se_qesitm": item.get("seQesitm"),
        "deposit_method_qesitm": item.get("depositMethodQesitm"),
        "open_de": item.get("openDe"),
        "update_de": item.get("updateDe"),
    }



def save_easy_info(conn, row: dict):
    """
    pill_easy_info 테이블에 upsert (있으면 업데이트, 없으면 insert)
    """
    sql = """
    INSERT INTO pill_easy_info (
        item_seq, item_name, entp_name,
        efcy_qesitm, use_method_qesitm, atpn_warn_qesitm, atpn_qesitm,
        intrc_qesitm, se_qesitm, deposit_method_qesitm,
        open_de, update_de
    )
    VALUES (
        %(item_seq)s, %(item_name)s, %(entp_name)s,
        %(efcy_qesitm)s, %(use_method_qesitm)s, %(atpn_warn_qesitm)s, %(atpn_qesitm)s,
        %(intrc_qesitm)s, %(se_qesitm)s, %(deposit_method_qesitm)s,
        %(open_de)s, %(update_de)s
    )
    ON DUPLICATE KEY UPDATE
        item_name             = VALUES(item_name),
        entp_name             = VALUES(entp_name),
        efcy_qesitm           = VALUES(efcy_qesitm),
        use_method_qesitm     = VALUES(use_method_qesitm),
        atpn_warn_qesitm      = VALUES(atpn_warn_qesitm),
        atpn_qesitm           = VALUES(atpn_qesitm),
        intrc_qesitm          = VALUES(intrc_qesitm),
        se_qesitm             = VALUES(se_qesitm),
        deposit_method_qesitm = VALUES(deposit_method_qesitm),
        open_de               = VALUES(open_de),
        update_de             = VALUES(update_de)
    """
    with conn.cursor() as cur:
        cur.execute(sql, row)
    conn.commit()


def main():
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT m.item_seq
                FROM pill_mfds AS m
                LEFT JOIN pill_easy_info AS e
                ON m.item_seq = e.item_seq
                WHERE e.item_seq IS NULL
                ORDER BY m.item_seq
            """)
            items = cur.fetchall()

        total = len(items)
        print(f"총 {total}개 약에 대해 e약은요 데이터 수집 시작")

        for i, row in enumerate(items, start=1):
            item_seq = row["item_seq"]
            print(f"[{i}/{total}] item_seq={item_seq} 처리 중...")

            try:
                info = fetch_easy_info(item_seq)
            except RuntimeError as e:
                if str(e) == "RATE_LIMIT_EXCEEDED":
                    print("⚠️ 429 한도 초과 감지됨. 지금 지점에서 전체 작업 중단할게.")
                    break   # for 루프 탈출
                else:
                    raise

            if info:
                save_easy_info(conn, info)

            time.sleep(1.0)  # 속도 조절 (원하는 값 유지)

    finally:
        conn.close()
        print("완료!")


if __name__ == "__main__":
    main()
