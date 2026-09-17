import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { streamPost } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CheckCircle2, Pencil, Loader2, ArrowRight, Play, X, Send } from "lucide-react";

export default function CoursePlayer() {
  const { id } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [checkingEnrollment, setCheckingEnrollment] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [lessonIdx, setLessonIdx] = useState(0);
  const [tab, setTab] = useState("tutor");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [savingTitle, setSavingTitle] = useState(false);
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  const reloadCourse = () => api.get(`/courses/${id}`).then((res) => setCourse(res.data));

  const saveTitle = async () => {
    if (!titleInput.trim()) return;
    setSavingTitle(true);
    try {
      await api.put(`/courses/${id}`, { title: titleInput.trim() });
      await reloadCourse();
      setEditingTitle(false);
    } finally {
      setSavingTitle(false);
    }
  };

  useEffect(() => {
    reloadCourse();
    if (!isInstructor) {
      setCheckingEnrollment(true);
      api
        .get(`/courses/${id}/enrollment`)
        .then((res) => setEnrollment(res.data))
        .finally(() => setCheckingEnrollment(false));
    } else {
      setCheckingEnrollment(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const enrollNow = async () => {
    setEnrolling(true);
    try {
      const res = await api.post(`/courses/${id}/enroll`);
      setEnrollment(res.data);
    } finally {
      setEnrolling(false);
    }
  };

  const markComplete = async () => {
    const res = await api.post(`/courses/${id}/complete-lesson`, { lessonIndex: lessonIdx });
    setEnrollment(res.data);
  };

  if (!course || (!isInstructor && checkingEnrollment)) {
    return (
      <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
        <div className="h-8 w-64 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-[500px] bg-white border border-slate-200 rounded-xl animate-pulse" />
      </main>
    );
  }

  // Students must explicitly enroll before they can access lessons / tutor / quiz content.
  if (!isInstructor && !enrollment) {
    return (
      <main className="max-w-2xl mx-auto px-5 py-16">
        <div className="border border-slate-200 rounded-2xl bg-white p-8 text-center shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 mb-2 block">{course.tag}</span>
          <h1 className="font-bold text-2xl text-slate-900 mb-2">{course.title}</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-5 max-w-md mx-auto">{course.description}</p>
          <p className="text-[11px] text-slate-400 mb-6">{course.lessons.length} lessons</p>
          <button
            onClick={enrollNow}
            disabled={enrolling}
            className="bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
          >
            {enrolling ? "Enrolling…" : "Enroll in this course"}
          </button>
        </div>
      </main>
    );
  }

  const lesson = course.lessons[lessonIdx];
  const done = enrollment?.completedLessons?.includes(lessonIdx);
  const completedCount = enrollment?.completedLessons?.length || 0;
  const progressPct = course.lessons.length ? Math.round((completedCount / course.lessons.length) * 100) : 0;

  return (
    <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 mb-1 block">{course.tag}</span>
      {isInstructor && editingTitle ? (
        <div className="flex gap-2 items-center mb-1">
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            autoFocus
            className="font-bold text-2xl text-slate-900 border border-slate-200 rounded-lg px-2.5 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={saveTitle} disabled={savingTitle} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {savingTitle ? "Saving…" : "Save"}
          </button>
          <button onClick={() => setEditingTitle(false)} className="text-slate-400 text-xs hover:text-slate-700">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-1 group">
          <h1 className="font-bold text-2xl text-slate-900">{course.title}</h1>
          {isInstructor && (
            <button
              onClick={() => { setTitleInput(course.title); setEditingTitle(true); }}
              className="flex items-center gap-1 text-slate-400 text-xs opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition"
              title="Edit title"
            >
              <Pencil size={11} /> edit
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-3 mb-4">
        <p className="text-slate-500 text-sm max-w-lg">{course.description}</p>
        {isInstructor && (
          <Link
            to={`/course/${id}/edit`}
            className="shrink-0 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            Edit course
          </Link>
        )}
      </div>

      {!isInstructor && (
        <div className="mb-6 max-w-lg">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-slate-500">{completedCount} of {course.lessons.length} lessons complete</span>
            <span className="text-[11px] text-indigo-600 font-semibold">{progressPct}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_340px] border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm min-h-[600px]">
        {/* Lesson rail */}
        <div className="border-r border-slate-200 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 px-5 pb-3">Lessons</div>
          {course.lessons.map((l, i) => {
            const isDone = enrollment?.completedLessons?.includes(i);
            return (
              <div
                key={i}
                onClick={() => setLessonIdx(i)}
                className={`flex gap-3 items-start px-5 py-2.5 cursor-pointer border-l-2 transition ${
                  i === lessonIdx ? "border-indigo-500 bg-indigo-50" : "border-transparent hover:bg-slate-50"
                }`}
              >
                <span className={`text-[11px] pt-0.5 font-medium ${i === lessonIdx || isDone ? "text-indigo-600" : "text-slate-400"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] leading-snug text-slate-700">
                  {l.title} {isDone && <CheckCircle2 size={12} className="inline text-emerald-500 ml-0.5 -mt-0.5" />}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stage */}
        <div className="p-8 border-r border-slate-200 lg:border-r-0">
          <VideoPane
            course={course}
            lesson={lesson}
            lessonIdx={lessonIdx}
            isInstructor={isInstructor}
            onUpdated={reloadCourse}
          />
          <div className="mt-5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Lesson {String(lessonIdx + 1).padStart(2, "0")}</div>
            <h2 className="font-bold text-xl text-slate-900 mt-1 mb-2">{lesson.title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg">{lesson.content}</p>
          </div>
          <div className="mt-5 flex gap-2">
            {!isInstructor && (
              <button onClick={markComplete} className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-indigo-700 transition">
                {done && <CheckCircle2 size={14} />} {done ? "Completed" : "Mark lesson complete"}
              </button>
            )}
            {lessonIdx < course.lessons.length - 1 && (
              <button onClick={() => setLessonIdx(lessonIdx + 1)} className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-4 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition">
                Next lesson <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Margin rail */}
        <div className="border-t lg:border-t-0 border-slate-200 flex flex-col">
          <div className="flex border-b border-slate-200">
            {["tutor", "quiz", "summary"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-center py-3 text-[11px] font-semibold uppercase tracking-wide border-b-2 transition ${
                  tab === t ? "text-indigo-600 border-indigo-500" : "text-slate-400 border-transparent hover:text-slate-600"
                }`}
              >
                {t === "tutor" ? "AI Tutor" : t === "quiz" ? "Quiz" : "Summary"}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            {tab === "tutor" && <TutorPanel courseId={id} lessonIdx={lessonIdx} lessonTitle={lesson.title} />}
            {tab === "quiz" && <QuizPanel courseId={id} lessonIdx={lessonIdx} />}
            {tab === "summary" && <SummaryPanel courseId={id} lessonIdx={lessonIdx} />}
          </div>
        </div>
      </div>
    </main>
  );
}

function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  // Google Drive share links (e.g. .../file/d/FILE_ID/view?usp=sharing) embed via /preview.
  // Requires the file's sharing permission to be "Anyone with the link can view" -
  // a private/restricted file will show Google's permission-denied screen instead, which
  // is a Drive setting on the instructor's end, not something this code can control.
  const drive = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
  if (drive) return `https://drive.google.com/file/d/${drive[1]}/preview`;
  return null; // treat as a direct file URL instead
}

function VideoTitleOverlay({ lessonIdx, total, title }) {
  return (
    <div className="absolute top-0 left-0 right-0 px-4 py-3 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
        Lesson {lessonIdx + 1} of {total}
      </span>
      <h3 className="text-white text-[15px] font-semibold leading-tight mt-0.5 truncate pr-6">{title}</h3>
    </div>
  );
}

function VideoPane({ course, lesson, lessonIdx, isInstructor, onUpdated }) {
  const [showEstimate, setShowEstimate] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [jobId, setJobId] = useState(lesson.videoJobId || null);
  const [status, setStatus] = useState(lesson.videoStatus || "none");
  const [clips, setClips] = useState([]);
  const [clipIdx, setClipIdx] = useState(0);
  const [videoError, setVideoError] = useState("");
  const [editing, setEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(lesson.videoUrl || "");
  const [saving, setSaving] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    setStatus(lesson.videoStatus || "none");
    setJobId(lesson.videoJobId || null);
    setClips([]);
    setClipIdx(0);
    setShowEstimate(false);
    setVideoError("");
    setEditing(false);
    setUrlInput(lesson.videoUrl || "");
    return () => clearInterval(pollRef.current);
  }, [lesson, lessonIdx]);

  useEffect(() => {
    if (status !== "generating" || !jobId) return;
    pollRef.current = setInterval(async () => {
      const res = await api.get(`/ai/video/status/${jobId}`);
      if (res.data.status !== "generating") {
        clearInterval(pollRef.current);
        setStatus(res.data.status);
        if (res.data.status === "ready") {
          setClips(res.data.clips.filter((c) => c.status === "ready"));
        }
        if (res.data.status === "failed") {
          setVideoError(res.data.error || "Video generation failed for an unknown reason - check the backend terminal logs.");
        }
        onUpdated?.();
      }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [status, jobId]);

  const openEstimate = async () => {
    const res = await api.post("/ai/video/estimate", { courseId: course._id, lessonIndex: lessonIdx });
    setEstimate(res.data);
    setShowEstimate(true);
  };

  const confirmGenerate = async () => {
    setShowEstimate(false);
    setStatus("generating");
    const res = await api.post("/ai/video/generate", { courseId: course._id, lessonIndex: lessonIdx });
    setJobId(res.data.jobId);
  };

  const saveVideoUrl = async () => {
    setSaving(true);
    try {
      await api.put(`/courses/${course._id}/lessons/${lessonIdx}/video`, { videoUrl: urlInput.trim() });
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const clearVideoUrl = async () => {
    setSaving(true);
    try {
      await api.put(`/courses/${course._id}/lessons/${lessonIdx}/video`, { videoUrl: "" });
      setUrlInput("");
      setEditing(false);
      onUpdated?.();
    } finally {
      setSaving(false);
    }
  };

  const embedUrl = getEmbedUrl(lesson.videoUrl);

  // Instructor edit bar - always available, regardless of what's currently showing
  const editBar = isInstructor && (
    <div className="mt-2">
      {!editing ? (
        <button onClick={() => setEditing(true)} className="text-xs font-medium text-indigo-600 hover:underline">
          {lesson.videoUrl ? "Edit video link" : "+ Add a video link"}
        </button>
      ) : (
        <div className="flex gap-2 items-center">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a YouTube, Google Drive, Vimeo, or direct .mp4 link"
            className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={saveVideoUrl} disabled={saving} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
          {lesson.videoUrl && (
            <button onClick={clearVideoUrl} disabled={saving} className="text-red-600 text-xs hover:underline">Remove</button>
          )}
          <button onClick={() => { setEditing(false); setUrlInput(lesson.videoUrl || ""); }} className="text-slate-400 text-xs hover:text-slate-700">Cancel</button>
        </div>
      )}
    </div>
  );

  // 1. Manual real video link takes priority if one exists
  if (lesson.videoUrl) {
    return (
      <div>
        <div className="bg-slate-900 aspect-video rounded-lg overflow-hidden relative shadow-lg">
          {embedUrl ? (
            <iframe src={embedUrl} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen title={lesson.title} />
          ) : (
            <video src={lesson.videoUrl} controls className="w-full h-full" />
          )}
          <VideoTitleOverlay lessonIdx={lessonIdx} total={course.lessons.length} title={lesson.title} />
        </div>
        {editBar}
      </div>
    );
  }

  // 2. AI-generated video ready - play chained clips sequentially
  if (status === "ready" && (clips.length > 0 || jobId)) {
    return (
      <div>
        <div className="bg-slate-900 aspect-video rounded-lg overflow-hidden relative shadow-lg">
          <video
            key={clipIdx}
            src={`${api.defaults.baseURL}/ai/video/stream/${jobId}/${clipIdx}`}
            controls
            autoPlay
            className="w-full h-full"
            onEnded={() => setClipIdx((i) => i + 1)}
          />
          <VideoTitleOverlay lessonIdx={lessonIdx} total={course.lessons.length} title={lesson.title} />
          <span className="absolute bottom-3 left-4 text-[11px] text-white/50">AI-generated video</span>
        </div>
        {editBar}
      </div>
    );
  }

  // 3. Generating - show progress
  if (status === "generating") {
    return (
      <div>
        <div className="bg-slate-900 aspect-video rounded-lg flex flex-col items-center justify-center gap-2 text-white/70 relative shadow-lg">
          <VideoTitleOverlay lessonIdx={lessonIdx} total={course.lessons.length} title={lesson.title} />
          <Loader2 size={26} className="animate-spin text-white/60" />
          <span className="text-[11px]">Generating AI video… this can take a few minutes</span>
        </div>
        {editBar}
      </div>
    );
  }

  // 4. None/failed - placeholder. Manual video link is the primary action here;
  // AI generation (Veo) is kept as a secondary, clearly experimental option since it
  // requires paid billing and separate Google access approval that not every account has.
  return (
    <div>
      <div className="bg-slate-900 aspect-video rounded-lg flex flex-col items-center justify-center gap-3 relative shadow-lg">
        <VideoTitleOverlay lessonIdx={lessonIdx} total={course.lessons.length} title={lesson.title} />
        <div className="w-14 h-14 rounded-full bg-white/10 border border-white/30 flex items-center justify-center">
          <Play size={20} className="text-white ml-0.5" fill="currentColor" />
        </div>
        <span className="text-[11px] text-white/50">{lesson.duration || "no video yet"}</span>
        {status === "failed" && (
          <span className="text-red-400 text-xs max-w-xs text-center px-4">
            AI video generation failed: {videoError || "unknown error - check backend terminal logs"}
          </span>
        )}
        {isInstructor && !editing && !showEstimate && (
          <div className="flex flex-col items-center gap-1.5">
            <button onClick={() => setEditing(true)} className="bg-white text-slate-900 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-slate-100">
              Add a video link
            </button>
            <button onClick={openEstimate} className="text-white/50 text-[11px] hover:text-white/80 underline">
              or try AI-generated video (experimental, paid)
            </button>
          </div>
        )}
        {isInstructor && showEstimate && estimate && (
          <div className="bg-white rounded-lg p-4 text-slate-900 text-xs max-w-xs text-center space-y-2">
            <p>
              ~{estimate.totalSeconds}s video ({estimate.clipCount} clips), estimated cost{" "}
              <span className="font-semibold">${estimate.estimatedCostUsd}</span>. Requires Veo billing/access enabled on your Google account.
              {estimate.note && <span className="block text-slate-400 mt-1">{estimate.note}</span>}
            </p>
            <div className="flex gap-2 justify-center">
              <button onClick={confirmGenerate} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 font-semibold hover:bg-indigo-700">Confirm & generate</button>
              <button onClick={() => setShowEstimate(false)} className="border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        )}
      </div>
      {isInstructor && editing && (
        <div className="mt-2">
          <div className="flex gap-2 items-center">
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a YouTube, Google Drive, Vimeo, or direct .mp4 link"
              autoFocus
              className="flex-1 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[12.5px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={saveVideoUrl} disabled={saving} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setEditing(false)} className="text-slate-400 text-xs hover:text-slate-700">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function TutorPanel({ courseId, lessonIdx, lessonTitle }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    api
      .get(`/ai/tutor/history`, { params: { courseId, lessonIndex: lessonIdx } })
      .then((res) => setMessages(res.data.map((m) => ({ role: m.role, content: m.content }))));
  }, [courseId, lessonIdx]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "model", content: "" }]);
    setBusy(true);
    try {
      let acc = "";
      await streamPost("/ai/tutor", { courseId, lessonIndex: lessonIdx, message: text }, (chunk) => {
        acc += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "model", content: acc };
          return copy;
        });
      });
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "model", content: "I'm having trouble connecting right now — try again in a moment." };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div ref={logRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[420px]">
        {messages.length === 0 && (
          <div className="bg-indigo-50 rounded-lg px-3 py-2.5 text-[13px] leading-relaxed text-slate-700">
            <span className="block text-[10px] font-semibold uppercase text-indigo-600 mb-0.5">Tutor</span>
            Ask me anything about "{lessonTitle}" — I can explain it differently, give an example, or check your understanding.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-[13px] leading-relaxed ${m.role === "model" ? "bg-indigo-50 rounded-lg px-3 py-2.5 text-slate-700" : "text-slate-800"}`}>
            <span className={`block text-[10px] font-semibold uppercase mb-0.5 ${m.role === "user" ? "text-slate-400" : "text-indigo-600"}`}>
              {m.role === "user" ? "You" : "Tutor"}
            </span>
            {m.content || "…"}
          </div>
        ))}
      </div>
      <div className="flex gap-2 p-3.5 border-t border-slate-200">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about this lesson…"
          className="flex-1 border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={send} className="bg-indigo-600 text-white rounded-lg w-9 flex items-center justify-center hover:bg-indigo-700 transition shrink-0">
          <Send size={14} />
        </button>
      </div>
    </>
  );
}

function QuizPanel({ courseId, lessonIdx }) {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    setQuiz(null);
    setQIdx(0);
    setScore(0);
    setAnswered(false);
    setSelected(null);
  }, [courseId, lessonIdx]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/generate-quiz", { courseId, lessonIndex: lessonIdx });
      setQuiz(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!quiz) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-slate-500">Generate a quiz from this lesson's content using AI.</p>
        <button onClick={generate} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Generating…" : "Generate quiz"}
        </button>
      </div>
    );
  }

  if (qIdx >= quiz.questions.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center px-6">
        <span className="text-xs text-slate-400">Quiz complete</span>
        <span className="font-bold text-2xl text-slate-900">{score} / {quiz.questions.length}</span>
        <button onClick={() => { setQIdx(0); setScore(0); setAnswered(false); setSelected(null); }} className="border border-slate-200 rounded-lg px-4 py-2 text-[13px] mt-2 text-slate-700 hover:bg-slate-50">
          Retake quiz
        </button>
      </div>
    );
  }

  const q = quiz.questions[qIdx];

  const choose = async (i) => {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    const correct = i === q.correctIndex;
    if (correct) setScore((s) => s + 1);
    try {
      await api.post(`/quiz/${quiz._id}/attempt`, { answers: [i] });
    } catch {}
  };

  return (
    <div className="p-4 overflow-y-auto max-h-[484px]">
      <div className="flex justify-between text-[11px] text-slate-400 mb-3">
        <span>Question {qIdx + 1} of {quiz.questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <div className="text-[14px] font-semibold text-slate-900 mb-3 leading-snug">{q.question}</div>
      <div>
        {q.options.map((o, i) => {
          let cls = "border-slate-200 bg-white";
          if (answered && i === q.correctIndex) cls = "border-emerald-400 bg-emerald-50";
          else if (answered && i === selected) cls = "border-red-300 bg-red-50";
          return (
            <div key={i} onClick={() => choose(i)} className={`flex items-center gap-2.5 border rounded-lg px-2.5 py-2 mb-2 text-[13px] text-slate-700 cursor-pointer transition ${cls}`}>
              <span className={`w-3.5 h-3.5 rounded-sm border shrink-0 ${selected === i ? "bg-indigo-500 border-indigo-500" : "border-slate-300"}`} />
              {o}
            </div>
          );
        })}
      </div>
      {answered && (
        <>
          <div className={`text-[12.5px] mt-2 p-2.5 rounded-lg ${selected === q.correctIndex ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {selected === q.correctIndex ? "Correct. " : "Not quite. "}{q.explanation}
          </div>
          <button onClick={() => { setQIdx(qIdx + 1); setAnswered(false); setSelected(null); }} className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-[13px] mt-3 hover:bg-indigo-700 transition">
            {qIdx + 1 < quiz.questions.length ? "Next question" : "See results"} <ArrowRight size={13} />
          </button>
        </>
      )}
    </div>
  );
}

function SummaryPanel({ courseId, lessonIdx }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => setSummary(null), [courseId, lessonIdx]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await api.post("/ai/summarize", { courseId, lessonIndex: lessonIdx });
      setSummary(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-slate-500">Generate an AI summary and flashcards for this lesson.</p>
        <button onClick={generate} disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Summarizing…" : "Generate summary"}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto max-h-[484px] space-y-5">
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Key points</div>
        <ul className="space-y-1.5">
          {summary.keyPoints.map((k, i) => (
            <li key={i} className="text-[13px] leading-relaxed text-slate-700 flex gap-2">
              <span className="text-indigo-500">•</span>{k}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-2">Flashcards</div>
        <div className="space-y-2">
          {summary.flashcards.map((f, i) => (
            <Flashcard key={i} q={f.question} a={f.answer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Flashcard({ q, a }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <div onClick={() => setFlipped((f) => !f)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-[13px] text-slate-700 cursor-pointer bg-white hover:border-indigo-300 transition">
      <span className="block text-[10px] font-semibold uppercase text-slate-400 mb-1">{flipped ? "Answer" : "Question"}</span>
      {flipped ? a : q}
    </div>
  );
}