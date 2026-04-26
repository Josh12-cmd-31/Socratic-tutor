import { askGemini } from "./gemini";

/**
 * Service to interact with the Socratic Tutor AI.
 * Now calls Gemini directly from the client as per security guidelines.
 */
export async function askAI(message: string): Promise<string> {
  try {
    return await askGemini(message);
  } catch (error) {
    console.error("Socratic AI Error:", error);
    throw error;
  }
}
