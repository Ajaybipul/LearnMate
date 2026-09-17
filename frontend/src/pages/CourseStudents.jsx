import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api.js";
import { ArrowLeft } from "lucide-react";

export default function CourseStudents() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get(`/courses/${id}/students`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load"));
  }, [id]);

  if (error) return <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8 text-red-600 text-sm">{error}</main>;
  if (!data) {
    return (
      <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8">
        <div className="h-6 w-32 bg-slate-100 rounded animate-pulse mb-6" />
        <div className="h-48 bg-white border border-slate-200 rounded-xl animate-pulse" />
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-5 lg:px-8 py-8">
      <Link to="/instructor" className="flex items-center gap-1.5 w-fit text-xs font-medium text-indigo-600 hover:underline">
        <ArrowLeft size={13} /> Back to my courses
      </Link>
      <p className="text-indigo-600 font-semibold text-sm mt-4 mb-1">Enrollment</p>
      <h1 className="font-bold text-3xl text-slate-900 mb-8">{data.course.title}</h1>

      {data.students.length === 0 && (
        <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center bg-white text-slate-500 text-sm">No students enrolled yet.</div>
      )}

      <div className="space-y-2.5">
        {data.students.map((s, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">{s.user.name}</p>
              <p className="text-[11px] text-slate-400">{s.user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px] text-slate-500">{s.completed}/{s.total} lessons</span>
              <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.progressPct}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}