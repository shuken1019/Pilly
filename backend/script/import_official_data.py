import pandas as pd
import sys
import os
from tqdm import tqdm # 진행바 표시용

# DB 연결 설정 (부모 폴더 경로 추가)
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from db import get_conn

def import_official_production_data(csv_path):
    conn = get_conn()
    
    # 공공데이터 CSV 컬럼명 후보 (파일마다 조금씩 다를 수 있음)
    NAME_COLS = ['품목명', '제품명', '약품명', 'item_name']
    AMOUNT_COLS = ['생산실적', '실적', '금액', '생산금액', 'amount']

    try:
        print(f">>> 📂 데이터 파일 로딩 중: {csv_path}")
        
        # 1. CSV 읽기 (인코딩 시도: cp949 -> euc-kr -> utf-8)
        try:
            df = pd.read_csv(csv_path, encoding='cp949')
        except UnicodeDecodeError:
            try:
                df = pd.read_csv(csv_path, encoding='euc-kr')
            except UnicodeDecodeError:
                df = pd.read_csv(csv_path, encoding='utf-8')

        # 2. 컬럼명 찾기 (자동 감지)
        name_col = next((col for col in NAME_COLS if col in df.columns), None)
        amount_col = next((col for col in AMOUNT_COLS if col in df.columns), None)

        if not name_col or not amount_col:
            print(f"❌ [오류] 필수 컬럼을 찾을 수 없습니다.")
            print(f"   - 현재 파일의 컬럼: {list(df.columns)}")
            print(f"   - 기대하는 '이름' 컬럼: {NAME_COLS}")
            print(f"   - 기대하는 '실적' 컬럼: {AMOUNT_COLS}")
            return

        print(f">>> 감지된 컬럼 - 이름: [{name_col}], 실적: [{amount_col}]")

        # 3. 데이터 전처리
        data_list = []
        print(">>> 데이터 전처리 중...")
        
        for index, row in df.iterrows():
            name = str(row[name_col]).strip() # 앞뒤 공백 제거
            amount_raw = row[amount_col]
            
            try:
                # 데이터 정제 (콤마 제거, 빈 값 처리)
                if pd.isna(amount_raw) or str(amount_raw).strip() in ['-', '', 'nan']:
                    amount = 0
                else:
                    # '1,234,567' -> 1234567 변환
                    amount = int(float(str(amount_raw).replace(',', '')))
            except ValueError:
                amount = 0

            # 실적이 있는 경우만 리스트에 추가
            if amount > 0:
                data_list.append((amount, name))

        print(f">>> 총 {len(data_list)}개 유효 데이터 준비 완료.")

        # 4. DB 업데이트
        with conn.cursor() as cur:
            # (선택) 기존 점수 초기화가 필요하면 주석 해제
            # print(">>> 기존 점수 초기화 중...")
            # cur.execute("UPDATE pill_mfds SET popularity_score = 0")
            
            print(">>> DB 업데이트 시작 (진행률 표시)...")
            
            updated_count = 0
            
            # tqdm으로 진행바 표시
            for amount, name in tqdm(data_list):
                # 1차 시도: 정확히 일치하는 이름
                sql = "UPDATE pill_mfds SET popularity_score = %s WHERE item_name = %s"
                affected = cur.execute(sql, (amount, name))
                
                # 2차 시도: 괄호 등 특수문자 차이로 못 찾았을 경우 (LIKE 검색)
                # 예: 데이터셋엔 "게보린정"인데 DB엔 "게보린정(아세트아미노펜)" 인 경우
                if affected == 0:
                    sql_fuzzy = "UPDATE pill_mfds SET popularity_score = %s WHERE item_name LIKE %s AND popularity_score = 0"
                    affected = cur.execute(sql_fuzzy, (amount, f"{name}%"))

                if affected > 0:
                    updated_count += 1
            
            conn.commit()
            print(f"\n>>> ✅ 업데이트 완료!")
            print(f"   - 원본 데이터 수: {len(data_list)}개")
            print(f"   - DB 반영 성공 수: {updated_count}개")

    except Exception as e:
        print(f"❌ 치명적 오류 발생: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # 실행 방법: python backend/script/import_official_data.py <파일경로>
    if len(sys.argv) < 2:
        print("\n[사용법]")
        print("python backend/script/import_official_data.py <CSV파일경로>")
        print("예: python backend/script/import_official_data.py /Users/me/downloads/production_2023.csv\n")
    else:
        import_official_production_data(sys.argv[1])