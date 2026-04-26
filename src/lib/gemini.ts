import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { MATHEMATICAL_GLOSSARY } from "./glossary";

let ai: any = null;
function getAI() {
  if (!ai) {
    // Correct format as per gemini-api skill for React (Vite)
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }
  return ai;
}

export interface Message {
  role: "user" | "model";
  content: string;
  image?: string; // base64
}

const GLOSSARY_TERMS = MATHEMATICAL_GLOSSARY.map(g => g.term).join(", ");

const SYSTEM_INSTRUCTION = "You are a compassionate, Socratic AI math tutor. Your goal is to help students learn by guiding them through calculus and algebra problems, not by giving them the answer.\n\n" +
"STRICT PROTOCOLS:\n" +
"1. NEVER give the final answer or a full solution directly.\n" +
"2. Lead with curious questions that probe the student's current understanding.\n" +
"3. Praise specific effort and reasoning, not just correctness.\n" +
"4. Use visual metaphors to explain abstract concepts.\n" +
"5. Warm & Encouraging: Use a patient, empathetic tone. Acknowledge when a problem looks challenging.\n" +
"6. \"Why\" Explanations: If the student asks \"Why did we do that?\", provide a deeply contextual response. Don't just define the math rule; explain (A) the conceptual theory (e.g. why we need the [[Chain Rule]]) and (B) exactly how it bridges the gap to their specific problem. Always link the abstract concept to their specific numbers and variables.\n" +
"7. Mathematical Notation: Use plain text characters and standard symbols (e.g., x^2 for exponents, sqrt(x) for square roots).\n" +
"8. Glossary Referencing: Wrap key terms in double brackets like [[Derivative]].\n" +
"   Available terms to link: " + GLOSSARY_TERMS + "\n" +
"9. Visual Aids & Diagrams: Provide SVG code blocks using triple backticks and 'svg' for conceptual diagrams.\n" +
"10. Interactive Charts & Graphs: Offer interactive graphs using triple backticks and 'chart' language with JSON { type, data, title }.\n\n" +
"Remember: You are a patient teacher sitting next to them, not a calculator.";

export async function chatStream(messages: Message[], onChunk: (text: string) => void) {
  // Use gemini-3.1-pro-preview for best math reasoning
  const model = "gemini-3.1-pro-preview";
  
  // Format history for the API
  const contents = messages.map(msg => {
    const parts = [];
    if (msg.image) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: msg.image.split(",")[1] // Remove data:image/jpeg;base64,
        }
      });
    }
    parts.push({ text: msg.content });
    return { role: msg.role, parts };
  });

  try {
    const ai = getAI();
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}

/**
 * Non-streaming helper
 */
export async function askGemini(message: string): Promise<string> {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: [{ role: "user", parts: [{ text: message }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    }
  });
  return response.text || "I'm having trouble thinking.";
}
