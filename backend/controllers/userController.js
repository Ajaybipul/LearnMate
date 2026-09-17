import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import { QuizAttempt } from "../models/Quiz.js";
import LearningPath from "../models/LearningPath.js";

// GET /api/users/profile - one aggregated view of everything about the user.
// Shape differs by role: students see their learning activity, instructors see what they teach.
export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const baseUser = { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, goals: user.goals, joined: user.createdAt };

    if (user.role === "instructor" || user.role === "admin") {
      const courses = await Course.find({ instructor: user._id }).select("title tag generatedBy lessons").lean();

      const coursesWithCounts = await Promise.all(
        courses.map(async (c) => ({
          id: c._id,
          title: c.title,
          tag: c.tag,
          generatedBy: c.generatedBy,
          lessonCount: c.lessons.length,
          studentCount: await Enrollment.countDocuments({ course: c._id }),
        }))
      );

      const totalStudents = coursesWithCounts.reduce((sum, c) => sum + c.studentCount, 0);
      const aiGeneratedCount = coursesWithCounts.filter((c) => c.generatedBy === "ai").length;

      return res.json({
        user: baseUser,
        instructorStats: {
          totalCourses: coursesWithCounts.length,
          totalStudents,
          aiGeneratedCount,
          manualCount: coursesWithCounts.length - aiGeneratedCount,
        },
        courses: coursesWithCounts,
      });
    }

    // Student view
    const enrollments = await Enrollment.find({ user: req.user._id }).populate("course", "title tag lessons");
    const enrolledCourses = enrollments.map((e) => ({
      course: { id: e.course._id, title: e.course.title, tag: e.course.tag },
      completed: e.completedLessons.length,
      total: e.course.lessons.length,
      progressPct: e.course.lessons.length ? Math.round((e.completedLessons.length / e.course.lessons.length) * 100) : 0,
    }));

    // Populate quiz -> course so we can show which lesson/course each attempt was actually for,
    // instead of just a bare date and score.
    const attemptDocs = await QuizAttempt.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: "quiz", select: "course lessonIndex", populate: { path: "course", select: "title lessons" } });

    const attempts = attemptDocs.map((a) => {
      const course = a.quiz?.course;
      const lessonTitle = course?.lessons?.[a.quiz?.lessonIndex]?.title || "Untitled lesson";
      return {
        id: a._id,
        score: a.score,
        total: a.total,
        createdAt: a.createdAt,
        lessonTitle,
        courseTitle: course?.title || "Unknown course",
      };
    });

    const learningPath = await LearningPath.findOne({ user: req.user._id });

    res.json({
      user: baseUser,
      enrolledCourses,
      quizAttempts: attempts,
      learningPathGoal: learningPath?.goal || null,
    });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, goals } = req.body;
    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (goals !== undefined) user.goals = goals;
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, bio: user.bio, goals: user.goals });
  } catch (err) {
    next(err);
  }
};