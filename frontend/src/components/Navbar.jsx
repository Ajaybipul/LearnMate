import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const isInstructor = user.role === "instructor" || user.role === "admin";

  const linkClass = (path, exact = false) =>
    `text-sm pb-1 border-b ${
      (exact ? location.pathname === path : location.pathname.startsWith(path)) ? "text-ink border-amber" : "text-ink-soft border-transparent hover:text-ink"
    }`;

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-line bg-paper sticky top-0 z-30">
      <Link to="/" className="flex items-baseline gap-2">
        <span className="font-display font-bold text-xl tracking-tight">
          Learn<span className="text-amber">made</span>
        </span>
        <span className="font-mono text-[10px] tracking-widest uppercase text-ink-faint">AI · LMS</span>
      </Link>
      <nav className="flex items-center gap-7">
        {isInstructor ? (
          <>
            <Link to="/instructor" className={linkClass("/instructor")}>My Courses</Link>
            <Link to="/create-course" className={linkClass("/create-course")}>Create Course</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" className={linkClass("/dashboard")}>Courses</Link>
            <Link to="/learning-path" className={linkClass("/learning-path")}>Learning Path</Link>
          </>
        )}
        {isInstructor ? (
          <Link to="/technical-summary" className={linkClass("/technical-summary", true)}>Technical Summary</Link>
        ) : (
          <Link to="/profile" className={linkClass("/profile", true)}>Profile</Link>
        )}
        <button
          onClick={() => {
            logout();
            navigate("/login");
          }}
          className="text-sm text-ink-soft hover:text-error"
        >
          Sign out
        </button>
        <Link
          to="/profile"
          title="View profile"
          className="w-8 h-8 rounded-full bg-teal text-white flex items-center justify-center font-mono text-xs hover:ring-2 hover:ring-teal/40 transition"
        >
          {user.name?.slice(0, 2).toUpperCase()}
        </Link>
      </nav>
    </header>
  );
}