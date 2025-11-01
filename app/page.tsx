import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Construction-themed decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
        <div className="text-[20rem] leading-none">🏗️</div>
      </div>
      <div className="absolute bottom-0 left-0 w-64 h-64 opacity-5 pointer-events-none">
        <div className="text-[12rem] leading-none">⚠️</div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-transparent bg-clip-text">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight">
                SubSpace
              </h1>
            </div>
          </div>
          <p className="text-xl sm:text-2xl text-gray-700 font-bold max-w-3xl mx-auto mb-4">
            🏗️ Stop chasing paper. Start protecting workers.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2">
            Digital impalement protection forms that anyone can submit from their phone—no app required.
          </p>
          <p className="text-base text-gray-500 max-w-xl mx-auto">
            Superintendents get instant PDF reports. Subcontractors get a simple form. Everyone stays safe.
          </p>
        </div>

        {/* Primary CTA - Form Card (Featured) */}
        <div className="max-w-4xl mx-auto mb-8">
          <Link
            href="/forms/impalement-protection"
            className="group relative bg-white rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 overflow-hidden border-4 border-orange-200 hover:border-orange-400"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-orange-400 to-orange-500 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>

            <div className="p-10 sm:p-12">
              <div className="flex items-start justify-between mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center text-4xl shadow-xl">
                  🦺
                </div>
                <span className="px-5 py-2 bg-orange-500 text-white text-sm font-bold rounded-full uppercase tracking-wide shadow-lg">
                  Start Here
                </span>
              </div>

              <h2 className="text-4xl font-black text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                Impalement Protection Form
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                Report exposed rebar, stakes, and sharp objects on site. Takes 5 minutes from your phone. No login required.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-10">
                <div className="flex items-start">
                  <span className="mr-3 text-green-500 font-bold text-lg mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Mobile-friendly</div>
                    <div className="text-sm text-gray-600">Works on any phone</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-3 text-green-500 font-bold text-lg mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Digital signature</div>
                    <div className="text-sm text-gray-600">Sign with your finger</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-3 text-green-500 font-bold text-lg mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Instant delivery</div>
                    <div className="text-sm text-gray-600">PDF emailed immediately</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <span className="mr-3 text-green-500 font-bold text-lg mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">Multiple inspections</div>
                    <div className="text-sm text-gray-600">Add as many as needed</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-8 py-5 rounded-2xl group-hover:scale-105 transition-all shadow-lg">
                  Fill Out Form Now
                  <span className="ml-3 text-3xl">→</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary - Superintendent Dashboard (Less Prominent) */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">For Superintendents</p>
          </div>
          <Link
            href="/admin"
            className="group relative bg-white/80 backdrop-blur rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 hover:border-green-300"
          >
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center text-xl shadow-md flex-shrink-0">
                  👔
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                    Superintendent Dashboard
                  </h3>
                  <p className="text-sm text-gray-600">
                    View and manage submitted forms
                  </p>
                </div>
                <div className="text-green-600 font-bold text-2xl group-hover:translate-x-1 transition-transform flex-shrink-0">
                  →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-gray-900 mb-2">Mobile First</h3>
            <p className="text-sm text-gray-600">Works on-site, on any device</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <div className="text-3xl mb-3">🦺</div>
            <h3 className="font-bold text-gray-900 mb-2">Safety Focused</h3>
            <p className="text-sm text-gray-600">Built for construction sites</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-bold text-gray-900 mb-2">Instant Reports</h3>
            <p className="text-sm text-gray-600">PDF delivered immediately</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200 hover:border-orange-300 transition-colors">
            <div className="text-3xl mb-3">👷</div>
            <h3 className="font-bold text-gray-900 mb-2">Easy for Crews</h3>
            <p className="text-sm text-gray-600">No training required</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <div className="flex justify-center gap-3 mb-3 text-2xl opacity-30">
            <span>🏗️</span>
            <span>👷</span>
            <span>🦺</span>
            <span>⚠️</span>
          </div>
          <p className="text-gray-500 text-sm font-medium">
            SubSpace - Safety documentation for construction sites
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Built for superintendents and their crews
          </p>
        </div>
      </div>
    </div>
  );
}
