import mongoose from "mongoose";

const flashcardSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const aiSummarySchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonIndex: { type: Number, required: true },
    keyPoints: [{ type: String }],
    flashcards: [flashcardSchema],
  },
  { timestamps: true }
);

aiSummarySchema.index({ course: 1, lessonIndex: 1 }, { unique: true });

export default mongoose.model("AiSummary", aiSummarySchema);
