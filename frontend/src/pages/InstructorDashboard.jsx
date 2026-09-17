import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCachedData } from "../hooks/useCachedData.js";
import { bannerFor } from "../utils/courseBanner.js";
import {
  Plus,
  BookOpen,
  Users,
  GraduationCap,
  Layers,
  LayoutGrid,
  List,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function InstructorDashboard() {
  const { user } = useAuth();
  const { data, loading } = useCachedData("instructor:mycourses", () => api.get("/courses/mine").then((res) => res.data));
  const courses = data?.courses || [];
  const stats = data?.stats;

  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [view, setView] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    let list = courses.filter((c) => {
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "AI-generated" && c.generatedBy === "ai") ||
        (activeFilter === "Manual" && c.generatedBy !== "ai");
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "Title") return a.title.localeCompare(b.title);
      if (sortBy === "Most students") return b.studentCount - a.studentCount;
      return new Date(b.createdAt) - new Date(a.createdAt); // Latest
    });
    return list;
  }, [courses, query, activeFilter, sortBy]);

  const statCards = stats
    ? [
        { label: "Total Courses", value: stats.totalCourses, icon: BookOpen, bg: "bg-violet-100", fg: "text-violet-600" },
        { label: "Total Students", value: stats.totalStudents, icon: Users, bg: "bg-emerald-100", fg: "text-emerald-600" },
        { label: "Total Enrollments", value: stats.totalEnrollments, icon: GraduationCap, bg: "bg-amber-100", fg: "text-amber-600" },
        { label: "Total Lessons", value: stats.totalLessons, icon: Layers, bg: "bg-blue-100", fg: "text-blue-600" },
      ]
    : [];

  return (
    <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">Welcome back, {user?.name?.split(" ")[0]}! 👋</p>
      <div className="flex items-start justify-between gap-4 flex-wrap mb-1">
        <h1 className="font-bold text-3xl text-slate-900">My Courses</h1>
        <Link
          to="/create-course"
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition shrink-0"
        >
          <Plus size={16} /> Create New Course
        </Link>
      </div>
      <p className="text-slate-500 text-sm mb-7">Manage and track your courses and student engagement.</p>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 h-[104px] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-5">
              <span className={`w-10 h-10 rounded-lg ${s.bg} ${s.fg} flex items-center justify-center mb-3`}>
                <s.icon size={18} />
              </span>
              <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Section header + controls */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-lg text-slate-900">Your Courses</h2>
        {!loading && courses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your courses…"
              className="w-44 sm:w-56 px-3 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="relative">
              <button
                onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
                className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                {activeFilter === "All" ? "All Courses" : activeFilter} <ChevronDown size={14} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                  {["All", "AI-generated", "Manual"].map((f) => (
                    <button
                      key={f}
                      onClick={() => { setActiveFilter(f); setFilterOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${activeFilter === f ? "text-indigo-600 font-medium" : "text-slate-600"}`}
                    >
                      {f === "All" ? "All Courses" : f}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
                className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Sort by: {sortBy} <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                  {["Latest", "Title", "Most students"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSortBy(s); setSortOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 ${sortBy === s ? "text-indigo-600 font-medium" : "text-slate-600"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-indigo-600 text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}>
                <LayoutGrid size={16} />
              </button>
              <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-indigo-600 text-white" : "bg-white text-slate-400 hover:bg-slate-50"}`}>
                <List size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && <SkeletonGrid />}

      {!loading && courses.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center bg-white">
          <p className="text-slate-500 text-sm mb-3">You haven't created any courses yet.</p>
          <Link to="/create-course" className="inline-flex items-center gap-1.5 bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700">
            <Plus size={15} /> Create your first course
          </Link>
        </div>
      )}

      {!loading && courses.length > 0 && filtered.length === 0 && (
        <div className="border border-slate-200 rounded-xl p-10 text-center bg-white text-slate-500 text-sm">
          No courses match "{query}"{activeFilter !== "All" ? ` in ${activeFilter}` : ""}.
          <button onClick={() => { setQuery(""); setActiveFilter("All"); }} className="block mx-auto mt-2 text-indigo-600 font-medium hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10" : "space-y-3 mb-10"}>
          {filtered.map((c) => (
            <CourseCard key={c._id} course={c} view={view} onClick={() => navigate(`/course/${c._id}`)} />
          ))}
        </div>
      )}

      {/* CTA banner */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 sm:p-7 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles size={22} />
          </span>
          <div>
            <p className="font-bold text-slate-900">Share your knowledge with the world</p>
            <p className="text-sm text-slate-500">Create high-quality courses and help students achieve their learning goals.</p>
          </div>
        </div>
        <Link to="/create-course" className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 shrink-0">
          Create New Course
        </Link>
      </div>
    </main>
  );
}

function CourseCard({ course: c, view, onClick }) {
  const banner = bannerFor(c.tag);
  const status = c.lessonCount > 0 ? "Published" : "Draft";

  if (view === "list") {
    return (
      <div
        onClick={onClick}
        className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-sm transition"
      >
        <span className={`w-14 h-14 rounded-lg overflow-hidden bg-gradient-to-br ${banner.gradient} text-white/80 flex items-center justify-center text-lg font-bold shrink-0`}>
          {c.thumbnail ? <img src={c.thumbnail} alt="" className="w-full h-full object-cover" /> : banner.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
              {status}
            </span>
          </div>
          <p className="font-semibold text-slate-900 truncate">{c.title}</p>
          <p className="text-xs text-slate-500">
            {c.studentCount} Students • {c.lessonCount} Lessons
          </p>
        </div>
        <Link to={`/course/${c._id}/students`} onClick={(e) => e.stopPropagation()} className="text-indigo-600 text-sm font-medium hover:underline shrink-0">
          View students →
        </Link>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-indigo-200 transition-all flex flex-col"
    >
      <div className={`relative h-32 bg-gradient-to-br ${banner.gradient} flex items-center justify-center overflow-hidden`}>
        {c.thumbnail && <img src={c.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${status === "Published" ? "bg-emerald-400/90 text-emerald-950" : "bg-amber-300/90 text-amber-950"}`}>
          {status}
        </span>
        {!c.thumbnail && <span className="text-white/60 text-3xl font-bold select-none">{banner.glyph}</span>}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 mb-1">{c.tag}</span>
        <p className="font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">{c.title}</p>
        <p className="text-xs text-slate-500 mb-3">
          {c.studentCount} Students • {c.lessonCount} Lessons
        </p>
        <Link
          to={`/course/${c._id}/students`}
          onClick={(e) => e.stopPropagation()}
          className="mt-auto text-xs font-medium text-indigo-600 hover:underline"
        >
          View students →
        </Link>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse">
          <div className="h-32 bg-slate-100" />
          <div className="p-4">
            <div className="h-2.5 w-14 bg-slate-100 rounded mb-2" />
            <div className="h-4 w-3/4 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}