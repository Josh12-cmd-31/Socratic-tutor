/**
 * Service to interact with the external Socratic Tutor AI API
 */
export async function askAI(message: string): Promise<string> {
  const apiKey = (import.meta as any).env.VITE_TUTOR_API_KEY || "my-secret-key";
  const apiUrl = "https://socratic-tutorai.vercel.app/chat";

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey
      },
      body: JSON.stringify({ message })
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API Error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.reply;
  } catch (error) {
    console.error("External AI Error:", error);
    throw error;
  }
}
