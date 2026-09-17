import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { GraduationCap, Loader2 } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shrink-0">
            <GraduationCap size={20} />
          </span>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            Learn<span className="text-orange-500">Made</span>
          </span>
        </Link>

        <form onSubmit={submit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-7 space-y-4">
          <div className="mb-1">
            <h1 className="font-bold text-xl text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to continue learning.</p>
          </div>
          {error && <p className="text-red-700 text-sm bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <button disabled={busy} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition">
            {busy && <Loader2 size={15} className="animate-spin" />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-sm text-slate-500">
            No account? <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Register</Link>
          </p>
        </form>
        <p className="text-center text-xs text-slate-400 mt-4">
          demo: instructor@learnmade.ai / password123 (after running the seed script)
        </p>
      </div>
    </div>
  );
}