# backend/services/trend_service.py

from db import get_conn
import datetime

def update_daily_trends():
    """
    [자동화 로직]
    최근 7일간 사용자들의 검색어(search_history)를 분석하여
    많이 검색된 약품의 인기도 점수(popularity_score)를 가산합니다.
    """
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            print(f"[{datetime.datetime.now()}] 📈 실시간 검색어 트렌드 반영 시작...")

            # 1. 기존 트렌드 점수 초기화 (기본 생산실적 점수는 남기고, 트렌드 가산점만 리셋하고 싶다면 별도 컬럼 필요하지만, 여기선 단순화)
            # (실제 배포시엔 'trend_score' 컬럼을 따로 두는 게 좋지만, 지금은 popularity_score에 더하는 방식 사용)
            
            # 2. 최근 7일간 검색어 통계 뽑기
           
            sql_stats = """
                SELECT keyword, COUNT(*) as search_cnt 
                FROM search_history
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY keyword
                HAVING search_cnt > 2  -- 최소 3번 이상 검색된 것만 반영 (노이즈 제거)
                ORDER BY search_cnt DESC
                LIMIT 50
            """
            cur.execute(sql_stats)
            trends = cur.fetchall()

            if not trends:
                print(">>> 최근 검색 기록이 부족하여 업데이트를 건너뜁니다.")
                return

            updated_count = 0
            
            # 3. 검색어별로 관련 약품 점수 올려주기
            for item in trends:
                keyword = item['keyword']
                count = item['search_cnt']
                
                # 가중치: 검색 1회당 100점 부여 (많이 검색될수록 상위 노출)
                bonus_score = count * 100
                
                # 검색어가 포함된 약품이나 효능을 가진 약품 찾아서 점수 UP
                update_sql = """
                    UPDATE pill_mfds 
                    SET popularity_score = popularity_score + %s 
                    WHERE item_name LIKE %s 
                    OR entp_name LIKE %s
                """
                kw_param = f"%{keyword}%"
                rows = cur.execute(update_sql, (bonus_score, kw_param, kw_param))
                updated_count += rows
                
                print(f"   🔥 급상승 키워드 '{keyword}' ({count}회) -> 관련 약품 점수 +{bonus_score}")

            conn.commit()
            print(f">>> ✅ 총 {updated_count}개 약품의 순위가 트렌드에 맞춰 조정되었습니다.")

    except Exception as e:
        print(f"🚨 트렌드 업데이트 실패: {e}")
        conn.rollback()
    finally:
        conn.close()