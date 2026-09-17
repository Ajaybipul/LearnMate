import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api.js";
import { Route as RouteIcon, Loader2, RotateCcw, RefreshCw } from "lucide-react";

export default function LearningPath() {
  const { id } = useParams(); // present only when viewing a specific past path from history
  const navigate = useNavigate();
  const [path, setPath] = useState(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    setFetching(true);
    const url = id ? `/ai/learning-path/${id}` : "/ai/learning-path";
    api
      .get(url)
      .then((res) => setPath(res.data))
      .catch(() => setError(id ? "That saved learning path couldn't be found." : ""))
      .finally(() => setFetching(false));
  }, [id]);

  const generate = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/ai/learning-path", { goal });
      setPath(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't build a learning path right now - please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh: permanently deletes the path currently on screen (the specific history entry
  // if you're viewing one, otherwise your most recent path) and returns to the initial
  // "build a path" screen. Because it's a real delete, switching pages and coming back -
  // or reloading - will NOT bring it back. Older history entries (if any) are untouched.
  const refresh = async () => {
    setClearing(true);
    setError("");
    setActionMsg("");
    try {
      await api.delete(id ? `/ai/learning-path/${id}` : "/ai/learning-path");
      if (id) {
        navigate("/learning-path");
      } else {
        setPath(null);
        setGoal("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't clear this learning path right now - please try again.");
    } finally {
      setClearing(false);
    }
  };

  // Update progress: re-syncs each step's status (upcoming/in-progress/done) against real enrollment data.
  const updateProgress = async () => {
    setRefreshing(true);
    setError("");
    setActionMsg("");
    try {
      const res = await api.post("/ai/learning-path/refresh");
      setPath(res.data);
      setActionMsg("Progress synced.");
      setTimeout(() => setActionMsg(""), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't update progress right now - please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
      <p className="text-indigo-600 font-semibold text-sm mb-1">Personalized roadmap</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-2">Your learning path</h1>
      <p className="text-slate-500 text-sm mb-7 max-w-lg">
        Tell the AI what you're trying to learn or achieve, and it'll build an ordered roadmap of what to follow — with matching courses recommended alongside it.
      </p>

      <form onSubmit={generate} className="flex gap-2 mb-10 max-w-2xl">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder='e.g. "I want to get comfortable with ML fundamentals for a career switch"'
          className="flex-1 border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button disabled={loading} className="flex items-center gap-2 bg-indigo-600 text-white rounded-lg px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap transition">
          {loading && <Loader2 size={15} className="animate-spin" />}
          {loading ? "Building…" : path ? "Regenerate" : "Build my path"}
        </button>
      </form>

      {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3.5 py-2.5 mb-6 max-w-2xl">{error}</p>}
      {actionMsg && <p className="text-emerald-600 text-xs font-medium mb-6">{actionMsg}</p>}

      {fetching && (
        <div className="space-y-3 max-w-2xl">
          <div className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
          <div className="h-16 bg-white border border-slate-200 rounded-xl animate-pulse" />
        </div>
      )}

      {path && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
          {/* Left: the roadmap itself - what to follow, in order. No course links mixed in here. */}
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-y-2">
              <div>
                <p className="text-sm text-slate-600">
                  Goal: <span className="text-slate-900 font-medium">{path.goal}</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {id ? "Viewing a saved path from " : "Generated "}
                  {new Date(path.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={refresh} disabled={clearing} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-60">
                  <RotateCcw size={13} /> {clearing ? "clearing…" : "refresh"}
                </button>
                {!id && (
                  <button onClick={updateProgress} disabled={refreshing} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline disabled:opacity-60">
                    <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} /> {refreshing ? "updating…" : "update progress"}
                  </button>
                )}
              </div>
            </div>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-4">
              {path.roadmap.map((step, i) => (
                <div key={i} className="relative">
                  <span
                    className={`absolute -left-[29px] top-1 w-3 h-3 rounded-full border-2 ${
                      step.status === "done" ? "bg-emerald-500 border-emerald-500" : step.status === "in-progress" ? "bg-amber-400 border-amber-400" : "bg-white border-slate-300"
                    }`}
                  />
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-[15px] text-slate-900">
                        <span className="text-slate-400 text-xs mr-1.5">{i + 1}.</span>
                        {step.title}
                      </h3>
                      <span
                        className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0 ml-2 ${
                          step.status === "done"
                            ? "bg-emerald-100 text-emerald-700"
                            : step.status === "in-progress"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {step.status}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-600">{step.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right (stacks below on mobile): courses from our catalog that match this path */}
          <RecommendedCourses roadmap={path.roadmap} />
        </div>
      )}

      {!fetching && !path && (
        <div className="border border-dashed border-slate-300 rounded-xl p-10 text-center bg-white text-slate-500 text-sm max-w-2xl flex flex-col items-center gap-2">
          <span className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1">
            <RouteIcon size={18} />
          </span>
          No learning path yet — describe your goal above to generate one.
        </div>
      )}
    </main>
  );
}

// Pulls the unique set of real courses referenced anywhere in the roadmap and
// presents them as recommendations, separate from the step-by-step roadmap itself.
function RecommendedCourses({ roadmap }) {
  const seen = new Set();
  const courses = [];
  for (const step of roadmap) {
    const course = step.courseId;
    if (!course || typeof course !== "object") continue; // unpopulated / no match found
    const id = course._id;
    if (seen.has(id)) continue;
    seen.add(id);
    courses.push(course);
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 lg:sticky lg:top-24">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3">Recommended courses</div>
      {courses.length === 0 ? (
        <p className="text-[13px] text-slate-500">
          No matching courses in the catalog yet for this goal — the roadmap above still shows what to learn, even without a course to link to yet.
        </p>
      ) : (
        <div className="space-y-2.5">
          {courses.map((c) => (
            <Link
              key={c._id}
              to={`/course/${c._id}`}
              className="block border border-slate-200 rounded-lg p-3 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40 transition"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">{c.tag}</span>
              <p className="text-[13px] font-semibold text-slate-900 leading-snug mt-0.5">{c.title}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}