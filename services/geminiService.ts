import { GoogleGenAI } from "@google/genai";
import { PillData } from "../types";

export const analyzePillImage = async (
  
  base64Image: string
  
): Promise<PillData> => {
  
  const apiKey = import.meta.env.VITE_API_KEY as string;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: cleanBase64,
        },
      },
      {
        text: `Analyze this pill image. Identify the pill name, imprint, color, shape and provide medical details in JSON format. Return JSON only.`,
      },
    ],
  });

// ⬇⬇ 이 부분만 이렇게 바꾸기
const resultText = response.text ?? "";
if (!resultText) {
  throw new Error("Empty response from Gemini");
}

return JSON.parse(resultText) as PillData;}