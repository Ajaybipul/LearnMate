import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { useCachedData } from "../hooks/useCachedData.js";
import { BookOpen, Users, Layers, TrendingUp, Pencil, X } from "lucide-react";

export default function Profile() {
  const { data, loading, setData } = useCachedData("profile:data", () => api.get("/users/profile").then((res) => res.data));
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: "", goals: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({ bio: data.user.bio || "", goals: data.user.goals || "" });
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      setData((d) => ({ ...d, user: { ...d.user, ...form } }));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8">
        <div className="h-8 w-40 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-40 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      </main>
    );
  }

  const { user } = data;
  const isInstructor = user.role === "instructor" || user.role === "admin";

  if (isInstructor) {
    return (
      <main className="max-w-5xl mx-auto px-5 lg:px-8 py-8">
        <h1 className="font-bold text-3xl text-slate-900 mb-6">Profile</h1>
        <InstructorProfilePanel
          user={user}
          stats={data.instructorStats}
          courses={data.courses}
          editing={editing}
          setEditing={setEditing}
          form={form}
          setForm={setForm}
          saving={saving}
          save={save}
        />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">Your profile</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-6">{user.name}</h1>

      <div className="mb-8">
        <StudentIdentityPanel user={user} editing={editing} setEditing={setEditing} form={form} setForm={setForm} saving={saving} save={save} />
      </div>

      <StudentActivity data={data} />
    </main>
  );
}

function EditButton({ editing, setEditing }) {
  return (
    <button onClick={() => setEditing((e) => !e)} className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
      {editing ? <><X size={12} /> Cancel</> : <><Pencil size={12} /> Edit</>}
    </button>
  );
}

function StudentIdentityPanel({ user, editing, setEditing, form, setForm, saving, save }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 block mb-3">Details</span>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-semibold shrink-0">
            {user.name?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
        </div>
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full mt-3">{user.role}</span>
        <p className="text-[11px] text-slate-400 mt-2">Joined {new Date(user.joined).toLocaleDateString()}</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">About</span>
          <EditButton editing={editing} setEditing={setEditing} />
        </div>
        {editing ? (
          <div className="space-y-2">
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="A short bio…"
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
            <input
              value={form.goals}
              onChange={(e) => setForm({ ...form, goals: e.target.value })}
              placeholder="Your learning goals…"
              className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={save} disabled={saving} className="bg-indigo-600 text-white rounded-lg px-3 py-1.5 text-[12px] font-semibold w-full hover:bg-indigo-700 disabled:opacity-60">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <>
            <p className="text-[13px] text-slate-600 mb-2">{user.bio || "No bio yet."}</p>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Goals</p>
            <p className="text-[13px] text-slate-600">{user.goals || "Not set."}</p>
          </>
        )}
      </div>
    </div>
  );
}

function InstructorProfilePanel({ user, stats, courses, editing, setEditing, form, setForm, saving, save }) {
  const totalLessons = courses.reduce((sum, c) => sum + c.lessonCount, 0);
  const avgStudents = stats.totalCourses ? Math.round((stats.totalStudents / stats.totalCourses) * 10) / 10 : 0;
  const mostRecent = courses.length
    ? [...courses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
      {/* Identity card */}
      <div className="bg-gradient-to-b from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-6 text-center md:text-left">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-2xl font-semibold mb-4 mx-auto md:mx-0 shadow-sm">
          {user.name?.slice(0, 2).toUpperCase()}
        </div>
        <p className="font-bold text-lg leading-tight text-slate-900">{user.name}</p>
        <p className="text-xs text-slate-500 mt-1 break-all">{user.email}</p>
        <span className="inline-block mt-3 text-[10px] font-semibold uppercase tracking-wide text-white bg-indigo-600 px-2 py-1 rounded-full">
          Instructor
        </span>
        <p className="text-[11px] text-slate-400 mt-3">Joined {new Date(user.joined).toLocaleDateString()}</p>
      </div>

      {/* Right side: teaching context + editable about */}
      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-sm text-slate-600 mb-4">
            Teaching <span className="font-semibold text-indigo-600">{stats.totalCourses}</span> {stats.totalCourses === 1 ? "course" : "courses"} to{" "}
            <span className="font-semibold text-indigo-600">{stats.totalStudents}</span> {stats.totalStudents === 1 ? "student" : "students"} —{" "}
            {stats.aiGeneratedCount} generated with AI, {stats.manualCount} built manually.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <StatBlock icon={Layers} value={totalLessons} label="Total lessons" />
            <StatBlock icon={TrendingUp} value={avgStudents} label="Avg. students/course" />
            <div className="min-w-0">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
                <BookOpen size={15} />
              </span>
              <p className="font-semibold text-sm text-slate-900 truncate" title={mostRecent?.title}>{mostRecent?.title || "—"}</p>
              <p className="text-[10px] font-semibold uppercase text-slate-400">Most recent course</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">About</span>
            <EditButton editing={editing} setEditing={setEditing} />
          </div>
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="A short bio…"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-slate-400">What you teach</label>
                <input
                  value={form.goals}
                  onChange={(e) => setForm({ ...form, goals: e.target.value })}
                  placeholder="e.g. Web development, data science…"
                  className="mt-1 w-full border border-slate-200 rounded-lg px-2.5 py-2 text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button onClick={save} disabled={saving} className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-indigo-700 disabled:opacity-60">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">Bio</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{user.bio || "No bio yet — add one so students know who's teaching them."}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400 mb-1">What you teach</p>
                <p className="text-[13px] text-slate-600">{user.goals || "Not set yet."}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBlock({ icon: Icon, value, label }) {
  return (
    <div>
      <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5">
        <Icon size={15} />
      </span>
      <p className="font-semibold text-lg text-slate-900">{value}</p>
      <p className="text-[10px] font-semibold uppercase text-slate-400">{label}</p>
    </div>
  );
}

function StudentActivity({ data }) {
  const { enrolledCourses, quizAttempts } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <section>
        <h2 className="font-bold text-lg text-slate-900 mb-3">Courses</h2>
        {enrolledCourses.length === 0 && <p className="text-sm text-slate-400">No enrollments yet.</p>}
        <div className="space-y-2.5">
          {enrolledCourses.map((e, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-900 truncate">{e.course.title}</p>
              <p className="text-[11px] text-slate-400 mb-2">{e.completed}/{e.total} lessons complete</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${e.progressPct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-bold text-lg text-slate-900 mb-3">Recent quiz attempts</h2>
        {quizAttempts.length === 0 && <p className="text-sm text-slate-400">No quiz attempts yet.</p>}
        <div className="space-y-2">
          {quizAttempts.map((a) => (
            <div key={a.id} className="flex justify-between items-center border-b border-slate-100 py-2.5 text-sm gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{a.lessonTitle}</p>
                <p className="text-[11px] text-slate-400 truncate">{a.courseTitle} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <span className="font-semibold text-slate-900 shrink-0">{a.score} / {a.total}</span>
            </div>
          ))}
        </div>
      </section>

      <LearningPathHistorySection />
    </div>
  );
}

function LearningPathHistorySection() {
  const { data: history, loading } = useCachedData("profile:pathhistory", () => api.get("/ai/learning-path/history").then((res) => res.data));

  return (
    <section>
      <h2 className="font-bold text-lg text-slate-900 mb-3">Learning path history</h2>
      {loading && !history && <p className="text-sm text-slate-400">Loading…</p>}
      {history?.length === 0 && <p className="text-sm text-slate-400">No learning paths generated yet.</p>}
      {history?.length > 0 && (
        <div className="space-y-2">
          {history.map((h) => (
            <Link
              key={h._id}
              to={`/learning-path/${h._id}`}
              className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm hover:bg-slate-50 -mx-2 px-2 rounded-lg transition"
            >
              <span className="font-semibold text-slate-900 truncate pr-3">{h.goal}</span>
              <span className="text-[11px] text-slate-400 shrink-0">{new Date(h.createdAt).toLocaleDateString()}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}