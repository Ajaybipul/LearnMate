import Course from "../models/Course.js";
import AiSummary from "../models/AiSummary.js";
import { generateJSON } from "../services/geminiService.js";

const SYSTEM_PROMPT = `You summarize lesson content for an online learning platform. Given lesson content, produce a concise revision summary.
Return ONLY valid JSON matching this exact shape, no extra commentary:
{"keyPoints":["string","string","string"],"flashcards":[{"question":"string","answer":"string"}]}
Produce 4-6 key points and 3-5 flashcards. Key points should be short, standalone sentences. Flashcards should test recall of the most important ideas.`;

// POST /api/ai/summarize  body: { courseId, lessonIndex }
export const summarizeLesson = async (req, res, next) => {
  try {
    const { courseId, lessonIndex } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lesson = course.lessons[lessonIndex];
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    let summary = await AiSummary.findOne({ course: courseId, lessonIndex });
    if (!summary) {
      const result = await generateJSON({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Lesson title: ${lesson.title}\n\nLesson content:\n${lesson.content}`,
      });
      summary = await AiSummary.create({
        course: courseId,
        lessonIndex,
        keyPoints: result.keyPoints,
        flashcards: result.flashcards,
      });
    }
    res.json(summary);
  } catch (err) {
    next(err);
  }
};
