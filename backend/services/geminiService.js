// Thin wrapper around the Gemini REST API.
// Keeps every controller from having to know request/response shape details.

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function getModel() {
  return process.env.GEMINI_MODEL || "gemini-flash-latest";
}

function getKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in .env");
  return key;
}

function buildContents(history, newMessage) {
  // history: [{ role: 'user'|'model', content: string }]
  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
  if (newMessage) {
    contents.push({ role: "user", parts: [{ text: newMessage }] });
  }
  return contents;
}

/**
 * Streams a chat response from Gemini.
 * onChunk(text) is called for every incremental piece of text as it arrives.
 * Returns the full assembled text at the end.
 */
export async function streamChat({ systemPrompt, history = [], message, onChunk }) {
  const model = getModel();
  const key = getKey();
  const url = `${BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${key}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: buildContents(history, message),
    generationConfig: { temperature: 0.6, maxOutputTokens: 1024 },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini stream request failed (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop(); // keep last partial line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const jsonStr = trimmed.slice(5).trim();
      if (!jsonStr) continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const text = parsed?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
        if (text) {
          fullText += text;
          onChunk?.(text);
        }
      } catch {
        // ignore malformed keep-alive lines
      }
    }
  }

  return fullText;
}

/**
 * Generates a single image from a text prompt using Gemini's image-capable model.
 * Returns { mimeType, base64 } for the first inline image found in the response.
 */
export async function generateImage({ prompt }) {
  const key = getKey();
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const url = `${BASE_URL}/${model}:generateContent?key=${key}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini image request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData || p.inline_data);
  const inline = imagePart?.inlineData || imagePart?.inline_data;
  if (!inline) throw new Error("Gemini did not return an image for this prompt.");

  return { mimeType: inline.mimeType || inline.mime_type || "image/png", base64: inline.data };
}
export async function generateJSON({ systemPrompt, userPrompt, maxOutputTokens = 4096, temperature = 0.4 }) {
  const model = getModel();
  const key = getKey();
  const url = `${BASE_URL}/${model}:generateContent?key=${key}`;

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini request failed (${res.status}): ${errText}`);
  }


  const data = await res.json();
  const finishReason = data?.candidates?.[0]?.finishReason;
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "{}";

  try {
    return JSON.parse(text);
  } catch {
    if (finishReason === "MAX_TOKENS") {
      throw new Error(
        `Gemini's response was cut off before finishing (hit the ${maxOutputTokens}-token limit). Increase maxOutputTokens for this call and try again.`
      );
    }
    throw new Error("Gemini did not return valid JSON: " + text.slice(0, 200));
  }
}