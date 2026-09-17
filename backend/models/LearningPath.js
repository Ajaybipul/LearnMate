import mongoose from "mongoose";

const stepSchema = new mongoose.Schema({
  title: { type: String, required: true },
  reason: { type: String, default: "" },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
  status: { type: String, enum: ["upcoming", "in-progress", "done"], default: "upcoming" },
});

const learningPathSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    goal: { type: String, required: true },
    roadmap: [stepSchema],
  },
  { timestamps: true }
);

// Non-unique index - a student can now have many saved paths over time, not just one.
learningPathSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("LearningPath", learningPathSchema);