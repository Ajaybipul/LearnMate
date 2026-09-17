import { Menu, Search } from "lucide-react";

export default function Topbar({ onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 bg-white border-b border-slate-200 px-5 lg:px-8 py-3.5">
      <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-800 shrink-0">
        <Menu size={22} />
      </button>

      <div className="relative flex-1 max-w-sm ml-auto">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          placeholder="Search anything…"
          className="w-full pl-10 pr-12 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
        />
        <span className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center gap-0.5 text-[11px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
          ⌘K
        </span>
      </div>
    </header>
  );
}