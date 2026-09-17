import express from "express";
import {
  getCourses,
  getCourseById,
  createCourse,
  generateCourse,
  getMyCourses,
  getCourseStudents,
  enrollInCourse,
  markLessonComplete,
  getMyEnrollment,
  updateCourseDetails,
  setLessonVideo,
} from "../controllers/courseController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Specific routes before the "/:id" catch-all
router.get("/mine", protect, requireRole("instructor", "admin"), getMyCourses);
router.post("/generate", protect, requireRole("instructor", "admin"), generateCourse);

router.get("/", protect, getCourses);
router.get("/:id", protect, getCourseById);
router.post("/", protect, requireRole("instructor", "admin"), createCourse);
router.put("/:id", protect, requireRole("instructor", "admin"), updateCourseDetails);
router.post("/:id/enroll", protect, enrollInCourse);
router.post("/:id/complete-lesson", protect, markLessonComplete);
router.get("/:id/enrollment", protect, getMyEnrollment);
router.get("/:id/students", protect, requireRole("instructor", "admin"), getCourseStudents);
router.put("/:id/lessons/:lessonIndex/video", protect, requireRole("instructor", "admin"), setLessonVideo);

export default router;