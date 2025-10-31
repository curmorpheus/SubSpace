import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="bg-gradient-to-r from-orange-500 to-purple-600 text-transparent bg-clip-text">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight">
                SubSpace
              </h1>
            </div>
          </div>
          <p className="text-xl sm:text-2xl text-gray-700 font-medium max-w-2xl mx-auto">
            Construction Form Management for Modern Teams
          </p>
          <p className="mt-4 text-base text-gray-600 max-w-xl mx-auto">
            Submit inspection forms, capture signatures, and deliver reports instantly
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Subcontractor Card */}
          <Link
            href="/forms/impalement-protection"
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-orange-200"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-500 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>

            <div className="p-8 sm:p-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  📋
                </div>
                <span className="px-4 py-1.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full uppercase tracking-wide">
                  For Subs
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
                Impalement Protection
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Submit safety inspection forms with digital signatures and instant email delivery
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-green-500 font-bold">✓</span>
                  <span>Mobile-friendly form</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-green-500 font-bold">✓</span>
                  <span>Digital signature capture</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-green-500 font-bold">✓</span>
                  <span>Email PDF to superintendent</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-green-500 font-bold">✓</span>
                  <span>Multiple inspections per form</span>
                </div>
              </div>

              <div className="flex items-center text-orange-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                Fill out form
                <span className="ml-2 text-2xl">→</span>
              </div>
            </div>
          </Link>

          {/* Superintendent Card */}
          <Link
            href="/admin"
            className="group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-green-200"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400 to-green-500 rounded-bl-full opacity-10 group-hover:opacity-20 transition-opacity"></div>

            <div className="p-8 sm:p-10">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                  👔
                </div>
                <span className="px-4 py-1.5 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wide">
                  For Supers
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
                Superintendent Dashboard
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                View, search, and manage all submitted forms in one secure location
              </p>

              <div className="space-y-2.5 mb-8">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-blue-500 font-bold">✓</span>
                  <span>View all submissions</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-blue-500 font-bold">✓</span>
                  <span>Search by job, name, or company</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-blue-500 font-bold">✓</span>
                  <span>Export forms as PDFs</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="mr-3 text-blue-500 font-bold">✓</span>
                  <span>Secure password protection</span>
                </div>
              </div>

              <div className="flex items-center text-green-600 font-bold text-lg group-hover:translate-x-2 transition-transform">
                Access dashboard
                <span className="ml-2 text-2xl">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="font-bold text-gray-900 mb-2">Mobile First</h3>
            <p className="text-sm text-gray-600">Optimized for phones and tablets</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">✍️</div>
            <h3 className="font-bold text-gray-900 mb-2">Digital Signatures</h3>
            <p className="text-sm text-gray-600">Sign with your finger or mouse</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="font-bold text-gray-900 mb-2">Instant Email</h3>
            <p className="text-sm text-gray-600">Send PDFs automatically</p>
          </div>

          <div className="bg-white/70 backdrop-blur rounded-2xl p-6 border border-gray-200">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bold text-gray-900 mb-2">Secure Storage</h3>
            <p className="text-sm text-gray-600">Cloud-based and encrypted</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            SubSpace - Streamlining construction site documentation
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Built with Next.js, TypeScript, and Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  );
}
