import { ShieldCheck } from "lucide-react";

export default function NavBar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Med<span className="text-blue-600">Nav</span>
          </span>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          <a href="#" className="hidden sm:block text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">Log In</a>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full text-sm font-bold transition-colors">
            Sign In
          </button>
        </div>
      </div>
    </nav>
  );
}
