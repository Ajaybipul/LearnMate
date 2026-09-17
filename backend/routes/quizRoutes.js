import express from "express";
import { submitAttempt } from "../controllers/aiQuizController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:quizId/attempt", protect, submitAttempt);

export default router;
