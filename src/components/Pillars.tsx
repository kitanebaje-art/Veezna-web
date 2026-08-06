'use client';

import React, { useState, useEffect, useRef } from 'react';

// Counter component for animated bottom statistics
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          let startTime: number | null = null;

          const step = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            // Ease out quad formula
            const easeOutProgress = progress * (2 - progress);
            setCount(Math.floor(easeOutProgress * end));

            if (progress < 1) {
              window.requestAnimationFrame(step);
            } else {
              setCount(end);
            }
          };

          window.requestAnimationFrame(step);
        }
      },
      { threshold: 0.2 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span ref={elementRef} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function VeeznaLearningSystem() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const centerCardRef = useRef<HTMLDivElement>(null);

  // 3D Glass Card Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!centerCardRef.current) return;
    const rect = centerCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 12;
    const tiltY = (centerX - x) / 12;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const steps = [
    {
      num: '01',
      title: 'Learn',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: 'Understand concepts from the basics with expert guidance.',
      badge: 'Foundation',
    },
    {
      num: '02',
      title: 'Practice',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Daily activities, assignments and practical exercises.',
      badge: 'Application',
    },
    {
      num: '03',
      title: 'Communicate',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      description: 'Develop confidence, spoken English and presentation skills.',
      badge: 'VOX English',
    },
    {
      num: '04',
      title: 'Create',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Build projects and apply learning in real situations.',
      badge: 'Hands-On',
    },
    {
      num: '05',
      title: 'Grow',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'Improve personality, discipline and leadership.',
      badge: 'Holistic',
    },
    {
      num: '06',
      title: 'Achieve',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      description: 'Earn certifications, confidence and career readiness.',
      badge: 'Success',
    },
  ];

  const floatPills = [
    { label: 'Academic Excellence', color: 'bg-[#0057B8]', position: 'top-4 left-2 sm:-left-6' },
    { label: 'Spoken English', color: 'bg-[#F7931E]', position: 'top-20 right-2 sm:-right-8' },
    { label: 'Web Development', color: 'bg-[#00BFFF]', position: 'bottom-24 left-0 sm:-left-10' },
    { label: 'Wellness', color: 'bg-[#2ECC71]', position: 'bottom-8 right-2 sm:-right-6' },
    { label: 'Career Growth', color: 'bg-purple-600', position: 'top-1/2 -left-4 sm:-left-12' },
    { label: 'Personality Dev.', color: 'bg-indigo-600', position: 'top-1/2 -right-4 sm:-right-10' },
  ];

  return (
    <section className="relative py-24 lg:py-36 bg-[#F8FAFC] text-[#1E293B] overflow-hidden">
      {/* ===== BACKGROUND DECORATIONS (LIGHT ELEGANTS) ===== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft Background Gradients */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[#0057B8]/10 via-[#00BFFF]/5 to-[#F7931E]/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-[#F7931E]/10 to-transparent blur-[120px] rounded-full" />

        {/* Geometric Abstract Grid & Waves */}
        <div 
          className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" 
        />
        
        {/* Abstract Concentric Glass Circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-[#0057B8]/10 rounded-full animate-spin-ultra-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-dashed border-[#F7931E]/15 rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===== TOP CENTER HEADER ===== */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
            <span className="text-xs font-extrabold tracking-widest text-[#0057B8] uppercase">
              OUR LEARNING METHODOLOGY
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Veezna Learning System{' '}
            <span className="block mt-1.5 text-transparent bg-clip-text bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]">
              (VLS)
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed">
            Where Learning Becomes Transformation. A complete journey designed to help every learner gain knowledge, confidence, communication skills and real-world success.
          </p>
        </div>

        {/* ===== INTERACTIVE TIMELINE SECTION ===== */}
        <div className="mb-28">
          
          {/* DESKTOP TIMELINE (Horizontal) */}
          <div className="hidden lg:block relative my-12">
            {/* Glowing Connecting Line */}
            <div className="absolute top-1/2 left-[5%] right-[5%] h-1 bg-slate-200 -translate-y-1/2 rounded-full z-0 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E] transition-all duration-700 ease-out"
                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
              />
            </div>

            <div className="grid grid-cols-6 gap-4 relative z-10">
              {steps.map((s, idx) => {
                const isActive = activeStep === idx;
                const isPassed = activeStep >= idx;

                return (
                  <div 
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    {/* Node Dot */}
                    <div 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${
                        isActive
                          ? 'bg-gradient-to-br from-[#0057B8] to-[#00BFFF] text-white scale-110 shadow-[#0057B8]/30 border-2 border-white ring-4 ring-[#0057B8]/20'
                          : isPassed
                          ? 'bg-[#0057B8] text-white'
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-[#0057B8] hover:text-[#0057B8]'
                      }`}
                    >
                      {s.icon}
                    </div>

                    {/* Step Title & Badge */}
                    <div className="text-center mt-4">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#F7931E]">
                        STEP {s.num}
                      </span>
                      <h4 className={`text-base font-bold mt-0.5 transition-colors ${
                        isActive ? 'text-[#0057B8]' : 'text-slate-800 group-hover:text-[#0057B8]'
                      }`}>
                        {s.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Active Step Dynamic Detail Card */}
            <div className="mt-10 max-w-2xl mx-auto p-6 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 backdrop-blur-xl transition-all duration-500">
              <div className="flex items-center gap-4 mb-3">
                <span className="px-3 py-1 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-bold uppercase tracking-wider">
                  {steps[activeStep].badge}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  Phase {steps[activeStep].num} of 06
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                {steps[activeStep].title} Stage
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                {steps[activeStep].description}
              </p>
            </div>
          </div>

          {/* MOBILE TIMELINE (Vertical) */}
          <div className="lg:hidden relative pl-6 border-l-2 border-slate-200 space-y-8 my-8">
            {steps.map((s, idx) => (
              <div key={idx} className="relative group">
                {/* Node indicator */}
                <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#0057B8] flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-[#F7931E] uppercase tracking-wider">
                      STEP {s.num}
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                      {s.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-[#0057B8]">{s.icon}</div>
                    <h3 className="text-lg font-bold text-slate-900">{s.title}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ===== PREMIUM CENTER 3D GLASS ILLUSTRATION & FLOATING PILLS ===== */}
        <div className="relative my-24 py-8 flex items-center justify-center">
          
          {/* Main Interactive 3D Glass Card */}
          <div
            ref={centerCardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
            className="relative w-full max-w-xl rounded-3xl bg-white/70 border border-white/80 backdrop-blur-2xl p-8 sm:p-12 shadow-[0_30px_70px_rgba(0,87,184,0.12)] transition-transform duration-200 ease-out z-20 group animate-float-slow"
          >
            {/* Animated Reflective Glass Overlay */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-white/60 via-transparent to-white/20 pointer-events-none" />

            <div className="relative z-10 text-center space-y-6">
              
              {/* Brand Logo Header */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#0057B8]/10 border border-[#0057B8]/20 backdrop-blur-md">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#F7931E] flex items-center justify-center text-white font-extrabold text-xs">
                  V
                </div>
                <span className="font-black text-slate-900 text-lg tracking-tight">Veezna VLS</span>
              </div>

              {/* Central Title */}
              <div>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                  360° Learning
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">
                  Complete Growth Ecosystem
                </p>
              </div>

              {/* Integrated 6-Pillar Circular Flow Diagram */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {steps.map((st, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm flex flex-col items-center hover:border-[#0057B8] transition-colors"
                  >
                    <div className="text-[#0057B8] mb-1">{st.icon}</div>
                    <span className="text-xs font-bold text-slate-800">{st.title}</span>
                  </div>
                ))}
              </div>

              {/* Status Indicator */}
              <div className="pt-2 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-ping" />
                <span>Active Practical Framework</span>
              </div>

            </div>
          </div>

          {/* Floating Mini Feature Cards (Floating around center card) */}
          {floatPills.map((pill, idx) => (
            <div
              key={idx}
              className={`absolute hidden md:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/90 border border-slate-200 shadow-lg backdrop-blur-md z-30 transition-transform duration-300 hover:scale-105 ${pill.position}`}
              style={{
                animation: `floatSlow ${6 + idx}s ease-in-out infinite ${idx * 0.8}s`,
              }}
            >
              <div className={`w-2.5 h-2.5 rounded-full ${pill.color}`} />
              <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                {pill.label}
              </span>
            </div>
          ))}
        </div>

        {/* ===== BOTTOM STATISTICS CARDS ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-20">
          {[
            { label: 'Students Guided', val: 500, suffix: '+', color: 'from-[#0057B8]/10 to-transparent' },
            { label: 'Programs Available', val: 10, suffix: '+', color: 'from-[#F7931E]/10 to-transparent' },
            { label: 'Learning Approach', val: 360, suffix: '°', color: 'from-[#00BFFF]/10 to-transparent' },
            { label: 'Practical Focus', val: 100, suffix: '%', color: 'from-[#2ECC71]/10 to-transparent' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${stat.color} bg-white border border-slate-200/80 shadow-md backdrop-blur-md text-center hover:-translate-y-1 transition-transform`}
            >
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
                <AnimatedCounter end={stat.val} suffix={stat.suffix} />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ===== BOTTOM CTA BANNER ===== */}
        <div className="relative rounded-3xl bg-gradient-to-r from-[#0057B8] via-[#00418A] to-[#002855] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden">
          {/* Ambient Lighting inside CTA */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00BFFF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
              Experience Learning Beyond Classrooms
            </h3>
            <p className="text-slate-200 text-sm sm:text-lg font-normal leading-relaxed">
              Join Veezna and discover a smarter, practical and future-ready learning experience tailored for real academic and career readiness.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#programs"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95"
              >
                Explore Programs
              </a>
              <a
                href="#start"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* ===== GLOBAL KEYFRAME ANIMATIONS ===== */}
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes spinUltraSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        .animate-spin-ultra-slow {
          animation: spinUltraSlow 40s linear infinite;
        }
        .animate-fade-up {
          animation: fadeUp 0.8s ease-out forwards;
        }
      `}</style>
    </section>
  );
}