// Run with: node scripts/seed.js
// Creates a demo instructor account, then generates starter courses using the SAME
// AI course-generation path instructors use in the app (services/courseGenService.js).
// Nothing in this project's course content is hand-written anymore - even the seed
// data is produced by Gemini, just from a short list of course names below.

import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { generateCourseContent } from "../services/courseGenService.js";

dotenv.config();

const STARTER_COURSE_NAMES = [
  "Foundations of Machine Learning",
  "Public Speaking Essentials",
];

const run = async () => {
  await connectDB();

  let instructor = await User.findOne({ email: "instructor@learnmade.ai" });
  if (!instructor) {
    instructor = await User.create({
      name: "Demo Instructor",
      email: "instructor@learnmade.ai",
      password: "password123",
      role: "instructor",
    });
    console.log("Created demo instructor: instructor@learnmade.ai / password123");
  }

  await Course.deleteMany({ instructor: instructor._id });

  for (const name of STARTER_COURSE_NAMES) {
    console.log(`Generating course via Gemini: "${name}"...`);
    try {
      const generated = await generateCourseContent(name);
      await Course.create({
        title: generated.title,
        description: generated.description,
        tag: generated.tag,
        lessons: generated.lessons,
        instructor: instructor._id,
        generatedBy: "ai",
      });
      console.log(`  done - ${generated.lessons.length} lessons generated.`);
    } catch (err) {
      console.error(`  FAILED to generate "${name}": ${err.message}`);
      console.error("  Check that GEMINI_API_KEY is set correctly in your .env file.");
    }
  }

  console.log("Seed complete.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
