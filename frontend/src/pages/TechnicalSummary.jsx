import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import { Plus, BookOpen, Users, Sparkles, PenSquare, Star } from "lucide-react";

export default function TechnicalSummary() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/users/profile").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8">
        <div className="h-8 w-56 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />)}
        </div>
      </main>
    );
  }

  const { instructorStats: stats, courses } = data;
  const topCourseId = courses.length && Math.max(...courses.map((c) => c.studentCount)) > 0
    ? courses.reduce((top, c) => (c.studentCount > top.studentCount ? c : top)).id
    : null;

  const aiCourses = courses.filter((c) => c.generatedBy === "ai").sort((a, b) => b.studentCount - a.studentCount);
  const manualCourses = courses.filter((c) => c.generatedBy !== "ai").sort((a, b) => b.studentCount - a.studentCount);

  return (
    <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <p className="text-indigo-600 font-semibold text-sm mb-1">Instructor</p>
          <h1 className="font-bold text-3xl text-slate-900">Technical Summary</h1>
        </div>
        <Link to="/create-course" className="flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 shrink-0 transition">
          <Plus size={15} /> Create course
        </Link>
      </div>

      <div className="space-y-6">
        <section>
          <h2 className="font-bold text-lg text-slate-900 mb-3">Teaching summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Courses" value={stats.totalCourses} icon={BookOpen} bg="bg-violet-100" fg="text-violet-600" />
            <StatCard label="Total students" value={stats.totalStudents} icon={Users} bg="bg-emerald-100" fg="text-emerald-600" />
            <StatCard label="AI-generated" value={stats.aiGeneratedCount} icon={Sparkles} bg="bg-indigo-100" fg="text-indigo-600" />
            <StatCard label="Manual" value={stats.manualCount} icon={PenSquare} bg="bg-blue-100" fg="text-blue-600" />
          </div>
        </section>

        <CourseListSection
          title="AI-Generated Courses"
          emptyText="No AI-generated courses yet."
          emptyCta="Generate a course with AI"
          emptyLink="/create-course"
          courses={aiCourses}
          topCourseId={topCourseId}
          badgeClass="bg-indigo-100 text-indigo-700"
          badgeLabel="AI-generated"
        />

        <CourseListSection
          title="Manual Courses"
          emptyText="No manually-created courses yet."
          emptyCta="Create a course manually"
          emptyLink="/create-course"
          courses={manualCourses}
          topCourseId={topCourseId}
          badgeClass="bg-blue-100 text-blue-700"
          badgeLabel="Manual"
        />
      </div>
    </main>
  );
}

// Shared structure for both the AI-generated and Manual course lists, so they stay
// visually identical to each other - same row layout, same empty state pattern.
function CourseListSection({ title, emptyText, emptyCta, emptyLink, courses, topCourseId, badgeClass, badgeLabel }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-lg text-slate-900">{title}</h2>
        {courses.length > 0 && <span className="text-[11px] text-slate-400">sorted by students</span>}
      </div>

      {courses.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-white">
          <p className="text-sm text-slate-500 mb-3">{emptyText}</p>
          <Link to={emptyLink} className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700 transition">
            <Plus size={14} /> {emptyCta}
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {courses.map((c) => (
            <Link
              key={c.id}
              to={`/course/${c.id}/students`}
              className="block bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.title}</p>
                    {c.id === topCourseId && (
                      <span className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                        <Star size={9} fill="currentColor" /> Most popular
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-400">{c.tag} · {c.lessonCount} lessons</span>
                    <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${badgeClass}`}>{badgeLabel}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-2xl text-indigo-600">{c.studentCount}</span>
                  <p className="text-[10px] font-semibold uppercase text-slate-400">{c.studentCount === 1 ? "student" : "students"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value, icon: Icon, bg, fg }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
      <span className={`w-9 h-9 rounded-lg ${bg} ${fg} flex items-center justify-center mx-auto mb-2`}>
        <Icon size={16} />
      </span>
      <div className="font-bold text-2xl text-slate-900">{value}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-1">{label}</div>
    </div>
  );
}