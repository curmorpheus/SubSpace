import Link from "next/link";
import { SafetyIcon, UserIcon, ArrowIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-40">
          <div className="inline-block mb-6">
            <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-gray-900 leading-tight">
              SubSpace
            </h1>
          </div>
          <p className="text-xl sm:text-2xl text-gray-900 font-semibold max-w-3xl mx-auto mb-4 leading-tight">
            Stop chasing paper. Start protecting workers.
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-2 leading-relaxed">
            Digital impalement protection forms that anyone can submit from their phone—no app required.
          </p>
          <p className="text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Superintendents get instant PDF reports. Subcontractors get a simple form. Everyone stays safe.
          </p>
        </div>

        {/* Primary CTA - Form Card (Featured) */}
        <div className="max-w-4xl mx-auto mb-32">
          <Link
            href="/forms/impalement-protection"
            className="group relative bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden"
          >
            <div className="px-8 py-16 sm:p-16">
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                  <SafetyIcon className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-3xl font-semibold text-gray-900 mb-6 text-center leading-tight">
                Impalement Protection Form
              </h2>
              <p className="text-gray-600 mb-12 leading-relaxed text-lg text-center max-w-2xl mx-auto">
                Report exposed rebar, stakes, and sharp objects on site. Takes 5 minutes from your phone. No login required.
              </p>

              <div className="flex justify-center">
                <div className="inline-flex items-center bg-orange-500 hover:opacity-90 text-white font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-150">
                  Fill Out Form Now
                  <ArrowIcon className="ml-3 w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary - Superintendent Dashboard (Less Prominent) */}
        <div className="max-w-2xl mx-auto mb-32">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">For Superintendents</p>
          </div>
          <Link
            href="/admin"
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-150 overflow-hidden"
          >
            <div className="px-8 py-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-7 h-7 text-gray-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Superintendent Dashboard
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    View and manage submitted forms
                  </p>
                </div>
                <div className="text-gray-400 group-hover:translate-x-1 transition-transform duration-150 flex-shrink-0">
                  <ArrowIcon className="w-6 h-6" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          <div className="bg-white rounded-2xl px-8 py-8">
            <h3 className="font-semibold text-gray-900 mb-2">Mobile First</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Works on-site, on any device</p>
          </div>

          <div className="bg-white rounded-2xl px-8 py-8">
            <h3 className="font-semibold text-gray-900 mb-2">Safety Focused</h3>
            <p className="text-sm text-gray-600 leading-relaxed">Built for construction sites</p>
          </div>

          <div className="bg-white rounded-2xl px-8 py-8">
            <h3 className="font-semibold text-gray-900 mb-2">Instant Reports</h3>
            <p className="text-sm text-gray-600 leading-relaxed">PDF delivered immediately</p>
          </div>

          <div className="bg-white rounded-2xl px-8 py-8">
            <h3 className="font-semibold text-gray-900 mb-2">Easy for Crews</h3>
            <p className="text-sm text-gray-600 leading-relaxed">No training required</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-500 text-sm font-normal">
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
