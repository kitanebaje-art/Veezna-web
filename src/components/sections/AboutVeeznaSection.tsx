'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function AboutVeeznaSection() {
  const pillars = [
    {
      title: 'Academic Excellence',
      category: 'Foundation',
      desc: 'Concept-driven coaching for Classes 6–12 with board preparation and 1-on-1 mentorship.',
      color: 'from-[#0057B8] to-[#00BFFF]',
      borderColor: 'hover:border-[#0057B8]',
      icon: (
        <svg className="w-5 h-5 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
    },
    {
      title: 'Veezna Vox',
      category: 'Expression',
      desc: 'Spoken English, public speaking, group discussions, and interview communication.',
      color: 'from-[#F7931E] to-[#FFB74D]',
      borderColor: 'hover:border-[#F7931E]',
      icon: (
        <svg className="w-5 h-5 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    {
      title: 'Technology & AI',
      category: 'Future Readiness',
      desc: 'Web development, prompt engineering, AI productivity tools, and modern digital workflows.',
      color: 'from-[#00BFFF] to-[#0284C7]',
      borderColor: 'hover:border-[#00BFFF]',
      icon: (
        <svg className="w-5 h-5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      title: 'Wellness & Counselling',
      category: 'Inner Balance',
      desc: 'Confidential 1-on-1 guidance, stress management, confidence building, and emotional well-being.',
      color: 'from-[#10B981] to-[#059669]',
      borderColor: 'hover:border-[#10B981]',
      icon: (
        <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      title: 'Career Guidance',
      category: 'Strategic Planning',
      desc: 'Aptitude mapping, competitive exam roadmaps, higher education counseling, and goal setting.',
      color: 'from-[#EC4899] to-[#E11D48]',
      borderColor: 'hover:border-[#EC4899]',
      icon: (
        <svg className="w-5 h-5 text-[#EC4899]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l6-6-6-6" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16" />
        </svg>
      ),
    },
  ];

  const philosophySteps = [
    { title: 'Clarity', desc: 'Understanding your true self, goals, and context.' },
    { title: 'Understanding', desc: 'Recognizing strengths, limits, and potential paths.' },
    { title: 'Learning', desc: 'Acquiring relevant, structured, concept-backed skills.' },
    { title: 'Confidence', desc: 'Developing trust in your capability through practice.' },
    { title: 'Action', desc: 'Executing well-informed decisions with purpose.' },
    { title: 'Growth', desc: 'Sustaining meaningful long-term personal progress.' },
  ];

  const existenceSteps = [
    {
      num: '01',
      title: 'Understand',
      desc: 'Understand yourself, your goals, strengths, and challenges.',
      color: 'text-[#0057B8]',
      border: 'border-[#0057B8]/20',
    },
    {
      num: '02',
      title: 'Learn',
      desc: 'Build practical knowledge and skills that matter in the real world.',
      color: 'text-[#F7931E]',
      border: 'border-[#F7931E]/20',
    },
    {
      num: '03',
      title: 'Grow',
      desc: 'Develop confidence, communication, capability, and resilience.',
      color: 'text-[#00BFFF]',
      border: 'border-[#00BFFF]/20',
    },
    {
      num: '04',
      title: 'Move Forward',
      desc: 'Turn clarity into meaningful action and long-term progress.',
      color: 'text-[#10B981]',
      border: 'border-[#10B981]/20',
    },
  ];

  return (
    <div id="about" className="bg-[#F4F8FC] text-[#1E293B] overflow-hidden">
      {/* SECTION 1 — KNOW MORE ABOUT VEEZNA */}
      <section className="relative py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* LEFT SIDE: Text & Description */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0057B8] text-xs font-extrabold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                ABOUT VEEZNA
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                More Than Learning.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]">
                  A Direction for Life.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Veezna brings education, communication, technology, career guidance, and wellness together under one ecosystem — helping learners and individuals move from confusion to clarity, and from intention to action.
              </p>

              <div className="space-y-4 pt-2 text-sm sm:text-base text-slate-600 leading-relaxed">
                <p>
                  We believe that education without direction creates unnecessary friction, and advice without practical skills leaves ambition unfulfilled. That is why Veezna is structured as a complete growth environment rather than an isolated set of courses.
                </p>
                <p>
                  Whether preparing for academic milestones, building spoken English confidence, exploring modern technology tools, or seeking clear career direction, every individual receives guidance tailored to their unique strengths and aspirations.
                </p>
              </div>

              {/* Mission Highlight */}
              <div className="p-5 rounded-2xl bg-[#F4F8FC] border border-blue-100/80 border-l-4 border-l-[#0057B8]">
                <p className="text-xs font-bold text-[#0057B8] uppercase tracking-wider mb-1">
                  Our Mission
                </p>
                <p className="text-sm font-semibold text-slate-800 italic">
                  &ldquo;To provide the clarity, practical tools, and direction individuals need to make self-assured choices and achieve sustained progress.&rdquo;
                </p>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
                <Link
                  href="/about"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-[#0057B8] hover:bg-[#00418A] text-white font-bold text-base shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
                >
                  Discover Veezna
                </Link>
                <Link
                  href="/programs/academic-excellence"
                  className="inline-flex justify-center items-center px-8 py-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base border border-slate-200 transition-all"
                >
                  Explore Our Programs
                </Link>
              </div>
            </div>

            {/* RIGHT SIDE: Interconnected Ecosystem Visual */}
            <div className="lg:col-span-6 relative">
              <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 shadow-xl relative overflow-hidden space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-xs font-extrabold text-[#0057B8] uppercase tracking-wider">
                      The Veezna Ecosystem
                    </span>
                    <h3 className="text-xl font-black text-slate-900">5 Interconnected Pillars</h3>
                  </div>
                  <span className="text-xs font-bold text-[#F7931E] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    Integrated Flow
                  </span>
                </div>

                {/* Growth Progression Flow */}
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-500 px-2 py-1.5 bg-white rounded-xl border border-slate-200/60 shadow-md">
                  <span>Education</span>
                  <span>→</span>
                  <span>Skills</span>
                  <span>→</span>
                  <span>Confidence</span>
                  <span>→</span>
                  <span>Clarity</span>
                  <span>→</span>
                  <span className="text-[#0057B8]">Growth</span>
                </div>

                {/* Pillar Cards List */}
                <div className="space-y-3 pt-2">
                  {pillars.map((p, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl bg-white border border-slate-200/80 ${p.borderColor} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group flex items-start space-x-3.5`}
                    >
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#0057B8] transition-colors truncate">
                            {p.title}
                          </h4>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 — OUR PHILOSOPHY */}
      <section className="py-20 lg:py-28 bg-[#F4F8FC] border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-[#F7931E] text-xs font-extrabold uppercase tracking-widest">
              BRAND PHILOSOPHY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
              Clarity Before Action.
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Every meaningful journey begins with understanding. At Veezna, we believe people should not simply follow a path because it is popular or expected. They should understand themselves, their goals, their strengths, and their possibilities before choosing their next step.
            </p>
          </div>

          {/* Minimalist Horizontal Progression Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {philosophySteps.map((step, index) => (
              <div
                key={index}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-center space-y-2 hover:border-[#0057B8] transition-colors group"
              >
                <div className="text-xs font-black text-[#F7931E] uppercase tracking-wider">
                  0{index + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0057B8] transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — MEET THE FOUNDER */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* LEFT: Founder Portrait Image */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-slate-100">
                <Image
                  src="/images/founder.png"
                  alt="Veezna. S. S. Gour - Founder, Veezna"
                  fill
                  className="object-cover"
                  priority
                /> 
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-black text-slate-900">Veezna S. S. Gour</h3>
                <p className="text-xs font-bold text-[#0057B8] uppercase tracking-wider">
                  Founder &amp; Vision Behind Veezna
                </p>
              </div>
            </div>

            {/* RIGHT: Founder Bio & Message */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-100 text-[#F7931E] text-xs font-extrabold uppercase tracking-widest">
                LEADERSHIP &amp; VISION
              </div>

              <div>
                <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
                  Veezna S. S. Gour
                </h2>
                <p className="text-base sm:text-lg font-bold text-[#0057B8] mt-1">
                  Founder &amp; Vision Behind Veezna
                </p>
              </div>

              <div className="space-y-4 text-slate-600 text-sm sm:text-base leading-relaxed">
  <p>
    Veezna was born out of a quiet frustration: watching bright, passionate people freeze under the crushing weight of expectation. Over the years, S S Gour saw the same painful pattern repeat—students and adults doubting their worth not because they lacked intelligence, but because no one ever paused to help them figure out who they actually were.
  </p>
  <p>
    By weaving together insights from psychology, educational counselling, mind wellness, and practical skill-building, S S Gour set out to create something different. Veezna wasn&rsquo;t built to be another rigid classroom or high-pressure coaching institute. It was created as a sanctuary—a place where you are listened to before you are taught, where confusion is met with empathy, and where clarity replaces fear.
  </p>
</div>

              {/* Founder Quote Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-orange-50/70 border border-slate-200/80 space-y-4 relative shadow-md">
  <p className="text-slate-800 text-base sm:text-lg font-semibold italic leading-relaxed">
    &ldquo;Real guidance isn&rsquo;t about handing out answers; it&rsquo;s about sitting with someone in their confusion, helping them untangle the doubt, and gently reminding them of the strength they forgot they had inside.&rdquo;
  </p>
  <div className="pt-2 border-t border-slate-200/60">
    <p className="text-sm font-black text-[#0057B8] tracking-tight">
      &ldquo;You don&rsquo;t need your whole life mapped out today—just enough clarity for the next step.&rdquo;
    </p>
  </div>
</div>
<div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-50/90 via-slate-50 to-orange-50/70 border border-slate-200/80 space-y-4 relative shadow-md">
  <p className="text-slate-800 text-base sm:text-lg font-semibold italic leading-relaxed">
    &ldquo;True growth happens quietly. It begins the moment you stop trying to prove yourself to the world, and start building the self-trust and practical skills needed to walk your own path with peace.&rdquo;
  </p>
  <div className="pt-2 border-t border-slate-200/60">
    <p className="text-sm font-black text-[#0057B8] tracking-tight">
      &ldquo;Once vision replaces confusion, every goal becomes possible.&rdquo;
    </p>
  </div>
</div>
              {/* Signature Block */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <div>
                  <div className="font-serif italic text-lg sm:text-xl text-slate-900 font-bold tracking-wide">
                    Veezna S. S. Gour
                  </div>
                  <div className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Founder, VEEZNA
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Veezna
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY VEEZNA EXISTS */}
      <section className="py-20 lg:py-28 bg-[#F4F8FC] border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="inline-block px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0057B8] text-xs font-extrabold uppercase tracking-widest">
              FOUR CORE STEPS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900">
              Why Veezna Exists
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Four structured phases to bridge the gap between where you are and where you aspire to be.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {existenceSteps.map((card, idx) => (
              <div
                key={idx}
                className={`p-7 rounded-3xl bg-white border ${card.border} shadow-sm hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className={`text-2xl font-black ${card.color}`}>
                    {card.num}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    &ldquo;{card.desc}&rdquo;
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Pillar {card.num}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — OUR VISION */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-r from-[#0057B8] via-[#00418A] to-slate-900 text-white text-center overflow-hidden">
        {/* Background Ambient Orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00BFFF]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-widest text-amber-300">
            OUR VISION
          </span>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Building an Ecosystem for Meaningful Progress
          </h2>

          <p className="text-base sm:text-xl text-blue-100 leading-relaxed font-normal max-w-3xl mx-auto">
            To build an ecosystem where education, skills, technology, wellness, and guidance work together to help people create meaningful progress.
          </p>

          <div className="pt-4">
            <div className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
              <span className="block text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">
                The Veezna Core Mantra
              </span>
              <p className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                &ldquo;Vision Turns Into Mission.&rdquo;
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#F7931E] hover:bg-[#e08316] text-white font-extrabold text-base shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
            >
              Book Free Counselling
            </Link>
            <Link
              href="/programs/academic-excellence"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base border border-white/30 backdrop-blur-md transition-all"
            >
              Explore Our Programs
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}