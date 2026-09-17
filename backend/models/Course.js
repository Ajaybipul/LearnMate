import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  // instructor/AI-authored notes/transcript - the text source every AI feature reads from
  content: { type: String, required: true },
  duration: { type: String, default: "" },

  // Manual courses: a real pasted video link (YouTube/Vimeo/direct file).
  videoUrl: { type: String, default: "" },

  // AI-generated video (Veo) support - opt-in, per lesson.
  videoStatus: { type: String, enum: ["none", "generating", "ready", "failed"], default: "none" },
  videoJobId: { type: mongoose.Schema.Types.ObjectId, ref: "VideoJob", default: null },
});

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    tag: { type: String, default: "General" },
    thumbnail: { type: String, default: "" },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    generatedBy: { type: String, enum: ["ai", "manual"], default: "manual" },
    lessons: [lessonSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Course", courseSchema);
