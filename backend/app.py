from fastapi import FastAPI, Query
from db import get_conn

app = FastAPI()

@app.get("/pills")
def search_pills(keyword: str = Query(..., min_length=1)):
    conn = get_conn()
    cur = conn.cursor()

    sql = """
        SELECT item_seq, item_name, entp_name, drug_shape, color_class1, color_class2,print_front, print_back, chart, item_image
        FROM pill_mfds
        WHERE item_name LIKE %s OR entp_name LIKE %s
        LIMIT 50
    """
    like = f"%{keyword}%"
    cur.execute(sql, (like, like))
    rows = cur.fetchall()
    conn.close()
    return rows
