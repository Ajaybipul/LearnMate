import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCachedData } from "../hooks/useCachedData.js";
import { bannerFor } from "../utils/courseBanner.js";
import {
  Search,
  X,
  BookOpen,
  CheckCircle2,
  Layers,
  TrendingUp,
  LayoutGrid,
  List,
  ChevronDown,
  Route as RouteIcon,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading } = useCachedData("dashboard:data", () =>
    Promise.all([api.get("/courses"), api.get("/users/profile")]).then(([coursesRes, profileRes]) => ({
      courses: coursesRes.data,
      enrolledCourses: profileRes.data.enrolledCourses || [],
    }))
  );
  const courses = data?.courses || [];
  const enrolledCourses = data?.enrolledCourses || [];
  const enrolledById = useMemo(() => new Map(enrolledCourses.map((e) => [e.course.id, e])), [enrolledCourses]);

  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [view, setView] = useState("grid");
  const [sortOpen, setSortOpen] = useState(false);
  const navigate = useNavigate();

  const tags = useMemo(() => ["All", ...new Set(courses.map((c) => c.tag).filter(Boolean))], [courses]);

  const filtered = useMemo(() => {
    let list = courses.filter((c) => {
      const matchesTag = activeTag === "All" || c.tag === activeTag;
      const q = query.trim().toLowerCase();
      const matchesQuery = !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "Title") return a.title.localeCompare(b.title);
      if (sortBy === "Most lessons") return b.lessonCount - a.lessonCount;
      return new Date(b.createdAt) - new Date(a.createdAt); // Latest
    });
    return list;
  }, [courses, query, activeTag, sortBy]);

  const stats = useMemo(() => {
    const completedCourses = enrolledCourses.filter((e) => e.total > 0 && e.completed >= e.total).length;
    const lessonsCompleted = enrolledCourses.reduce((sum, e) => sum + e.completed, 0);
    const avgProgress = enrolledCourses.length
      ? Math.round(enrolledCourses.reduce((sum, e) => sum + e.progressPct, 0) / enrolledCourses.length)
      : 0;
    return { enrolled: enrolledCourses.length, completedCourses, lessonsCompleted, avgProgress };
  }, [enrolledCourses]);

  const statCards = [
    { label: "Enrolled Courses", value: stats.enrolled, icon: BookOpen, bg: "bg-indigo-100", fg: "text-indigo-600" },
    { label: "Completed Courses", value: stats.completedCourses, icon: CheckCircle2, bg: "bg-emerald-100", fg: "text-emerald-600" },
    { label: "Lessons Completed", value: stats.lessonsCompleted, icon: Layers, bg: "bg-blue-100", fg: "text-blue-600" },
    { label: "Avg. Progress", value: `${stats.avgProgress}%`, icon: TrendingUp, bg: "bg-amber-100", fg: "text-amber-600" },
  ];

  return (
    <main className="max-w-7xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">Welcome back, {user?.name?.split(" ")[0]}! 👋</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-1">My Learning</h1>
      <p className="text-slate-500 text-sm mb-7">Pick up where you left off, or explore something new.</p>

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
        <h2 className="font-bold text-lg text-slate-900">Browse Courses</h2>
        {!loading && courses.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses…"
                className="w-44 sm:w-56 pl-9 pr-8 py-2 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setSortOpen((v) => !v)}
                className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Sort by: {sortBy} <ChevronDown size={14} />
              </button>
              {sortOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10">
                  {["Latest", "Title", "Most lessons"].map((s) => (
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

      {!loading && tags.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-6">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                activeTag === t ? "bg-indigo-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && <SkeletonGrid />}

      {!loading && courses.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center bg-white text-slate-500 text-sm">
          No courses yet. Run <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">node scripts/seed.js</code> in the backend to add demo courses.
        </div>
      )}

      {!loading && courses.length > 0 && filtered.length === 0 && (
        <div className="border border-slate-200 rounded-xl p-10 text-center bg-white text-slate-500 text-sm">
          No courses match "{query}"{activeTag !== "All" ? ` in ${activeTag}` : ""}.
          <button onClick={() => { setQuery(""); setActiveTag("All"); }} className="block mx-auto mt-2 text-indigo-600 font-medium hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10" : "space-y-3 mb-10"}>
          {filtered.map((c) => (
            <CourseCard key={c._id} course={c} enrollment={enrolledById.get(c._id)} view={view} onClick={() => navigate(`/course/${c._id}`)} />
          ))}
        </div>
      )}

      {/* CTA banner */}
      <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-6 sm:p-7 flex items-center justify-between gap-6 flex-wrap">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <RouteIcon size={22} />
          </span>
          <div>
            <p className="font-bold text-slate-900">Not sure what to learn next?</p>
            <p className="text-sm text-slate-500">Tell the AI your goal and get a personalized, ordered roadmap.</p>
          </div>
        </div>
        <button
          onClick={() => navigate("/learning-path")}
          className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50 shrink-0"
        >
          Build my learning path
        </button>
      </div>
    </main>
  );
}

function CourseCard({ course: c, enrollment, view, onClick }) {
  const banner = bannerFor(c.tag);
  const isEnrolled = !!enrollment;
  const isComplete = isEnrolled && enrollment.total > 0 && enrollment.completed >= enrollment.total;

  const StatusBadge = () =>
    !isEnrolled ? null : (
      <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${isComplete ? "bg-emerald-100 text-emerald-700" : "bg-indigo-100 text-indigo-700"}`}>
        {isComplete ? "Completed" : `${enrollment.progressPct}% done`}
      </span>
    );

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
            <StatusBadge />
          </div>
          <p className="font-semibold text-slate-900 truncate">{c.title}</p>
          <p className="text-xs text-slate-500">{c.lessonCount} Lessons</p>
        </div>
        <span className="text-indigo-600 text-sm font-medium shrink-0">{isEnrolled ? "Continue →" : "View course →"}</span>
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
        {isEnrolled && (
          <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${isComplete ? "bg-emerald-400/90 text-emerald-950" : "bg-white/90 text-indigo-700"}`}>
            {isComplete ? "Completed" : `${enrollment.progressPct}% done`}
          </span>
        )}
        {!c.thumbnail && <span className="text-white/60 text-3xl font-bold select-none">{banner.glyph}</span>}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500 mb-1">{c.tag}</span>
        <p className="font-semibold text-slate-900 leading-snug mb-1 line-clamp-2">{c.title}</p>
        <p className="text-xs text-slate-500 mb-3">{c.lessonCount} Lessons</p>
        {isEnrolled && !isComplete && (
          <div className="w-full h-1.5 bg-slate-100 rounded-full mb-3 overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${enrollment.progressPct}%` }} />
          </div>
        )}
        <span className="mt-auto text-xs font-medium text-indigo-600">{isEnrolled ? "Continue →" : "View course →"}</span>
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