import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "model"], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const aiChatSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["tutor", "chatbot"], required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    lessonIndex: { type: Number, default: null },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export default mongoose.model("AiChat", aiChatSchema);
