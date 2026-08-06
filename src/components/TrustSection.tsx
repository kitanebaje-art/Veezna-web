'use client';

import React, { useState, useRef, useEffect } from 'react';

// Counter component for animated statistics
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

interface GalleryItem {
  id: string;
  category: string;
  title: string;
  caption: string;
  badgeBg: string;
  badgeText: string;
  gradientOverlay: string;
  svgVisual: React.ReactNode;
  spanCol?: string;
  spanRow?: string;
}

export default function CampusExperienceGallery() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isFeaturedHovered, setIsFeaturedHovered] = useState(false);
  const featuredCardRef = useRef<HTMLDivElement>(null);

  const categories = [
    'All',
    'Academic Classes',
    'Spoken English',
    'Web Lab',
    'Student Activities',
    'Seminars',
    'Wellness',
    'Events',
  ];

  const galleryItems: GalleryItem[] = [
    {
      id: 'item-1',
      category: 'Academic Classes',
      title: 'Concept-Driven Classrooms',
      caption: 'Interactive, small-batch learning environments focused on analytical clarity and board prep.',
      badgeBg: 'bg-blue-50 text-[#0057B8] border-blue-200/60',
      badgeText: 'Academic',
      gradientOverlay: 'from-[#0057B8]/80 via-[#0057B8]/40 to-transparent',
      spanCol: 'lg:col-span-2',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      ),
    },
    {
      id: 'item-2',
      category: 'Spoken English',
      title: 'Veezna Vox Studio',
      caption: 'Dynamic public speaking, debates, accent refinement, and real-time interview simulations.',
      badgeBg: 'bg-amber-50 text-[#F7931E] border-amber-200/60',
      badgeText: 'Vox English',
      gradientOverlay: 'from-[#F7931E]/80 via-[#F7931E]/40 to-transparent',
      spanCol: 'lg:col-span-1',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    {
      id: 'item-3',
      category: 'Web Lab',
      title: 'Tech & Code Lab',
      caption: 'Hands-on full-stack development studio featuring modern frameworks, Next.js, and live projects.',
      badgeBg: 'bg-cyan-50 text-[#0284C7] border-cyan-200/60',
      badgeText: 'Technology',
      gradientOverlay: 'from-[#00BFFF]/80 via-[#0284C7]/40 to-transparent',
      spanCol: 'lg:col-span-1',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
    {
      id: 'item-4',
      category: 'Student Activities',
      title: 'Collaborative Learning Spaces',
      caption: 'Group brainstorming hubs engineered to foster peer mentorship and creative problem solving.',
      badgeBg: 'bg-indigo-50 text-[#6366F1] border-indigo-200/60',
      badgeText: 'Community',
      gradientOverlay: 'from-[#6366F1]/80 via-[#6366F1]/40 to-transparent',
      spanCol: 'lg:col-span-2',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'item-5',
      category: 'Seminars',
      title: 'Expert Leadership Seminars',
      caption: 'Masterclasses delivered by industry veterans, career mentors, and education specialists.',
      badgeBg: 'bg-purple-50 text-[#8B5CF6] border-purple-200/60',
      badgeText: 'Seminars',
      gradientOverlay: 'from-[#8B5CF6]/80 via-[#8B5CF6]/40 to-transparent',
      spanCol: 'lg:col-span-1',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
    },
    {
      id: 'item-6',
      category: 'Wellness',
      title: 'Mindfulness & Care Suite',
      caption: 'Peaceful, confidential spaces dedicated to personal guidance, stress management, and wellbeing.',
      badgeBg: 'bg-emerald-50 text-[#059669] border-emerald-200/60',
      badgeText: 'Wellness',
      gradientOverlay: 'from-[#10B981]/80 via-[#10B981]/40 to-transparent',
      spanCol: 'lg:col-span-1',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
    {
      id: 'item-7',
      category: 'Events',
      title: 'Annual Veezna Celebration',
      caption: 'Celebrating academic milestones, student transformations, and excellence awards.',
      badgeBg: 'bg-rose-50 text-[#E11D48] border-rose-200/60',
      badgeText: 'Events',
      gradientOverlay: 'from-[#E11D48]/80 via-[#E11D48]/40 to-transparent',
      spanCol: 'lg:col-span-1',
      spanRow: 'lg:row-span-1',
      svgVisual: (
        <svg className="w-16 h-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
    },
  ];

  const filteredItems = selectedCategory === 'All'
    ? galleryItems
    : galleryItems.filter(item => item.category === selectedCategory || item.badgeText.includes(selectedCategory));

  const handleFeaturedMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!featuredCardRef.current) return;
    const rect = featuredCardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = (y - centerY) / 25;
    const tiltY = (centerX - x) / 25;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleFeaturedMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsFeaturedHovered(false);
  };

  const campusHighlights = [
    {
      title: 'Modern Classrooms',
      desc: 'Ergonomic, high-tech environments designed for immersive, concept-driven focus.',
      icon: (
        <svg className="w-6 h-6 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      title: 'Expert Mentors',
      desc: 'Accomplished educators and certified specialists guiding every step of growth.',
      icon: (
        <svg className="w-6 h-6 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: 'Interactive Learning',
      desc: 'Hands-on practical projects, group communication drills, and live application labs.',
      icon: (
        <svg className="w-6 h-6 text-[#00BFFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-disabled2a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      title: 'Career Support',
      desc: 'Tailored roadmaps, interview prep, public speaking mastery, and future planning.',
      icon: (
        <svg className="w-6 h-6 text-[#2ECC71]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  return (
    <section className="relative py-24 lg:py-36 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FC] to-[#F8FAFC] text-[#1E293B] overflow-hidden">
      {/* ===== BACKGROUND DECORATIVE LAYER ===== */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft Ambient Blur Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[#0057B8]/10 via-[#00BFFF]/5 to-[#F7931E]/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-gradient-to-br from-[#F7931E]/10 to-transparent blur-[120px] rounded-full" />

        {/* Subtle Geometric Texture & Waves */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ===== HEADER SECTION ===== */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#0057B8] animate-ping" />
            <span className="text-xs font-extrabold tracking-widest text-[#0057B8] uppercase">
              CAMPUS EXPERIENCE
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Experience{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]">
              Veezna
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed">
            Every classroom, every activity and every achievement reflects our commitment to transforming lives through education.
          </p>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-6">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-[#0057B8] text-white shadow-md shadow-[#0057B8]/25 scale-105'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ===== FEATURED HIGHLIGHT EXTRA-LARGE CARD ===== */}
        <div className="mb-12">
          <div
            ref={featuredCardRef}
            onMouseMove={handleFeaturedMouseMove}
            onMouseEnter={() => setIsFeaturedHovered(true)}
            onMouseLeave={handleFeaturedMouseLeave}
            style={{
              transform: isFeaturedHovered
                ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
                : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
            }}
            className="relative w-full rounded-[32px] bg-gradient-to-br from-[#0057B8] via-[#00418A] to-[#030712] text-white p-8 sm:p-12 lg:p-16 shadow-[0_20px_60px_rgba(0,87,184,0.18)] border border-white/20 backdrop-blur-2xl transition-all duration-300 ease-out overflow-hidden group cursor-pointer"
          >
            {/* Ambient Lighting & Abstract Visual Overlay */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#00BFFF]/30 via-[#F7931E]/20 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-[#0057B8]/40 rounded-full blur-3xl pointer-events-none" />

            {/* Geometric Grid Graphic Accent */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-6">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-xs font-extrabold text-amber-300 uppercase tracking-widest">
                FEATURED EXPERIENCE
              </span>

              <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Learning Beyond Classrooms
              </h3>

              <p className="text-slate-200 text-base sm:text-lg lg:text-xl font-normal leading-relaxed">
                "Practical experiences, engaging classrooms and a supportive environment designed for every learner."
              </p>

              <div className="pt-4 flex flex-wrap items-center gap-4">
                <a
                  href="#full-gallery"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95 group/btn"
                >
                  <span>View Complete Gallery</span>
                  <svg className="w-5 h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ===== MASONRY GALLERY GRID ===== */}
        <div id="full-gallery" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-24">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`relative group rounded-[32px] bg-white/80 border border-slate-200/80 backdrop-blur-xl p-6 sm:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(0,87,184,0.12)] hover:border-slate-300 transition-all duration-500 flex flex-col justify-between overflow-hidden cursor-pointer ${item.spanCol || ''} ${item.spanRow || ''}`}
            >
              {/* Abstract Visual Graphic Background Frame */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200/60 opacity-60 group-hover:opacity-80 transition-opacity pointer-events-none" />
              
              {/* Soft Gradient Overlay on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-t ${item.gradientOverlay} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10`} />

              {/* Top Meta Header */}
              <div className="relative z-20 flex items-center justify-between mb-8">
                <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${item.badgeBg}`}>
                  {item.badgeText}
                </span>

                <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm transition-transform duration-500 group-hover:scale-110">
                  <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>

              {/* Center Abstract Graphic Visual */}
              <div className="relative z-0 my-4 flex justify-center items-center py-6 transition-transform duration-500 group-hover:scale-110">
                {item.svgVisual}
              </div>

              {/* Card Bottom Content (Slides up slightly on hover) */}
              <div className="relative z-20 space-y-2 transform transition-transform duration-500 group-hover:-translate-y-1">
                <h4 className="text-xl font-black text-slate-900 group-hover:text-white transition-colors duration-300">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-100 leading-relaxed transition-colors duration-300">
                  {item.caption}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ===== STATISTICS STRIP ===== */}
        <div className="my-20 p-8 sm:p-12 rounded-[32px] bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-xl shadow-slate-200/50">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {[
              { label: 'Learning Events', val: 20, suffix: '+', color: 'text-[#0057B8]' },
              { label: 'Active Students', val: 500, suffix: '+', color: 'text-[#F7931E]' },
              { label: 'Workshops Delivered', val: 100, suffix: '+', color: 'text-[#00BFFF]' },
              { label: 'Learning Hours', val: 1000, suffix: '+', color: 'text-[#2ECC71]' },
            ].map((stat, i) => (
              <div key={i} className={i !== 0 ? 'pt-6 lg:pt-0' : ''}>
                <div className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight ${stat.color}`}>
                  <AnimatedCounter end={stat.val} suffix={stat.suffix} />
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-600 mt-2 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ===== CAMPUS HIGHLIGHTS FEATURE CARDS ===== */}
        <div className="my-24 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-[#F7931E] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              WORLD-CLASS ENVIRONMENT
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900">
              Designed for Excellence
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {campusHighlights.map((highlight, idx) => (
              <div
                key={idx}
                className="p-7 rounded-[28px] bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-slate-300 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 w-fit group-hover:scale-110 transition-transform">
                    {highlight.icon}
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">{highlight.title}</h4>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {highlight.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== BOTTOM CTA GLASS BANNER ===== */}
        <div className="relative rounded-[32px] bg-gradient-to-r from-[#0057B8] via-[#00418A] to-[#002855] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-white/10">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00BFFF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-amber-300 uppercase tracking-widest">
              <span>Join Veezna Today</span>
            </div>

            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
              Become Part of the Veezna Community
            </h3>

            <p className="text-slate-200 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Discover a place where learning, creativity and personal growth come together.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#visit-us"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95"
              >
                Visit Us
              </a>
              <a
                href="#book-demo"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                Book a Free Demo
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}