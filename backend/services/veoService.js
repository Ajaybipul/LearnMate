// Wraps Google's Veo video generation model via the Gemini API.
//
// IMPORTANT - read before relying on this in production:
// Video generation is a newer, faster-moving part of the Gemini API than text generation,
// and the exact REST shape (endpoint names, operation polling format, file retrieval) can
// change. This implementation follows the documented long-running-operation pattern as of
// this writing. If Google changes the endpoint shape, this is the one file to update -
// nothing else in the codebase talks to Veo directly.
//
// Cost & duration reality this is built around (see project spec for the full explanation):
// - Each clip is ~8 seconds.
// - We chain multiple clips to approximate a longer lesson video, capped at ~2 minutes
//   (about 15 clips) rather than a true 3 minutes, which is above Veo's realistic ceiling.
// - There is no free tier. This must always be an explicit, opt-in, cost-disclosed action.

import { generateJSON } from "./geminiService.js";

const VEO_MODEL = process.env.VEO_MODEL || "veo-3.1-fast-generate-001";
const COST_PER_SECOND_USD = Number(process.env.VEO_COST_PER_SECOND || 0.15); // Fast tier default
const CLIP_SECONDS = 8;
const MAX_CLIPS = 15; // ~2 minutes

function getKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set in .env");
  return key;
}

/**
 * Breaks lesson content into a sequence of short, concrete visual scene prompts,
 * one per ~8-second clip. Caps at MAX_CLIPS to stay within Veo's chaining ceiling.
 */
export async function planScenes(lessonTitle, lessonContent, targetMinutes = 2) {
  const clipCount = Math.min(MAX_CLIPS, Math.max(4, Math.round((targetMinutes * 60) / CLIP_SECONDS)));

  const result = await generateJSON({
    systemPrompt: `You write short visual scene descriptions for an AI video generator (Veo) that produces one ~8-second clip per scene.
Given a lesson's title and content, break it into exactly ${clipCount} scenes that together visually narrate the lesson in order.
Return ONLY valid JSON: {"scenes":["string", ...]} with exactly ${clipCount} entries.
Each scene description should be concrete and visual (what's on screen, simple camera direction), 1-2 sentences, suitable for an educational explainer style. Keep a consistent visual style description repeated across scenes (e.g. "clean minimal whiteboard-style animation") so the clips feel like one video rather than unrelated shots.`,
    userPrompt: `Lesson title: ${lessonTitle}\n\nLesson content:\n${lessonContent}`,
  });

  if (!result.scenes || result.scenes.length === 0) {
    throw new Error("Failed to plan video scenes for this lesson");
  }
  return result.scenes.slice(0, clipCount);
}

export function estimateCost(clipCount) {
  const totalSeconds = clipCount * CLIP_SECONDS;
  return {
    clipCount,
    totalSeconds,
    estimatedCostUsd: Math.round(totalSeconds * COST_PER_SECOND_USD * 100) / 100,
  };
}

/**
 * Submits one clip generation job to Veo. Returns the long-running operation name to poll.
 */
export async function startClipGeneration(prompt) {
  const key = getKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${VEO_MODEL}:predictLongRunning?key=${key}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { aspectRatio: "16:9", durationSeconds: CLIP_SECONDS },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Veo generation request failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.name) throw new Error("Veo did not return an operation name");
  return data.name; // e.g. "operations/abc123"
}

/**
 * Polls a single clip's operation. Returns { done, fileUri?, error? }.
 */
export async function pollClipOperation(operationName) {
  const key = getKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Veo operation poll failed (${res.status}): ${errText}`);
  }
  const data = await res.json();

  if (data.error) {
    return { done: true, error: data.error.message || "Video generation failed" };
  }
  if (!data.done) {
    return { done: false };
  }

  const fileUri =
    data.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
    data.response?.videos?.[0]?.uri ||
    null;

  if (!fileUri) {
    return { done: true, error: "Veo finished but returned no video file" };
  }
  return { done: true, fileUri };
}

/**
 * Streams the actual video bytes from Google's file URI, using the API key server-side
 * so it's never exposed to the browser. Pipes directly into the given Express response.
 */
export async function streamClipToResponse(fileUri, res) {
  const key = getKey();
  const separator = fileUri.includes("?") ? "&" : "?";
  const authedUrl = `${fileUri}${separator}key=${key}`;

  const upstream = await fetch(authedUrl);
  if (!upstream.ok || !upstream.body) {
    throw new Error(`Failed to fetch generated video file (${upstream.status})`);
  }

  res.setHeader("Content-Type", upstream.headers.get("content-type") || "video/mp4");
  const reader = upstream.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

export const CONFIG = { CLIP_SECONDS, MAX_CLIPS, COST_PER_SECOND_USD };
