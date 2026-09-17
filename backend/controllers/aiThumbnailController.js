import { generateImage } from "../services/geminiService.js";

// POST /api/ai/course-thumbnail  body: { title, description, tag }
// Generates a single cover image for a course from its title/description/tag and returns
// it as a data URL, ready to drop straight into the course's `thumbnail` field. Nothing is
// saved here - the instructor still has to save the course for it to stick, same as an
// uploaded image would.
export const generateCourseThumbnail = async (req, res, next) => {
  try {
    const { title, description, tag } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "A course title is required to generate an image." });
    }

    const prompt = `Create a flat, modern, abstract cover illustration for an online course.
Course title: "${title.trim()}"
Topic/category: "${(tag || "").trim() || "general"}"
${description ? `Course description: "${description.trim().slice(0, 300)}"` : ""}

Style: clean vector-style illustration, bold geometric shapes, a cohesive indigo/purple/blue color palette, subtle abstract icons or symbols related to the topic. No text, no words, no letters, no logos, no real brand marks, no photorealistic people. Widescreen 16:9 composition suitable for a course card thumbnail.`;

    const { mimeType, base64 } = await generateImage({ prompt });
    res.json({ thumbnail: `data:${mimeType};base64,${base64}` });
  } catch (err) {
    next(err);
  }
};