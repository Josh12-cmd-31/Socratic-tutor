/**
 * Service to interact with the Socratic Tutor AI
 * Proxied through the server to protect API keys and ensure environment stability.
 */
export async function askAI(message: string): Promise<string> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  async function attempt(retryCount: number): Promise<string> {
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      });

      const text = await res.text();

      if (!res.ok) {
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch (e) {
          // If we got HTML (like "Starting Server...") but a non-OK status, it might be temporary
          if (text.includes("<!doctype html>") || text.includes("<html")) {
            if (retryCount < MAX_RETRIES) {
              console.warn(`Gateway busy (HTML response ${res.status}), retrying... ${retryCount + 1}/${MAX_RETRIES}`);
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
              return attempt(retryCount + 1);
            }
          }
          errorData = { error: `Server Error ${res.status}: ${text.substring(0, 100)}` };
        }
        throw new Error(errorData.error || `Server Error: ${res.status}`);
      }

      try {
        const data = JSON.parse(text);
        return data.reply;
      } catch (e) {
        // If we got 200 OK but the body is HTML, it's likely the proxy hasn't swapped to the backend yet
        if (text.includes("<!doctype html>") || text.includes("<html")) {
          if (retryCount < MAX_RETRIES) {
            console.warn(`Proxy served HTML on 200 OK, retrying... ${retryCount + 1}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return attempt(retryCount + 1);
          }
        }
        console.error("Failed to parse JSON response:", text.substring(0, 200));
        throw new Error("Invalid response form from server");
      }
    } catch (error) {
      if (retryCount < MAX_RETRIES && (error as any).message?.includes("Failed to fetch")) {
        console.warn("Fetch failed, retrying...", retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return attempt(retryCount + 1);
      }
      throw error;
    }
  }

  return attempt(0);
}
