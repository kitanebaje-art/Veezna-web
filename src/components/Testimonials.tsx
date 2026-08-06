'use client';

import React, { useState, useEffect, useRef } from 'react';

// Counter component for animated trust statistics
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

// Interactive Featured Success Story Card with 3D Tilt
function SuccessStoryCard({
  story,
}: {
  story: {
    name: string;
    course: string;
    initials: string;
    avatarBg: string;
    before: string;
    after: string;
    storyText: string;
    achievement: string;
    progressPercentage: number;
    badgeBg: string;
    badgeText: string;
    accentGlow: string;
  };
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 18;
    const tiltY = (centerX - x) / 18;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative group">
      {/* Dynamic Glow Behind Card */}
      <div
        className="absolute inset-0 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: story.accentGlow }}
      />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-8px)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
        }}
        className="relative h-full rounded-[32px] bg-white/80 border border-slate-200/80 backdrop-blur-2xl p-7 sm:p-8 shadow-[0_10px_35px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_60px_rgba(0,87,184,0.12)] hover:border-slate-300 transition-all duration-300 ease-out flex flex-col justify-between z-10 overflow-hidden"
      >
        {/* Glass Reflection Accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-white/60 to-transparent rounded-bl-full pointer-events-none" />

        <div className="space-y-6 relative z-10">
          {/* Header Profile Info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Circular Avatar Badge */}
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-md ring-4 ring-white ${story.avatarBg}`}
              >
                {story.initials}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">{story.name}</h3>
                <p className="text-xs font-semibold text-[#0057B8]">{story.course}</p>
              </div>
            </div>

            <span
              className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${story.badgeBg}`}
            >
              {story.badgeText}
            </span>
          </div>

          {/* Before & After Transformation Split Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100">
              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest block mb-1">
                BEFORE
              </span>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{story.before}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                AFTER
              </span>
              <p className="text-xs text-slate-800 font-bold leading-relaxed">{story.after}</p>
            </div>
          </div>

          {/* Short Narrative */}
          <p className="text-slate-600 text-sm leading-relaxed font-normal pt-1">
            "{story.storyText}"
          </p>
        </div>

        {/* Progress Metric & Achievement Footer */}
        <div className="pt-6 mt-6 border-t border-slate-100 space-y-3 relative z-10">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500 uppercase tracking-wider">Achievement Metric</span>
            <span className="text-[#0057B8]">{story.achievement}</span>
          </div>

          {/* Animated Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#2ECC71] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${story.progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentSuccessStories() {
  const [activeTestimonialTab, setActiveTestimonialTab] = useState(0);

  const featuredStories = [
    {
      name: 'Aarav Sharma',
      course: 'Spoken English (Veezna Vox)',
      initials: 'AS',
      avatarBg: 'bg-gradient-to-br from-[#0057B8] to-[#00BFFF]',
      before: 'Felt extremely hesitant and hesitant when speaking English in public.',
      after: 'Delivers confident presentations, leads group discussions, and cleared interviews.',
      storyText:
        'Veezna Vox completely reshaped my confidence. The daily speaking drills and interactive mentorship helped me speak fluently without hesitation.',
      achievement: 'Confidence Level +95%',
      progressPercentage: 95,
      badgeBg: 'bg-blue-50 text-[#0057B8] border-blue-200/60',
      badgeText: 'Fluency Mastery',
      accentGlow: 'rgba(0, 87, 184, 0.15)',
    },
    {
      name: 'Priya Verma',
      course: 'Academic Excellence (Class 12)',
      initials: 'PV',
      avatarBg: 'bg-gradient-to-br from-[#F7931E] to-[#FFB74D]',
      before: 'Struggled with complex accounting concepts and exam pressure.',
      after: 'Scored 96% in board examinations with top rank in Accountancy.',
      storyText:
        'The concept-first approach at Veezna made challenging subjects intuitive. Weekly diagnostic tests gave me total exam clarity.',
      achievement: 'Board Result 96%',
      progressPercentage: 96,
      badgeBg: 'bg-amber-50 text-[#F7931E] border-amber-200/60',
      badgeText: 'Academic Top Rank',
      accentGlow: 'rgba(247, 147, 30, 0.18)',
    },
    {
      name: 'Rohan Gupta',
      course: 'Web Development',
      initials: 'RG',
      avatarBg: 'bg-gradient-to-br from-[#10B981] to-[#059669]',
      before: 'Zero coding background with confusion about technical career paths.',
      after: 'Built 4 production web apps and secured a frontend development internship.',
      storyText:
        'Hands-on project work and direct mentorship took me from absolute beginner to deploying full-stack web applications confidently.',
      achievement: 'Practical Skills +100%',
      progressPercentage: 100,
      badgeBg: 'bg-emerald-50 text-[#059669] border-emerald-200/60',
      badgeText: 'Career Ready',
      accentGlow: 'rgba(16, 185, 129, 0.18)',
    },
  ];

  const testimonials = [
    {
      name: 'Ananya Joshi',
      course: 'Class 10 Academic Prep',
      initials: 'AJ',
      rating: 5,
      review:
        'The teachers at Veezna do not just focus on syllabus completion—they make sure you truly understand the core principles. My confidence in Mathematics improved dramatically within weeks!',
      date: 'August 2026',
    },
    {
      name: 'Karan Mehta',
      course: 'Spoken English & Personality',
      initials: 'KM',
      rating: 5,
      review:
        'Veezna Vox is the best program for anyone wanting to eliminate communication fear. The live group discussions and personal feedback helped me speak effortlessly in my job interviews.',
      date: 'July 2026',
    },
    {
      name: 'Sneha Kulkarni',
      course: 'Web Development & Modern Tech',
      initials: 'SK',
      rating: 5,
      review:
        'Extremely structured course layout. Building real projects with Next.js and Tailwind CSS gave me practical knowledge that books can never provide.',
      date: 'July 2026',
    },
    {
      name: 'Vikram Singh',
      course: 'Class 11 Commerce & Accounts',
      initials: 'VS',
      rating: 5,
      review:
        'The study material and doubt-solving sessions are outstanding. Concepts that used to confuse me are now crystal clear. Highly recommended!',
      date: 'June 2026',
    },
    {
      name: 'Divya Nair',
      course: 'Wellness & Career Counselling',
      initials: 'DN',
      rating: 5,
      review:
        'The counselling sessions gave me emotional equilibrium and absolute clarity regarding my higher education choices. Thoughtful, empathetic, and professional mentorship.',
      date: 'June 2026',
    },
    {
      name: 'Aditya Patel',
      course: 'AI & Digital Productivity Skills',
      initials: 'AP',
      rating: 5,
      review:
        'Learning AI workflows and practical digital tools at Veezna gave me a competitive edge in my college projects. Practical education at its best.',
      date: 'May 2026',
    },
  ];

  const trustPillars = [
    {
      title: 'Personalized Learning',
      desc: 'Tailored study plans matching student pace.',
      icon: (
        <svg className="w-6 h-6 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      title: 'Practical Education',
      desc: 'Real-world application and live project work.',
      icon: (
        <svg className="w-6 h-6 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.12a2 2 0 00-1.182.118l-1.05.42a1 1 0 00-.632.927V19.5a1 1 0 001 1h16.5a1 1 0 001-1v-3.08a1 1 0 00-.572-.904l-.918-.388z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v9m0 0l-3-3m3 3l3-3" />
        </svg>
      ),
    },
    {
      title: 'Expert Mentorship',
      desc: 'Guidance from certified domain specialists.',
      icon: (
        <svg className="w-6 h-6 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
    },
    {
      title: 'Career-Focused Training',
      desc: 'Skills built for professional success.',
      icon: (
        <svg className="w-6 h-6 text-[#00BFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Student-Centric Approach',
      desc: 'Unwavering commitment to individual growth.',
      icon: (
        <svg className="w-6 h-6 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-24 lg:py-36 bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#FFFFFF] text-[#1E293B] overflow-hidden">
      {/* ===== BACKGROUND DECORATIONS ===== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Ambient Soft Orbs */}
        <div className="absolute top-1/6 right-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[140px] translate-x-1/3" />
        <div className="absolute bottom-1/4 left-0 w-[650px] h-[650px] bg-amber-100/40 rounded-full blur-[150px] -translate-x-1/3" />

        {/* Subtle Geometric Mesh */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===== TOP SECTION HEADER ===== */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-pulse" />
            <span className="text-xs font-extrabold tracking-widest text-[#0057B8] uppercase">
              STUDENT TRANSFORMATIONS
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Success{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]">
              Stories
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed">
            Real learners. Real transformation. Real success.
          </p>
        </div>

        {/* ===== SECTION 1: FEATURED SUCCESS STORY CARDS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-24">
          {featuredStories.map((story, idx) => (
            <SuccessStoryCard key={idx} story={story} />
          ))}
        </div>

        {/* ===== TRUST METRICS ANIMATED COUNTERS ===== */}
        <div className="my-20 p-8 sm:p-12 rounded-[32px] bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {[
              { label: 'Students Guided', val: 500, suffix: '+', color: 'text-[#0057B8]' },
              { label: 'Student Satisfaction', val: 95, suffix: '%', color: 'text-[#2ECC71]' },
              { label: 'Expert Programs', val: 20, suffix: '+', color: 'text-[#F7931E]' },
              { label: 'Learning Approach', val: 360, suffix: '°', color: 'text-[#00BFFF]' },
            ].map((metric, i) => (
              <div key={i} className={i !== 0 ? 'pt-6 lg:pt-0' : ''}>
                <div className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${metric.color}`}>
                  <AnimatedCounter end={metric.val} suffix={metric.suffix} />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2 uppercase tracking-wider">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SECTION 2: TESTIMONIALS REVIEWS GRID ===== */}
        <div className="my-24 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#F7931E] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              Verified Feedback
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              What Our Learners Say
            </h3>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className="rounded-3xl bg-white border border-slate-200/80 p-7 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1 group"
              >
                <div className="space-y-3">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed font-normal">
                    "{t.review}"
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      {t.initials}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{t.name}</h4>
                      <p className="text-[11px] text-slate-500 font-medium">{t.course}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400">{t.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== AWARDS & RECOGNITION HORIZONTAL STRIP ===== */}
        <div className="my-20 p-6 sm:p-8 rounded-3xl bg-slate-900 text-white shadow-xl overflow-hidden">
          <div className="text-center mb-6">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#00BFFF]">
              CORE ADVANTAGES
            </span>
            <h4 className="text-lg font-bold mt-1">Why Students Succeed at Veezna</h4>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {trustPillars.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors text-center flex flex-col items-center justify-center space-y-2 group"
              >
                <div className="p-2.5 rounded-xl bg-white/10 group-hover:scale-110 transition-transform">
                  {p.icon}
                </div>
                <h5 className="text-xs font-bold text-white">{p.title}</h5>
                <p className="text-[10px] text-slate-400 leading-tight">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BOTTOM GLASS CTA BANNER ===== */}
        <div className="relative rounded-[32px] bg-gradient-to-r from-[#0057B8] via-[#00418A] to-[#002855] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-white/10">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00BFFF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-amber-300 uppercase tracking-widest">
              <span>Start Your Transformation</span>
            </div>

            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Your Success Story Starts Here.
            </h3>

            <p className="text-slate-200 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Join Veezna and begin your journey toward confidence, knowledge, communication mastery and career success.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#enroll"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95"
              >
                Enroll Today
              </a>
              <a
                href="#mentor"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                Talk to a Mentor
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}