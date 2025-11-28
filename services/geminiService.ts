import { GoogleGenAI, Type } from "@google/genai";
import { PillData } from "../types";

export const analyzePillImage = async (
  base64Image: string
): Promise<PillData> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 string if it contains the data URL prefix
  const cleanBase64 = base64Image.replace(
    /^data:image\/(png|jpeg|jpg);base64,/,
    ""
  );

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this image of a pill. Identify it and provide detailed medical information in Korean.
            Return the result in JSON format.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "Name of the pill (Korean)",
            },
            category: {
              type: Type.STRING,
              description: "Category like 'Painkiller', 'Antibiotic'",
            },
            ingredients: { type: Type.STRING, description: "Main ingredients" },
            efficacy: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of effects/benefits",
            },
            usage: { type: Type.STRING, description: "How to take it" },
            precautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Safety warnings",
            },
          },
          required: [
            "name",
            "category",
            "ingredients",
            "efficacy",
            "usage",
            "precautions",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as PillData;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze pill image.");
  }
};
