import mongoose from "mongoose";

const clipSchema = new mongoose.Schema({
  index: { type: Number, required: true },
  prompt: { type: String, required: true },
  operationName: { type: String, default: "" }, // Veo long-running operation name, used to poll
  status: { type: String, enum: ["pending", "generating", "ready", "failed"], default: "pending" },
  fileUri: { type: String, default: "" }, // Google-hosted file URI, streamed through our backend proxy
  error: { type: String, default: "" }, // the actual error message from Google, so failures are debuggable
});

const videoJobSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lessonIndex: { type: Number, required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["generating", "ready", "failed"], default: "generating" },
    estimatedCostUsd: { type: Number, default: 0 },
    clips: [clipSchema],
    error: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("VideoJob", videoJobSchema);