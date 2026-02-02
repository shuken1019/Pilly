import pymysql
import os
from dotenv import load_dotenv
from google import genai  # ✅ 새로운 라이브러리 방식
import time

# 1. 설정 로드
load_dotenv()

# ✅ 새 라이브러리 클라이언트 생성
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
MODEL_ID = "gemini-2.0-flash"

def get_db_conn():
    return pymysql.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME"),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

def summarize_pill_info():
    conn = get_db_conn()
    try:
        with conn.cursor() as cursor:
            # 2. id가 있고 이름이 유효한 데이터 5개씩 가져오기
            sql = """
                SELECT id, ITEM_NAME, EFCY_QESITM 
                FROM pill_easy_info 
                WHERE USE_METHOD_QESITM IS NULL 
                AND ITEM_NAME IS NOT NULL 
                AND ITEM_NAME != 'None' 
                LIMIT 5
            """
            cursor.execute(sql)
            pills = cursor.fetchall()

            if not pills:
                print("✨ 모든 약 정보가 요약되어 있습니다!")
                return

            for pill in pills:
                pill_id = pill['id']
                pill_name = pill['ITEM_NAME']
                print(f"[{pill_id}] 요약 중: {pill_name}...")

                prompt = f"""
                약 '{pill_name}'에 대한 전문 의학 정보를 요약해줘.
                형식:
                방법: [복용법]
                부작용: [주요 부작용]
                주의: [금기 및 주의사항]
                반드시 '~함', '~할 것' 어조를 유지해줘.
                """

                try:
                    # 🚀 새 라이브러리 호출 방식
                    response = client.models.generate_content(
                        model=MODEL_ID,
                        contents=prompt
                    )
                    
                    # 3. 결과 텍스트 추출 및 DB 업데이트
                    summary_text = response.text
                    update_sql = "UPDATE pill_easy_info SET USE_METHOD_QESITM = %s WHERE id = %s"
                    cursor.execute(update_sql, (summary_text[:2000], pill_id))
                    conn.commit()
                    print(f"✅ {pill_name} 저장 완료!")

                except Exception as ai_err:
                    print(f"❌ AI 오류 발생: {ai_err}")
                
                time.sleep(2) # API 제한 방지
    finally:
        conn.close()

if __name__ == "__main__":
    summarize_pill_info()