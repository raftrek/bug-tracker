
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available from environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey });

export async function generateIssueSummary(title: string, description: string): Promise<string> {
  const prompt = `
    You are an expert project manager. Analyze the following bug report/task and provide a concise summary and suggest the next actionable steps.
    Format your response clearly with a "Summary" section and a "Next Steps" section.

    **Title:** ${title}
    **Description:** ${description}
    ---
    **Response:**
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get summary from Gemini API.");
  }
}
