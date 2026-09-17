import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("learnmade_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Helper for streaming SSE endpoints (AI Tutor / Chatbot) using fetch directly,
// since axios doesn't expose a readable stream in the browser.
export async function streamPost(path, body, onChunk) {
  const token = localStorage.getItem("learnmade_token");
  const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.chunk) onChunk(parsed.chunk);
        if (parsed.error) throw new Error(parsed.error);
      } catch {
        // ignore malformed lines
      }
    }
  }
}
