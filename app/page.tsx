import Link from "next/link";
import Image from "next/image";
import { SafetyIcon, UserIcon, ArrowIcon } from "@/components/icons";

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Hero Section - Full Width with Image */}
      <div className="relative h-screen min-h-[600px] max-h-[900px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero-construction-worker.jpg"
            alt="Construction worker on site"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Dark orange overlay for contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-orange-600/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="max-w-3xl">
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-none mb-6">
                SubSpace
              </h1>
              <p className="text-3xl sm:text-4xl text-orange-400 font-bold mb-8 leading-tight">
                Stop chasing paper.<br />Start protecting workers.
              </p>
              <p className="text-xl sm:text-2xl text-white/90 mb-8 leading-relaxed max-w-2xl">
                Digital safety inspection forms that anyone can submit from their phone—no app required.
              </p>
              <Link
                href="/forms/impalement-protection"
                className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-10 py-5 rounded-lg transition-all duration-150 shadow-2xl hover:shadow-orange-500/50"
              >
                Fill Out Form Now
                <ArrowIcon className="ml-4 w-7 h-7" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Problem/Solution Section with Background */}
      <div className="relative bg-gradient-to-b from-black to-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Image */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/construction-site-rebar.jpg"
                alt="Construction site with exposed rebar"
                fill
                className="object-cover"
                quality={85}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            {/* Right: Content */}
            <div>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
                Safety Can&apos;t Wait for Paperwork
              </h2>
              <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                Exposed rebar, stakes, and sharp objects are everywhere on construction sites.
                Traditional paper forms mean delays, lost documentation, and safety risks.
              </p>
              <p className="text-xl text-orange-400 font-semibold mb-8">
                SubSpace makes safety documentation instant and effortless.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-lg text-gray-300">Submit forms in 5 minutes from any phone</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-lg text-gray-300">Instant PDF reports to superintendents</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-4 mt-1">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                  <p className="text-lg text-gray-300">No app downloads or training required</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Form Showcase */}
      <div className="relative py-24 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="order-2 lg:order-1">
              <h2 className="text-5xl font-bold text-black mb-6 leading-tight">
                Built for the Job Site
              </h2>
              <p className="text-xl text-black/80 mb-6 leading-relaxed">
                Your crews are already carrying their phones. SubSpace works right in their browser—
                no app store, no downloads, no login.
              </p>
              <p className="text-2xl text-black font-bold mb-8">
                Just tap, fill, and submit.
              </p>
              <div className="bg-black/10 backdrop-blur-sm rounded-2xl p-8">
                <h3 className="text-2xl font-bold text-black mb-4">What Gets Captured</h3>
                <ul className="space-y-3 text-lg text-black/80">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-black rounded-full mr-3"></span>
                    Location and GPS coordinates
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-black rounded-full mr-3"></span>
                    Photos of hazards
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-black rounded-full mr-3"></span>
                    Worker signature and timestamp
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-black rounded-full mr-3"></span>
                    Detailed hazard description
                  </li>
                </ul>
              </div>
            </div>

            {/* Right: Image */}
            <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl order-1 lg:order-2">
              <Image
                src="/images/phone-on-site.jpg"
                alt="Worker using mobile device on construction site"
                fill
                className="object-cover"
                quality={85}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section with Image Background */}
      <div className="relative py-24">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/construction-workers-team.jpg"
            alt="Construction workers team"
            fill
            className="object-cover"
            quality={80}
          />
          <div className="absolute inset-0 bg-black/85"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-5xl font-bold text-white text-center mb-16">
            Why Crews Love SubSpace
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-150">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Mobile First</h3>
              <p className="text-gray-300 leading-relaxed">Works on-site, on any device. No app installation needed.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-150">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <SafetyIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Safety Focused</h3>
              <p className="text-gray-300 leading-relaxed">Built specifically for construction site safety documentation.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-150">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Instant Reports</h3>
              <p className="text-gray-300 leading-relaxed">PDF delivered immediately to superintendents&apos; email.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-150">
              <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Easy for Crews</h3>
              <p className="text-gray-300 leading-relaxed">No training required. Simple as filling out a web form.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="relative py-24 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-8 leading-tight">
            Ready to Protect Your Workers?
          </h2>
          <p className="text-2xl text-gray-300 mb-12 leading-relaxed">
            Start documenting safety hazards the modern way.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link
              href="/forms/impalement-protection"
              className="inline-flex items-center bg-orange-500 hover:bg-orange-600 text-white font-bold text-xl px-12 py-6 rounded-lg transition-all duration-150 shadow-2xl hover:shadow-orange-500/50"
            >
              Fill Out Form Now
              <ArrowIcon className="ml-4 w-7 h-7" />
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center bg-white/10 hover:bg-white/20 text-white font-bold text-xl px-12 py-6 rounded-lg transition-all duration-150 border-2 border-white/20"
            >
              Superintendent Dashboard
              <ArrowIcon className="ml-4 w-7 h-7" />
            </Link>
          </div>
        </div>
      </div>

      {/* Final Image Section */}
      <div className="relative h-[400px]">
        <Image
          src="/images/worker-safety-vest.jpg"
          alt="Worker in safety vest"
          fill
          className="object-cover"
          quality={85}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <p className="text-white text-lg font-semibold mb-2">
              SubSpace - Safety documentation for construction sites
            </p>
            <p className="text-gray-400 text-sm">
              Built for superintendents and their crews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
