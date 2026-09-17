import Course from "../models/Course.js";
import AiChat from "../models/AiChat.js";
import { streamChat } from "../services/geminiService.js";

// POST /api/ai/tutor
// body: { courseId, lessonIndex, message }
// Streams the reply back as Server-Sent Events so the frontend can render it token-by-token.
export const tutorChat = async (req, res, next) => {
  try {
    const { courseId, lessonIndex, message } = req.body;
    if (!courseId || lessonIndex === undefined || !message) {
      return res.status(400).json({ message: "courseId, lessonIndex and message are required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lesson = course.lessons[lessonIndex];
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    let chat = await AiChat.findOne({
      user: req.user._id,
      type: "tutor",
      course: courseId,
      lessonIndex,
    });
    if (!chat) {
      chat = await AiChat.create({ user: req.user._id, type: "tutor", course: courseId, lessonIndex, messages: [] });
    }

    const systemPrompt = `You are the AI Tutor inside Learnmade AI, a learning platform. The student is on the course "${course.title}", lesson "${lesson.title}". Lesson content the student just studied:
"""
${lesson.content}
"""
Answer the student's questions clearly, staying grounded in this lesson's content when relevant. Keep answers concise (2-4 short paragraphs), plain text, no markdown headers.`;

    const history = chat.messages.map((m) => ({ role: m.role, content: m.content }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const fullText = await streamChat({
      systemPrompt,
      history,
      message,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      },
    });

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "model", content: fullText });
    await chat.save();

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

export const getTutorHistory = async (req, res, next) => {
  try {
    const { courseId, lessonIndex } = req.query;
    const chat = await AiChat.findOne({
      user: req.user._id,
      type: "tutor",
      course: courseId,
      lessonIndex: Number(lessonIndex),
    });
    res.json(chat?.messages || []);
  } catch (err) {
    next(err);
  }
};
