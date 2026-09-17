import AiChat from "../models/AiChat.js";
import Course from "../models/Course.js";
import { streamChat } from "../services/geminiService.js";

function buildSystemPrompt(courseList) {
  return `You are the general Help Assistant for Learnmade AI, an online learning platform.
You answer platform questions - how to enroll in a course, where to find certificates, how the AI Tutor or quizzes work, navigation help, and general "how do I..." questions.
You also know the real, current list of courses available on the platform (below) and should answer questions about what courses exist, what they cover, and how many lessons they have using this real data - never invent a course that isn't listed.
You are NOT scoped to any specific lesson's content. If a student asks a deep subject-matter question about something they're studying inside a course, gently point them to the AI Tutor inside that lesson instead.
Keep answers short and friendly - 1-3 sentences where possible.

Current course catalog:
${courseList || "(no courses have been added yet)"}`;
}

// POST /api/ai/chatbot  body: { message }
export const chatbotChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: "message is required" });

    let chat = await AiChat.findOne({ user: req.user._id, type: "chatbot" });
    if (!chat) {
      chat = await AiChat.create({ user: req.user._id, type: "chatbot", messages: [] });
    }

    // Pull the live course catalog every call so the bot always answers from real, current data.
    const courses = await Course.find().select("title tag description lessons").lean();
    const courseList = courses
      .map((c) => `- ${c.title} (${c.tag}) - ${c.lessons.length} lessons. ${c.description}`)
      .join("\n");

    const history = chat.messages.map((m) => ({ role: m.role, content: m.content }));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    const fullText = await streamChat({
      systemPrompt: buildSystemPrompt(courseList),
      history,
      message,
      onChunk: (chunk) => res.write(`data: ${JSON.stringify({ chunk })}\n\n`),
    });

    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "model", content: fullText });
    await chat.save();

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) next(err);
    else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
};

export const getChatbotHistory = async (req, res, next) => {
  try {
    const chat = await AiChat.findOne({ user: req.user._id, type: "chatbot" });
    res.json(chat?.messages || []);
  } catch (err) {
    next(err);
  }
};
