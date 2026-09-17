import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  GraduationCap,
  LayoutDashboard,
  PlusSquare,
  FileBarChart,
  Route as RouteIcon,
  UserCircle,
  LogOut,
  HelpCircle,
  X,
} from "lucide-react";

function NavItem({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <Icon size={17} className={active ? "text-indigo-600" : "text-slate-400"} />
      {label}
    </Link>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isInstructor = user?.role === "instructor" || user?.role === "admin";

  const teachingItems = [
    { to: "/instructor", icon: LayoutDashboard, label: "My Courses" },
    { to: "/create-course", icon: PlusSquare, label: "Create Course" },
    { to: "/technical-summary", icon: FileBarChart, label: "Technical Summary" },
  ];
  const learningItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Courses" },
    { to: "/learning-path", icon: RouteIcon, label: "Learning Path" },
  ];
  const primaryItems = isInstructor ? teachingItems : learningItems;

  const isActive = (to) => (to === "/dashboard" || to === "/instructor" ? location.pathname === to : location.pathname.startsWith(to));

  const content = (
    <>
      <div className="flex items-center justify-between px-5 pt-6 pb-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shrink-0">
            <GraduationCap size={19} />
          </span>
          <span className="font-bold text-lg tracking-tight text-slate-900">
            Learn<span className="text-orange-500">Made</span>
          </span>
        </Link>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-slate-700">
          <X size={20} />
        </button>
      </div>

      <Link to="/profile" className="mx-4 mb-6 flex items-center gap-3 rounded-xl bg-slate-50 p-3 hover:bg-slate-100 transition">
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
            {user?.name?.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-slate-900 truncate">{user?.name}</span>
          <span className="block text-xs text-slate-500 capitalize">{user?.role}</span>
        </span>
      </Link>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {isInstructor ? "Teaching" : "Learning"}
          </p>
          <div className="space-y-1">
            {primaryItems.map((item) => (
              <NavItem key={item.to} {...item} active={isActive(item.to)} onClick={onClose} />
            ))}
          </div>
        </div>

        <div>
          <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Account</p>
          <div className="space-y-1">
            <NavItem to="/profile" icon={UserCircle} label="Profile" active={location.pathname === "/profile"} onClick={onClose} />
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition"
            >
              <LogOut size={17} className="text-slate-400" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="m-4 rounded-xl bg-indigo-50 p-4">
        <span className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
          <HelpCircle size={18} />
        </span>
        <p className="text-sm font-semibold text-slate-900">Need help?</p>
        <p className="text-xs text-slate-500 mt-0.5">Reach out any time and we'll help you get unstuck.</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-slate-900/30 z-40 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed lg:sticky top-0 z-50 lg:z-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}