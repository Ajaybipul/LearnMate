import { useRef, useState } from "react";
import api from "../services/api.js";
import { ImagePlus, Sparkles, X, Loader2 } from "lucide-react";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB - keeps the stored document size reasonable, since
// there's no separate file storage/CDN in this app - the image is stored as a data URL
// directly on the course document.

export default function ThumbnailInput({ value, onChange, title, description, tag }) {
  const inputRef = useRef(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleFile = (file) => {
    setError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image is too large - please use one under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.onerror = () => setError("Couldn't read that file - please try again.");
    reader.readAsDataURL(file);
  };

  const generateWithAI = async () => {
    if (!title?.trim()) {
      setError("Add a course title first, so the AI knows what to illustrate.");
      return;
    }
    setError("");
    setGenerating(true);
    try {
      const res = await api.post("/ai/course-thumbnail", { title, description, tag });
      onChange(res.data.thumbnail);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't generate an image right now - please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Course image</label>
      <div className="mt-1.5 flex items-start gap-4">
        <div className="w-32 h-24 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
          {generating ? (
            <Loader2 size={20} className="text-indigo-500 animate-spin" />
          ) : value ? (
            <img src={value} alt="Course thumbnail preview" className="w-full h-full object-cover" />
          ) : (
            <ImagePlus size={20} className="text-slate-300" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={generateWithAI}
              disabled={generating}
              className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
            >
              <Sparkles size={13} /> {generating ? "Generating…" : "Generate with AI"}
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={generating}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
            >
              {value ? "Change image" : "Upload image"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="flex items-center gap-1 text-xs text-red-600 hover:underline"
              >
                <X size={13} /> Remove
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            Generate one from your course title, or upload a PNG/JPG up to 2MB. Optional — courses without one show a colored cover instead.
          </p>
          {error && <p className="text-[11px] text-red-600">{error}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}