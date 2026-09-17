import Course from "../models/Course.js";
import { Quiz, QuizAttempt } from "../models/Quiz.js";
import { generateJSON } from "../services/geminiService.js";

const SYSTEM_PROMPT = `You are a quiz generator for an online learning platform. Given lesson content, produce a short multiple-choice quiz that tests real understanding, not trivia.
Return ONLY valid JSON matching this exact shape, no extra commentary:
{"questions":[{"question":"string","options":["string","string","string","string"],"correctIndex":0,"explanation":"string"}]}
Generate exactly 3 questions. Each question must have exactly 4 options. correctIndex is the 0-based index of the correct option. explanation is a 1-2 sentence reason the correct answer is right.`;

// POST /api/ai/generate-quiz  body: { courseId, lessonIndex }
export const generateQuiz = async (req, res, next) => {
  try {
    const { courseId, lessonIndex } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    const lesson = course.lessons[lessonIndex];
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    // reuse an existing AI quiz for this lesson if one exists
    let quiz = await Quiz.findOne({ course: courseId, lessonIndex, generatedBy: "ai" });
    if (!quiz) {
      const result = await generateJSON({
        systemPrompt: SYSTEM_PROMPT,
        userPrompt: `Lesson title: ${lesson.title}\n\nLesson content:\n${lesson.content}`,
      });
      quiz = await Quiz.create({
        course: courseId,
        lessonIndex,
        questions: result.questions,
        generatedBy: "ai",
      });
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
};

// POST /api/ai/quiz/:quizId/attempt  body: { answers: [number] }
export const submitAttempt = async (req, res, next) => {
  try {
    const { answers } = req.body;
    const quiz = await Quiz.findById(req.params.quizId);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctIndex) score++;
    });

    const attempt = await QuizAttempt.create({
      user: req.user._id,
      quiz: quiz._id,
      answers,
      score,
      total: quiz.questions.length,
    });

    res.status(201).json(attempt);
  } catch (err) {
    next(err);
  }
};
