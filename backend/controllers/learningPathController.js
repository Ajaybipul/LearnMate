import Course from "../models/Course.js";
import LearningPath from "../models/LearningPath.js";
import Enrollment from "../models/Enrollment.js";
import { generateJSON } from "../services/geminiService.js";

const SYSTEM_PROMPT = `You are a learning path planner for an online learning platform. Given a student's goal and the list of available courses, produce a personalized, ordered roadmap - a genuine step-by-step learning journey, not a one-line restatement of the goal.

Return ONLY valid JSON matching this exact shape, no extra commentary:
{"roadmap":[{"title":"string","reason":"string","courseId":"string or null"}]}

Rules:
- Always produce between 4 and 7 steps. NEVER return just 1 or 2 steps, even if a single course in the list seems to match the goal perfectly - break the journey down into real stages instead (e.g. foundational concepts before the main topic, the main topic itself split into logical sub-stages, then practical application or next steps after it).
- Each step should represent a real, distinct stage of learning - a specific skill, sub-topic, or concept to focus on - not a vague restatement of the overall goal.
- Order steps from foundational to advanced.
- "reason" is a 1-sentence explanation of why this specific step fits the student's stated goal, referencing the step's actual content - not a generic sentence that could apply to any step.
- Use the exact course _id string as courseId ONLY when a step's actual content genuinely matches one of the provided courses. Many steps may have no matching course - use null in that case. Do not force a courseId onto a step just because one course is available; only attach it when the match is real.`;

const STOPWORDS = new Set(["the", "and", "for", "with", "your", "you", "learn", "learning", "introduction", "intro", "to", "of", "in", "on", "a", "an", "basics", "fundamentals", "essentials", "understanding", "course", "step"]);

function keywords(text) {
  return new Set(
    (text || "")
      .toLowerCase()
      .split(/[^a-z0-9+.#]+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  );
}

function sharesTopic(stepTitle, course) {
  const stepWords = keywords(stepTitle);
  const courseWords = new Set([...keywords(course.title), ...keywords(course.tag)]);
  for (const w of stepWords) if (courseWords.has(w)) return true;
  return false;
}

// POST /api/ai/learning-path  body: { goal }
// Creates a NEW saved path each time (not an overwrite) - every generation the student
// makes is kept as its own history entry, viewable again later from their Profile.
export const generateLearningPath = async (req, res, next) => {
  try {
    const { goal } = req.body;
    if (!goal) return res.status(400).json({ message: "goal is required" });

    const courses = await Course.find().select("_id title description tag").lean();
    const courseById = new Map(courses.map((c) => [String(c._id), c]));
    const courseList = courses.map((c) => `- id:${c._id} | ${c.title} (${c.tag}) - ${c.description}`).join("\n");

    const result = await generateJSON({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Student goal: "${goal}"\n\nAvailable courses:\n${courseList}`,
    });

    const roadmap = (result.roadmap || []).map((step) => {
      const candidate = step.courseId ? courseById.get(String(step.courseId)) : null;
      // Two checks before trusting Gemini's courseId: (1) it must be a real course we actually
      // sent it (prevents a CastError from a malformed/hallucinated ID), and (2) the step's topic
      // must genuinely share a keyword with that course's title/tag - this is what catches cases
      // like a "DevOps" step getting attached to an unrelated "Full Stack" course.
      const courseId = candidate && sharesTopic(step.title, candidate) ? step.courseId : null;
      return { title: step.title, reason: step.reason, courseId, status: "upcoming" };
    });

    let path = await LearningPath.create({ user: req.user._id, goal, roadmap });
    path = await path.populate("roadmap.courseId", "title tag");

    res.json(path);
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/learning-path - the most recently generated path, shown by default on the Learning Path page.
export const getMyLearningPath = async (req, res, next) => {
  try {
    const path = await LearningPath.findOne({ user: req.user._id }).sort({ createdAt: -1 }).populate("roadmap.courseId", "title tag");
    res.json(path || null);
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/learning-path/history - every path this student has ever generated, newest first.
// Used by the Profile page's Learning Path History list - deliberately lightweight (no roadmap detail).
export const getLearningPathHistory = async (req, res, next) => {
  try {
    const paths = await LearningPath.find({ user: req.user._id }).select("goal createdAt").sort({ createdAt: -1 }).lean();
    res.json(paths);
  } catch (err) {
    next(err);
  }
};

// GET /api/ai/learning-path/:id - a specific past path, so clicking a history entry
// in Profile can bring back exactly that roadmap, not just the most recent one.
export const getLearningPathById = async (req, res, next) => {
  try {
    const path = await LearningPath.findOne({ _id: req.params.id, user: req.user._id }).populate("roadmap.courseId", "title tag");
    if (!path) return res.status(404).json({ message: "Learning path not found" });
    res.json(path);
  } catch (err) {
    next(err);
  }
};

// Re-syncs step status against actual enrollment/completion state, for the most recent path.
export const refreshLearningPath = async (req, res, next) => {
  try {
    const path = await LearningPath.findOne({ user: req.user._id }).sort({ createdAt: -1 });
    if (!path) return res.status(404).json({ message: "No learning path yet" });

    for (const step of path.roadmap) {
      if (!step.courseId) continue;
      const enrollment = await Enrollment.findOne({ user: req.user._id, course: step.courseId });
      if (!enrollment) continue;
      const course = await Course.findById(step.courseId).select("lessons");
      const total = course?.lessons?.length || 0;
      if (total > 0 && enrollment.completedLessons.length >= total) step.status = "done";
      else if (enrollment.completedLessons.length > 0) step.status = "in-progress";
    }
    await path.save();
    await path.populate("roadmap.courseId", "title tag");
    res.json(path);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/ai/learning-path/:id - permanently removes one specific saved path from history.
// DELETE /api/ai/learning-path      - permanently removes the most recent path (the one shown
// by default on this page). Either way, this is a real delete, not a view-only clear - once
// gone, it won't reappear when navigating away and back, or when GET is called again.
export const deleteLearningPath = async (req, res, next) => {
  try {
    if (req.params.id) {
      const result = await LearningPath.deleteOne({ _id: req.params.id, user: req.user._id });
      if (result.deletedCount === 0) return res.status(404).json({ message: "Learning path not found" });
    } else {
      const path = await LearningPath.findOne({ user: req.user._id }).sort({ createdAt: -1 });
      if (path) await path.deleteOne();
    }
    res.json({ message: "Learning path cleared" });
  } catch (err) {
    next(err);
  }
};