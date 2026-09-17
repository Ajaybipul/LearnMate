import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import { generateCourseContent } from "../services/courseGenService.js";

export const getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find().select("title description tag thumbnail lessons instructor createdAt").lean();
    const shaped = courses.map((c) => ({
      ...c,
      lessonCount: c.lessons.length,
      lessons: undefined,
    }));
    res.json(shaped);
  } catch (err) {
    next(err);
  }
};

export const getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    next(err);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const { title, description, tag, thumbnail, lessons } = req.body;
    if (!title || !description || !lessons?.length) {
      return res.status(400).json({ message: "title, description and at least one lesson are required" });
    }
    const course = await Course.create({
      title,
      description,
      tag,
      thumbnail,
      lessons,
      instructor: req.user._id,
      generatedBy: "manual",
    });
    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

// POST /api/courses/generate  body: { name }
// The AI course-creation path: instructor supplies ONLY a course name, Gemini generates
// everything else, and it's saved immediately - no manual review step, per requirements.
export const generateCourse = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "A course topic is required" });

    const generated = await generateCourseContent(name.trim());

    const course = await Course.create({
      title: generated.title,
      description: generated.description,
      tag: generated.tag,
      lessons: generated.lessons,
      instructor: req.user._id,
      generatedBy: "ai",
    });

    res.status(201).json(course);
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/mine - courses authored by the logged-in instructor, plus aggregate stats
export const getMyCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .select("title description tag lessons generatedBy createdAt thumbnail")
      .lean();

    const courseIds = courses.map((c) => c._id);
    const enrollments = await Enrollment.find({ course: { $in: courseIds } }).select("user course").lean();

    const countByCourse = new Map();
    for (const e of enrollments) {
      const key = String(e.course);
      countByCourse.set(key, (countByCourse.get(key) || 0) + 1);
    }

    const shaped = courses.map((c) => ({
      ...c,
      lessonCount: c.lessons.length,
      studentCount: countByCourse.get(String(c._id)) || 0,
      lessons: undefined,
    }));

    const stats = {
      totalCourses: courses.length,
      totalStudents: new Set(enrollments.map((e) => String(e.user))).size,
      totalEnrollments: enrollments.length,
      totalLessons: courses.reduce((sum, c) => sum + c.lessons.length, 0),
    };

    res.json({ courses: shaped, stats });
  } catch (err) {
    next(err);
  }
};

// GET /api/courses/:id/students - enrolled students + progress, for the instructor who owns the course
export const getCourseStudents = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only the course's instructor can view this" });
    }

    const enrollments = await Enrollment.find({ course: course._id }).populate("user", "name email");
    const totalLessons = course.lessons.length;
    const students = enrollments.map((e) => ({
      user: { id: e.user._id, name: e.user.name, email: e.user.email },
      completed: e.completedLessons.length,
      total: totalLessons,
      progressPct: totalLessons ? Math.round((e.completedLessons.length / totalLessons) * 100) : 0,
    }));

    res.json({ course: { id: course._id, title: course.title }, students });
  } catch (err) {
    next(err);
  }
};

export const enrollInCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    let enrollment = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (!enrollment) {
      enrollment = await Enrollment.create({ user: req.user._id, course: course._id });
    }
    res.status(201).json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const markLessonComplete = async (req, res, next) => {
  try {
    const { lessonIndex } = req.body;
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.id });
    if (!enrollment) return res.status(404).json({ message: "Not enrolled in this course" });

    if (!enrollment.completedLessons.includes(lessonIndex)) {
      enrollment.completedLessons.push(lessonIndex);
    }
    enrollment.lastLessonIndex = lessonIndex;
    await enrollment.save();
    res.json(enrollment);
  } catch (err) {
    next(err);
  }
};

export const getMyEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.id });
    res.json(enrollment || null);
  } catch (err) {
    next(err);
  }
};

// PUT /api/courses/:id  body: { title?, description?, tag? }
// Lets the instructor who owns this course edit its title (and optionally description/tag)
// after creation - useful since AI-generated titles may need a human touch-up.
export const updateCourseDetails = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only this course's instructor can edit it" });
    }

    const { title, description, tag, thumbnail, lessons } = req.body;
    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ message: "Title cannot be empty" });
      course.title = title.trim();
    }
    if (description !== undefined) course.description = description.trim();
    if (tag !== undefined) course.tag = tag.trim();
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (lessons !== undefined) {
      if (!Array.isArray(lessons) || lessons.length === 0) {
        return res.status(400).json({ message: "A course needs at least one lesson" });
      }
      if (lessons.some((l) => !l.title?.trim() || !l.content?.trim())) {
        return res.status(400).json({ message: "Every lesson needs a title and content" });
      }
      // Replace wholesale rather than merge by index, since lessons may be reordered/added/removed.
      // Preserves each existing lesson's video fields when its content is unchanged by matching on title;
      // any genuinely new lesson just starts with no video, same as course creation.
      course.lessons = lessons.map((l) => {
        const existing = course.lessons.find((old) => old.title === l.title);
        return {
          title: l.title.trim(),
          content: l.content.trim(),
          duration: l.duration || "",
          videoUrl: l.videoUrl !== undefined ? l.videoUrl.trim() : existing?.videoUrl || "",
          videoStatus: l.videoUrl ? "ready" : existing?.videoStatus || "none",
        };
      });
    }

    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
};

// PUT /api/courses/:id/lessons/:lessonIndex/video  body: { videoUrl }
// Lets the instructor who owns this course manually set/edit/clear a lesson's video link
// (YouTube, Vimeo, or a direct .mp4 URL) - works for both manual and AI-generated courses.
export const setLessonVideo = async (req, res, next) => {
  try {
    const { videoUrl } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (String(course.instructor) !== String(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only this course's instructor can edit its videos" });
    }

    const lesson = course.lessons[req.params.lessonIndex];
    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    lesson.videoUrl = (videoUrl || "").trim();
    lesson.videoStatus = lesson.videoUrl ? "ready" : "none";

    await course.save();
    res.json(course);
  } catch (err) {
    next(err);
  }
};