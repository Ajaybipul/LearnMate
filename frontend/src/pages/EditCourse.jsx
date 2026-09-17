import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import ThumbnailInput from "../components/ThumbnailInput.jsx";
import { Plus, X, Loader2 } from "lucide-react";

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", description: "", tag: "" });
  const [thumbnail, setThumbnail] = useState("");
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/courses/${id}`).then((res) => {
      const c = res.data;
      setForm({ title: c.title, description: c.description, tag: c.tag });
      setThumbnail(c.thumbnail || "");
      setLessons(c.lessons.map((l) => ({ title: l.title, content: l.content, duration: l.duration || "", videoUrl: l.videoUrl || "" })));
      setLoading(false);
    });
  }, [id]);

  const updateLesson = (i, field, value) => {
    setLessons((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLesson = () => setLessons((ls) => [...ls, { title: "", content: "", duration: "", videoUrl: "" }]);
  const removeLesson = (i) => setLessons((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.description.trim() || lessons.some((l) => !l.title.trim() || !l.content.trim())) {
      setError("Course title, description, and every lesson's title + content are required.");
      return;
    }
    setBusy(true);
    try {
      await api.put(`/courses/${id}`, { ...form, thumbnail, lessons });
      navigate(`/course/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save changes");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8">
        <div className="h-8 w-48 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-64 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">Edit course</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-6">{form.title}</h1>

      <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-7 space-y-5">
        {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3.5 py-2">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Course title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tag / category</label>
            <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} placeholder="e.g. Design"
              className="mt-1 w-full border border-slate-200 rounded-lg px-3.5 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <ThumbnailInput value={thumbnail} onChange={setThumbnail} title={form.title} description={form.description} tag={form.tag} />

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lessons</span>
            <button type="button" onClick={addLesson} className="flex items-center gap-1 text-indigo-600 text-xs font-semibold hover:underline">
              <Plus size={13} /> Add lesson
            </button>
          </div>
          <div className="space-y-3">
            {lessons.map((l, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400 font-medium">Lesson {i + 1}</span>
                  {lessons.length > 1 && (
                    <button type="button" onClick={() => removeLesson(i)} className="flex items-center gap-1 text-red-600 text-xs hover:underline">
                      <X size={12} /> Remove
                    </button>
                  )}
                </div>
                <input placeholder="Lesson title" value={l.title} onChange={(e) => updateLesson(i, "title", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea placeholder="Lesson content / transcript" rows={4} value={l.content} onChange={(e) => updateLesson(i, "content", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Duration (e.g. 6:40)" value={l.duration} onChange={(e) => updateLesson(i, "duration", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input placeholder="Video URL (YouTube/Drive/Vimeo/mp4)" value={l.videoUrl} onChange={(e) => updateLesson(i, "videoUrl", e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button disabled={busy} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
            {busy && <Loader2 size={15} className="animate-spin" />}
            {busy ? "Saving…" : "Save changes"}
          </button>
          <button type="button" onClick={() => navigate(`/course/${id}`)} className="border border-slate-200 rounded-lg px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}