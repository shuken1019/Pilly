import { GoogleGenerativeAI } from "@google/generative-ai"; // 👈 표준 SDK 사용 권장
import { PillData } from "../../types";

export const analyzePillImage = async (
  base64Image: string
): Promise<PillData> => {
  
  // 1. Vite 환경 변수 가져오기
  const apiKey = import.meta.env.VITE_API_KEY as string;
  if (!apiKey) throw new Error("API Key not found");

  // 2. Gemini 클라이언트 초기화
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // 3. 모델 설정 (현재 최신 버전인 1.5-flash 사용)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );

  // 4. 요청 보내기
  const result = await model.generateContent([
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: cleanBase64,
      },
    },
    {
      text: `Analyze this pill image. Identify the pill name, imprint, color, shape and provide medical details in JSON format. 
      The JSON structure must match this interface:
      {
        name: string;
        category: string;
        ingredients: string;
        efficacy: string[];
        usage: string;
        precautions: string[];
      }
      Return JSON only, no markdown formatting.`,
    },
  ]);

  const response = result.response;

  // ⬇⬇ 요청하신 수정 부분 + 안전장치 추가
  // SDK에서 텍스트는 함수(.text())로 가져옵니다.
  const resultText = response.text(); 

  if (!resultText) {
    throw new Error("Empty response from Gemini");
  }

  // Gemini가 가끔 ```json ... ``` 같은 마크다운을 붙여서 주므로 제거해줍니다.
  const cleanedText = resultText.replace(/```json|```/g, "").trim();

  return JSON.parse(cleanedText) as PillData;
};