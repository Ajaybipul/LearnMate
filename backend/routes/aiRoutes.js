import express from "express";
import { tutorChat, getTutorHistory } from "../controllers/aiTutorController.js";
import { chatbotChat, getChatbotHistory } from "../controllers/chatbotController.js";
import { generateQuiz } from "../controllers/aiQuizController.js";
import { summarizeLesson } from "../controllers/aiSummaryController.js";
import { generateCourseThumbnail } from "../controllers/aiThumbnailController.js";
import {
  generateLearningPath,
  getMyLearningPath,
  getLearningPathHistory,
  getLearningPathById,
  refreshLearningPath,
  deleteLearningPath,
} from "../controllers/learningPathController.js";
import {
  estimateVideo,
  generateVideo,
  getVideoStatus,
  streamClip,
} from "../controllers/aiVideoController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/tutor", protect, tutorChat);
router.get("/tutor/history", protect, getTutorHistory);

router.post("/chatbot", protect, chatbotChat);
router.get("/chatbot/history", protect, getChatbotHistory);

router.post("/generate-quiz", protect, generateQuiz);

router.post("/summarize", protect, summarizeLesson);

router.post("/course-thumbnail", protect, requireRole("instructor", "admin"), generateCourseThumbnail);

router.post("/learning-path", protect, generateLearningPath);
router.get("/learning-path", protect, getMyLearningPath);
router.get("/learning-path/history", protect, getLearningPathHistory);
router.post("/learning-path/refresh", protect, refreshLearningPath);
router.delete("/learning-path", protect, deleteLearningPath);
router.get("/learning-path/:id", protect, getLearningPathById);
router.delete("/learning-path/:id", protect, deleteLearningPath);

// AI video generation (Veo) - instructor-only, explicit opt-in, cost shown upfront
router.post("/video/estimate", protect, requireRole("instructor", "admin"), estimateVideo);
router.post("/video/generate", protect, requireRole("instructor", "admin"), generateVideo);
router.get("/video/status/:jobId", protect, getVideoStatus);
router.get("/video/stream/:jobId/:clipIndex", protect, streamClip);

export default router;