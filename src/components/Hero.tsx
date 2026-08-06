'use client';

import React from 'react';

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] w-full overflow-hidden bg-[#030712] text-white flex items-center justify-center py-16 md:py-24">
      {/* ===== CSS-ONLY ANIMATED BACKGROUND ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Gradient Mesh */}
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-radial from-[#0057B8]/25 via-transparent to-transparent blur-3xl animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-radial from-[#F7931E]/20 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />

        {/* Floating Geometric Light Particles / Spheres */}
        <div className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full bg-gradient-to-tr from-[#0057B8]/30 to-[#00BFFF]/20 blur-2xl animate-float-slow" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-gradient-to-br from-[#F7931E]/25 to-[#FFB74D]/15 blur-2xl animate-float-reverse" />
        
        {/* Subtle Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" 
        />
      </div>

      {/* ===== HERO CONTENT CONTAINER ===== */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* ================= LEFT COLUMN ================= */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6 md:space-y-8 text-left animate-fade-in-up">
            
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/10 backdrop-blur-md shadow-lg transition-transform hover:scale-105">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] animate-ping" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2ECC71] absolute" />
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-gray-200 uppercase pl-2">
                Vision Turns Into Mission
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              Empowering Minds.{' '}
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E] bg-clip-text text-transparent">
                Building Futures.
              </span>
            </h1>

            {/* Supporting Paragraph */}
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-2xl font-normal leading-relaxed">
              Veezna is a modern, comprehensive learning and development ecosystem combining concept-driven academic coaching, spoken communication mastery, and holistic personal wellness—crafted for real-world transformation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <a
                href="#start"
                className="group relative inline-flex items-center justify-center px-8 py-4 rounded-full bg-gradient-to-r from-[#0057B8] to-[#00418A] text-white font-bold text-base shadow-lg shadow-[#0057B8]/30 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-[#0057B8]/50 active:scale-95"
              >
                {/* Button Shine Effect */}
                <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
                <span>Start Your Journey</span>
                <svg className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>

              <a
                href="#programs"
                className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-white/[0.05] border border-white/15 text-white font-semibold text-base backdrop-blur-md hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] active:scale-95"
              >
                Explore Programs
              </a>
            </div>

            {/* Trust Indicators Bar */}
            <div className="pt-6 w-full border-t border-white/10">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
                Core Competencies & Ecosystem Pillars
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { title: 'Academic Excellence', color: 'from-[#0057B8]/20 to-transparent' },
                  { title: 'Spoken English', color: 'from-[#F7931E]/20 to-transparent' },
                  { title: 'Web Development', color: 'from-[#00BFFF]/20 to-transparent' },
                  { title: 'Wellness', color: 'from-[#2ECC71]/20 to-transparent' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r ${item.color} border border-white/10 backdrop-blur-sm`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F7931E]" />
                    <span className="text-xs sm:text-sm font-medium text-gray-200 truncate">
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ================= RIGHT COLUMN (3D GLASSMORPHISM PANEL) ================= */}
          <div className="lg:col-span-5 relative flex justify-center items-center">
            
            {/* Ambient Backlight Glow */}
            <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-br from-[#0057B8]/40 to-[#F7931E]/30 blur-3xl pointer-events-none -z-10" />

            {/* Floating Glassmorphic Main Card Container */}
            <div className="relative w-full max-w-md lg:max-w-none rounded-3xl bg-white/[0.04] border border-white/15 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)] transition-all duration-500 hover:border-white/25 hover:shadow-[0_40px_100px_rgba(0,87,184,0.3)] group animate-float-slow">
              
              {/* Glass Shine Overlay */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />

              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                <div className="flex items-center space-x-3">
                  {/* Abstract Geometric Logo Icon */}
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0057B8] to-[#F7931E] p-0.5 flex items-center justify-center shadow-md">
                    <div className="w-full h-full bg-[#030712] rounded-[14px] flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 17L12 22L22 17" stroke="#F7931E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2 12L12 17L22 12" stroke="#00BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-wide">Veezna</h3>
                    <p className="text-xs text-gray-400 font-medium">Vision Turns Into Mission</p>
                  </div>
                </div>

                <span className="px-3 py-1 text-[11px] font-semibold text-[#00BFFF] bg-[#0057B8]/20 border border-[#00BFFF]/30 rounded-full uppercase tracking-wider">
                  VLS v4.0
                </span>
              </div>

              {/* Panel Subtitle */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-1">
                  Veezna Learning System (VLS)
                </h4>
                <p className="text-xs text-gray-400">
                  Integrated framework driving academic success, skill growth, and personal wellbeing.
                </p>
              </div>

              {/* Feature Cards Stack */}
              <div className="space-y-4">
                
                {/* Feature 1 */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-300 hover:translate-x-1 hover:bg-white/[0.06] hover:border-[#0057B8]/40">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#0057B8]/20 text-[#00BFFF] border border-[#0057B8]/30 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white mb-0.5">Structured Academic Coaching</h5>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Concept-first methodology across core disciplines with regular mastery assessments.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-300 hover:translate-x-1 hover:bg-white/[0.06] hover:border-[#F7931E]/40">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#F7931E]/20 text-[#F7931E] border border-[#F7931E]/30 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white mb-0.5">VOX Spoken Communication</h5>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Fluency development, public speaking training, and leadership presentation skills.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md transition-all duration-300 hover:translate-x-1 hover:bg-white/[0.06] hover:border-[#2ECC71]/40">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-[#2ECC71]/20 text-[#2ECC71] border border-[#2ECC71]/30 flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-white mb-0.5">Ethical Wellness Mentorship</h5>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Holistic mind health, personal clarity, and balanced growth strategies.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Decorative Geometric Visual Graphic */}
              <div className="mt-6 p-3 rounded-xl bg-gradient-to-r from-[#0057B8]/20 via-[#F7931E]/20 to-transparent border border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[#2ECC71]" />
                  <span className="text-xs font-semibold text-gray-300">Live Mentorship Active</span>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-5 h-5 rounded-full bg-[#0057B8] border border-white/20" />
                  <div className="w-5 h-5 rounded-full bg-[#F7931E] border border-white/20" />
                  <div className="w-5 h-5 rounded-full bg-[#00BFFF] border border-white/20" />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ===== GLOBAL CUSTOM CSS ANIMATIONS ===== */}
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(12px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }
        .animate-float-reverse {
          animation: floatReverse 9s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </section>
  );
}