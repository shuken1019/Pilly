import os   #운영체제 관련 경로/환경변수 처리
import pymysql #라이브러리
from dotenv import load_dotenv #env 파일 로드하는 함수

# .env 로드
Base_DIR =(os.path.abspath(__file__)) #현재 파일의 절대경로
load_dotenv(os.path.join(os.path.dirname(Base_DIR), '.env'))# .env 파일 경로 설정 후 로드

DB_HOST = os.getenv('DB_HOST', '13.124.212.174')
DB_PORT = int(os.getenv('DB_PORT', 3306))
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'pill_db')

def get_db_connection(): #mysql 연결을 만들어서 리턴하는 함수. 필요할때마다 호출 후, 사용이 끝나면  conn.close() 해주기

    conn = pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor #결과를 dict로 받기
    )
    return conn
# DB연결 도우미
def get_conn():
    return get_db_connection(

    )

    
