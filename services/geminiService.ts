
import { GoogleGenAI, Type } from "@google/genai";
import { APPS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getSmartRecommendations = async (userQuery: string) => {
  if (!process.env.API_KEY) return null;

  try {
    const appNames = APPS.map(a => a.name).join(", ");
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User is searching for: "${userQuery}". Based on our app list [${appNames}], suggest the top 2-3 most relevant apps and give a very short 1-sentence reason why.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              reason: { type: Type.STRING }
            },
            required: ["name", "reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
};
