import { generateJSON } from "./geminiService.js";

const SYSTEM_PROMPT = `You are a course designer for an online learning platform called Learnmade AI.
Given only a rough course topic (which may be a single word, an abbreviation, or informally phrased), generate a complete, genuinely useful course.
Return ONLY valid JSON matching this exact shape, no extra commentary:
{"title":"string","description":"string","tag":"string","lessons":[{"title":"string","content":"string","duration":"string"}]}

Rules:
- title: a clear, properly written, professional course title based on the topic - NOT just the raw topic text repeated back, and NOT a generic templated pattern. Vary the style based on what actually fits the topic - do not default to the same word or structure every time (avoid always reaching for words like "Essentials," "Fundamentals," "Mastering," or "The Complete Guide to" as a fallback pattern). Choose whichever style genuinely fits: it can be a plain descriptive title ("Full-Stack Web Development with the MERN Stack"), a question or outcome-driven title ("Building Your First React Application"), a colon-split title ("Negotiation: Getting to Yes at the Table"), or something else entirely - whatever a real, well-designed course catalog would use for that specific subject. Two different topics should not produce titles that share the same trailing word or phrase.
- description: 1-2 sentences, clear and specific to the topic.
- tag: a short category label (1-3 words), e.g. "Data & AI", "Communication", "Design", "Business", "Programming".
- Generate between 4 and 6 lessons, ordered from foundational to more advanced.
- Each lesson's "content" must be real instructional text a student could actually learn from - 150 to 350 words, written like a textbook or transcript, not a placeholder or outline.
- "duration" is a realistic estimate of narration time for that lesson's content, formatted like "6:40".`;

// Ensures a title is always properly capitalized, regardless of what Gemini returns
// or what the instructor typed as the fallback source.
function titleCase(str) {
  return str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/**
 * Calls Gemini to generate a full course (title, description, tag, lessons with real content)
 * from just a topic. Used by both the "generate course" API endpoint and the seed script,
 * so there is exactly one place that defines what an AI-generated course looks like.
 */
export async function generateCourseContent(topic) {
  const result = await generateJSON({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Course topic: "${topic}"`,
    maxOutputTokens: 8192, // a full course (4-6 lessons of real content) is much larger than a quiz/summary
    temperature: 0.85, // higher than the default - keeps titles varied instead of repeating the same pattern every time
  });

  if (!result.lessons || !Array.isArray(result.lessons) || result.lessons.length === 0) {
    throw new Error("Gemini did not return a valid lesson list for this course");
  }

  return {
    title: titleCase(result.title?.trim() || topic),
    description: result.description || `A course on ${topic}.`,
    tag: result.tag || "General",
    lessons: result.lessons.map((l) => ({
      title: l.title,
      content: l.content,
      duration: l.duration || "",
      videoUrl: "",
      videoStatus: "none",
    })),
  };
}