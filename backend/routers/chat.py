# backend/routers/chat.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv
load_dotenv()
import openai

router = APIRouter(prefix="/api/chat", tags=["chat"])

# OpenAI API 키 설정 (환경변수에서 가져오기)
# 실제 배포 시에는 .env 파일에 넣어야 합니다.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
client = openai.OpenAI(api_key=OPENAI_API_KEY)

# 요청 데이터 구조
class Message(BaseModel):
    role: str # "user" 또는 "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

# 🤖 시스템 프롬프트 (AI의 성격 설정)
SYSTEM_PROMPT = """
당신은 친절하고 전문적인 '약사 AI'입니다. 
사용자가 증상을 말하면 다음 원칙에 따라 답변하세요:

1. 증상에 대해 공감하고, 예상되는 원인을 간단히 설명하세요.
2. 해당 증상에 효과적인 일반의약품 성분이나 약 이름을 2~3개 추천하세요. (예: 타이레놀, 베아제 등 한국 약 위주)
3. 답변 끝에는 반드시 "정확한 진단은 의사나 약사와 상담하세요."라는 주의사항을 덧붙이세요.
4. 너무 심각한 증상(피가 남, 의식 불명 등)이면 즉시 병원에 가라고 강하게 권유하세요.
5. 말투는 정중하고 따뜻하게 하세요.
6.★★★ 매우 중요 (엄격하게 지킬 것) ★★★
사용자에게 약 이름(성분명 또는 제품명)을 추천할 때는, 
반드시 이름 앞뒤를 대괄호 두 개([[ ]])로 감싸야 해.
리스트에 있는 '모든' 약 이름에 적용해야 해. 하나라도 빼먹지 마.

[올바른 예시]
1. [[타이레놀]] (해열진통제)
2. [[판피린]]
3. [[베아제]]

[틀린 예시 - 절대 이렇게 하지 마]
1. [[타이레놀]]
2. 판피린 (괄호 없음 X)
3. 베아제

"""

@router.post("")
async def chat_with_ai(request: ChatRequest):
    try:
        # 대화 기록에 시스템 프롬프트 추가
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + [
            {"role": m.role, "content": m.content} for m in request.messages
        ]

        # GPT 호출
        response = client.chat.completions.create(
            model="gpt-3.5-turbo", # 또는 "gpt-4"
            messages=messages,
            temperature=0.7,
        )

        ai_reply = response.choices[0].message.content
        return {"reply": ai_reply}

    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))