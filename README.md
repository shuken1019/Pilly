Pilly (필리) - AI 기반 알약 식별 및 복약 상담 플랫폼

Pilly는 혼동하기 쉬운 알약을 사진 한 장으로 식별하고, AI 약사와의 상담을 통해 정확한 복약 지도를 제공하는 하이브리드 AI 솔루션입니다. 

Key Features

스마트 약 사진 인식: YOLOv8 모델을 활용하여 사진 속 알약을 실시간으로 탐지하고 식별합니다. 


AI 약사 1:1 상담: 식별된 약 정보를 바탕으로 LLM(OpenAI/Gemini)이 맞춤형 복약 상담을 제공합니다. 


의약품 상세 검색: 공공 의약품 데이터를 기반으로 성분, 효능, 주의사항 등 상세 정보를 제공합니다. 


소셜 로그인: 카카오 API를 이용한 간편 로그인 기능을 지원합니다. 


복약 커뮤니티: 사용자 간 복약 후기 및 건강 정보를 공유할 수 있는 커뮤니티 공간을 제공합니다. 

🏗 System Architecture
Pilly는 확장성과 비동기 처리를 고려하여 설계되었습니다. 

코드 스니펫
graph TD
    A[React Frontend] -->|Auth & API Request| B[FastAPI Backend]
    B -->|Object Detection| C[YOLOv8 Model]
    B -->|Context Injection| D[OpenAI / Gemini API]
    B -->|Data Query| E[MySQL Database]
    B -->|Social Auth| F[Kakao Auth Server]
    subgraph Cloud
    B
    E
    end
🛠 Tech Stack
Infrastructure & DevOps

AWS EC2 (Ubuntu): 서비스 호스팅 및 systemd를 이용한 무중단 서버 운영. 

Nginx: Reverse Proxy 및 정적 파일 서빙 최적화.

Backend

FastAPI: 비동기 처리를 통한 고성능 API 서버 구현. 


MySQL: 공공 의약품 데이터 및 사용자 데이터 관리. 

Kakao Login API & JWT: OAuth 2.0 기반 인증 및 토큰 보안 체계 구축.

Frontend
React (TypeScript): 안정적인 타입 시스템 기반의 컴포넌트 설계.

Vite: 효율적인 빌드 및 개발 환경 구축.

AI & Machine Learning

YOLOv8: 알약 객체 탐지 모델 직접 학습 및 배포. 


OpenAI / Gemini: RAG 기반의 지능형 상담 엔진 구현. 

📈 Technical Challenges & Solutions
1. 객체 탐지 모델 성능 최적화 (YOLOv8)
문제: 유사한 색상과 형태를 가진 알약의 오인식 문제 발생.

해결: Roboflow를 통해 100여 장의 이미지 커스텀 라벨링 및 조명/각도 증강(Augmentation) 적용.

결과: mAP50 0.992, Recall 1.0 달성으로 실전 탐지 신뢰도 확보.

2. 하이브리드 AI (Vision + LLM) 구현

해결: Vision AI가 식별한 ID를 DB와 매핑하여 전문 데이터를 추출하고, 이를 LLM에 Context로 주입하여 환각(Hallucination) 현상을 방지함. 



How to Run
Backend
Bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload



Frontend
Bash
npm install
npm run dev

Author: [김수연]  Contact:shuken1019@gmail.com
