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
      const errorData = await res.json().catch(() => ({ error: "Unknown gateway error" }));
      throw new Error(errorData.error || `Server Error: ${res.status}`);
    }

    const data = await res.json();
    return data.reply;
  } catch (error) {
    console.error("Socratic AI Error:", error);
    throw error;
  }
}
