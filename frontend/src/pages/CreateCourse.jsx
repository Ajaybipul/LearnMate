import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import ThumbnailInput from "../components/ThumbnailInput.jsx";
import { Sparkles, PenSquare, CheckCircle2, Loader2, Plus, X } from "lucide-react";

export default function CreateCourse() {
  const [mode, setMode] = useState("ai");
  const navigate = useNavigate();

  return (
    <main className="max-w-3xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">New course</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-6">Create a course</h1>

      <div className="flex border border-slate-200 rounded-lg overflow-hidden mb-8 w-fit bg-white">
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition ${mode === "ai" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Sparkles size={14} /> Generate with AI
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold transition ${mode === "manual" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <PenSquare size={14} /> Build manually
        </button>
      </div>

      {mode === "ai" ? <AiMode navigate={navigate} /> : <ManualMode navigate={navigate} />}
    </main>
  );
}

function AiMode({ navigate }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [course, setCourse] = useState(null); // set once generated - switches this component into review mode

  const generate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await api.post("/courses/generate", { name });
      setCourse(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Generation failed - check your Gemini API key is set up correctly.");
    } finally {
      setBusy(false);
    }
  };

  if (course) {
    return <VideoReviewStep course={course} onDone={() => navigate(`/course/${course._id}`)} />;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-7">
      <p className="text-sm text-slate-600 mb-5 max-w-md">
        Type a topic — even just a word or two, like "react js" or "docker." AI will write a proper course title, description, category, and every lesson's full content automatically. Right after, you'll get a chance to add a real video link per lesson — AI can't generate those, so this is the quickest place to drop them in.
      </p>
      <form onSubmit={generate} className="space-y-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Course topic</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "react js", "docker", or "negotiation skills"'
            className="mt-1 w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-[11px] text-slate-400 mt-1">You don't need to write a full title — AI will turn this into one.</p>
        </div>
        {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3.5 py-2">{error}</p>}
        <button disabled={busy} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? "Generating course…" : "Generate course"}
        </button>
        {busy && <p className="text-xs text-slate-400">This can take 10-20 seconds — Gemini is writing the title and every lesson.</p>}
      </form>
    </div>
  );
}

// Shown right after AI generates a course. Lets the instructor drop a real video
// link into each lesson before moving on - replaces the icon placeholder immediately
// instead of leaving every lesson video-less until edited later inside the course.
function VideoReviewStep({ course, onDone }) {
  const [urls, setUrls] = useState(course.lessons.map((l) => l.videoUrl || ""));
  const [savedIdx, setSavedIdx] = useState({});
  const [saving, setSaving] = useState({});

  const save = async (i) => {
    setSaving((s) => ({ ...s, [i]: true }));
    try {
      await api.put(`/courses/${course._id}/lessons/${i}/video`, { videoUrl: urls[i].trim() });
      setSavedIdx((s) => ({ ...s, [i]: true }));
    } finally {
      setSaving((s) => ({ ...s, [i]: false }));
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-7">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 size={19} className="text-emerald-500" />
        <h2 className="font-bold text-lg text-slate-900">"{course.title}" generated</h2>
      </div>
      <p className="text-sm text-slate-600 mb-5">
        {course.lessons.length} lessons are ready with full AI-written content. Add a video link for any lesson now, or skip and add them later from the course page — either way works.
      </p>

      <div className="space-y-3 mb-6">
        {course.lessons.map((lesson, i) => (
          <div key={i} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-900">{i + 1}. {lesson.title}</span>
              {savedIdx[i] && urls[i] && <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 size={12} /> saved</span>}
            </div>
            <div className="flex gap-2">
              <input
                value={urls[i]}
                onChange={(e) => {
                  const next = [...urls];
                  next[i] = e.target.value;
                  setUrls(next);
                  setSavedIdx((s) => ({ ...s, [i]: false }));
                }}
                placeholder="Paste a YouTube, Google Drive, Vimeo, or direct .mp4 link (optional)"
                className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => save(i)}
                disabled={saving[i] || !urls[i].trim()}
                className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-40"
              >
                {saving[i] ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onDone} className="bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition">
        Done — go to course
      </button>
    </div>
  );
}

function ManualMode({ navigate }) {
  const [form, setForm] = useState({ title: "", description: "", tag: "" });
  const [thumbnail, setThumbnail] = useState("");
  const [lessons, setLessons] = useState([{ title: "", content: "", duration: "", videoUrl: "" }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const updateLesson = (i, field, value) => {
    setLessons((ls) => ls.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)));
  };
  const addLesson = () => setLessons((ls) => [...ls, { title: "", content: "", duration: "", videoUrl: "" }]);
  const removeLesson = (i) => setLessons((ls) => ls.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.title || !form.description || lessons.some((l) => !l.title || !l.content)) {
      setError("Course title, description, and every lesson's title + content are required.");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/courses", { ...form, thumbnail, lessons });
      navigate(`/course/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setBusy(false);
    }
  };

  return (
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
              <textarea placeholder="Lesson content / transcript" rows={3} value={l.content} onChange={(e) => updateLesson(i, "content", e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Duration (e.g. 6:40)" value={l.duration} onChange={(e) => updateLesson(i, "duration", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <input placeholder="Video URL (YouTube/Vimeo/mp4)" value={l.videoUrl} onChange={(e) => updateLesson(i, "videoUrl", e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <button disabled={busy} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
        {busy && <Loader2 size={15} className="animate-spin" />}
        {busy ? "Creating…" : "Create course"}
      </button>
    </form>
  );
}