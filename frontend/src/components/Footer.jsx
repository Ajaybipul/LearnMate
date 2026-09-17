export default function Footer() {
  return (
    <footer className="mt-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <h2 className="text-3xl font-bold tracking-tight">
                  <span className="text-slate-900">Learn</span>
                 <span className="text-orange-500">made</span>
            </h2>

            <p className="mt-4 text-slate-600 leading-7 max-w-md">
              Learnmade is a modern online learning platform designed to help
              students and professionals master new skills through interactive
              courses, AI-powered assistance, and hands-on learning experiences.
            </p>

            <div className="mt-6 space-y-2 text-sm text-slate-600">
              <p>📧 support@learnmade.com</p>
              <p>📞 +91 98765 43210</p>
              <p>🌐 www.learnmade.com</p>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              Platform
            </h3>

            <ul className="space-y-3">
              {[
                "Courses",
                "AI Tutor",
                "Learning Paths",
                "Certificates",
                "Dashboard",
              ].map((item) => (
                <li
                  key={item}
                  className="text-slate-600 hover:text-violet-600 cursor-pointer transition duration-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              Company
            </h3>

            <ul className="space-y-3">
              {[
                "About Us",
                "Careers",
                "Blog",
                "Partners",
                "Contact",
              ].map((item) => (
                <li
                  key={item}
                  className="text-slate-600 hover:text-violet-600 cursor-pointer transition duration-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-5">
              Resources
            </h3>

            <ul className="space-y-3">
              {[
                "Help Center",
                "Community",
                "FAQs",
                "Privacy Policy",
                "Terms & Conditions",
              ].map((item) => (
                <li
                  key={item}
                  className="text-slate-600 hover:text-violet-600 cursor-pointer transition duration-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-slate-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">

          <p className="text-sm text-slate-500 text-center md:text-left">
            © {new Date().getFullYear()} Learnmade. All rights reserved.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {["🌐", "💼", "🐦", "📷"].map((icon, index) => (
              <button
                key={index}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-violet-600 hover:text-white text-slate-700 transition-all duration-300 flex items-center justify-center shadow-sm"
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}