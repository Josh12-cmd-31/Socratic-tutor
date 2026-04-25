/**
 * Service to interact with the Socratic Tutor AI
 * Proxied through the server to protect API keys and ensure environment stability.
 */
export async function askAI(message: string): Promise<string> {
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    if (!res.ok) {
      const text = await res.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { error: `Server Error ${res.status}: ${text.substring(0, 100)}` };
      }
      throw new Error(errorData.error || `Server Error: ${res.status}`);
    }

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return data.reply;
    } catch (e) {
      console.error("Failed to parse JSON response:", text.substring(0, 200));
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("Socratic AI Error:", error);
    throw error;
  }
}
