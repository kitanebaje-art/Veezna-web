'use client';

import React, { useState, useRef } from 'react';

interface ProgramCardProps {
  title: string;
  category: string;
  description: string;
  features: string[];
  bannerGradient: string;
  badgeBg: string;
  badgeText: string;
  glowColor: string;
  icon: React.ReactNode;
  slug: string;
}

const programsData: ProgramCardProps[] = [
  {
    title: 'Academic Excellence',
    category: 'School Education',
    description:
      'Concept-based coaching for Classes 6–12 with board exam preparation, doubt solving, regular assessments, and personalized guidance.',
    features: ['Small Batches', 'Weekly Tests', 'Personal Mentoring'],
    bannerGradient: 'from-[#0057B8] via-[#00BFFF] to-[#3B82F6]',
    badgeBg: 'bg-blue-50 text-[#0057B8] border-blue-200/60',
    glowColor: 'rgba(0, 87, 184, 0.15)',
    slug: 'academic-excellence',
    icon: (
      <svg className="w-7 h-7 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      </svg>
    ),
  },
  {
    title: 'Veezna Vox',
    category: 'Communication Skills',
    description:
      'Build fluent spoken English, confidence, public speaking, interviews, and personality development.',
    features: ['Daily Speaking Practice', 'Group Discussions', 'Interview Training'],
    bannerGradient: 'from-[#F7931E] via-[#FFB74D] to-[#F59E0B]',
    badgeBg: 'bg-amber-50 text-[#F7931E] border-amber-200/60',
    glowColor: 'rgba(247, 147, 30, 0.18)',
    slug: 'veezna-vox',
    icon: (
      <svg className="w-7 h-7 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    title: 'Web Development',
    category: 'Technology',
    description:
      'Master HTML, CSS, JavaScript, React, Next.js, AI tools, and modern web development through hands-on projects.',
    features: ['Live Projects', 'Portfolio Building', 'Industry Skills'],
    bannerGradient: 'from-[#00BFFF] via-[#06B6D4] to-[#0284C7]',
    badgeBg: 'bg-cyan-50 text-[#0284C7] border-cyan-200/60',
    glowColor: 'rgba(0, 191, 255, 0.18)',
    slug: 'web-development',
    icon: (
      <svg className="w-7 h-7 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    title: 'AI & Digital Skills',
    category: 'Future Skills',
    description:
      'Learn prompt engineering, AI productivity tools, automation, and digital workflows for the modern workplace.',
    features: ['Practical AI Tools', 'Automation Basics', 'Real-world Use Cases'],
    bannerGradient: 'from-[#8B5CF6] via-[#A855F7] to-[#6366F1]',
    badgeBg: 'bg-purple-50 text-[#8B5CF6] border-purple-200/60',
    glowColor: 'rgba(139, 92, 246, 0.18)',
    slug: 'ai-digital-skills',
    icon: (
      <svg className="w-7 h-7 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: 'Wellness & Counselling',
    category: 'Personal Growth',
    description:
      'Support for emotional well-being, stress management, confidence building, and career counselling.',
    features: ['One-to-One Guidance', 'Wellness Sessions', 'Career Counselling'],
    bannerGradient: 'from-[#10B981] via-[#059669] to-[#047857]',
    badgeBg: 'bg-emerald-50 text-[#059669] border-emerald-200/60',
    glowColor: 'rgba(16, 185, 129, 0.18)',
    slug: 'wellness-counselling',
    icon: (
      <svg className="w-7 h-7 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    title: 'Career Guidance',
    category: 'Success Planning',
    description:
      'Receive mentorship for higher education, competitive exams, career planning, and professional development.',
    features: ['Career Roadmaps', 'Goal Planning', 'Expert Mentorship'],
    bannerGradient: 'from-[#EC4899] via-[#F43F5E] to-[#E11D48]',
    badgeBg: 'bg-rose-50 text-[#E11D48] border-rose-200/60',
    glowColor: 'rgba(236, 72, 153, 0.18)',
    slug: 'career-guidance',
    icon: (
      <svg className="w-7 h-7 text-[#E11D48]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l6-6-6-6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16" />
      </svg>
    ),
  },
];

function ProgramCard({ program }: { program: ProgramCardProps }) {
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

    const tiltX = (y - centerY) / 20;
    const tiltY = (centerX - x) / 20;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative group">
      {/* Dynamic Hover Background Glow */}
      <div
        className="absolute inset-0 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ backgroundColor: program.glowColor }}
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
        className="relative h-full flex flex-col justify-between rounded-[32px] bg-white/80 border border-slate-200/80 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_50px_rgba(0,87,184,0.12)] hover:border-slate-300 transition-all duration-300 ease-out overflow-hidden z-10"
      >
        {/* Top Gradient Banner */}
        <div className={`h-3.5 w-full bg-gradient-to-r ${program.bannerGradient}`} />

        <div className="p-7 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Header Meta: Category Badge & Icon */}
            <div className="flex items-center justify-between">
              <span
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${program.badgeBg}`}
              >
                {program.category}
              </span>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm transition-transform duration-300 group-hover:scale-110">
                {program.icon}
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-[#0057B8] transition-colors">
                {program.title}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed font-normal">
                {program.description}
              </p>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {/* Feature Chips */}
            <div className="flex flex-wrap gap-2">
              {program.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-slate-700 text-xs font-semibold"
                >
                  <svg className="w-3.5 h-3.5 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </span>
              ))}
            </div>

            {/* Action CTA Button */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={`#${program.slug}`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 hover:bg-[#0057B8] text-slate-800 hover:text-white font-bold text-sm border border-slate-200 hover:border-[#0057B8] shadow-sm transition-all duration-300 group/btn"
              >
                <span>Learn More</span>
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExploreOurPrograms() {
  return (
    <section className="relative py-24 lg:py-36 bg-gradient-to-b from-[#FFFFFF] via-[#F4F8FC] to-[#F8FAFC] text-[#1E293B] overflow-hidden">
      {/* Background Decorative Layer */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Soft Ambient Radial Orbs */}
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-blue-100/40 rounded-full blur-[140px] -translate-x-1/2" />
        <div className="absolute bottom-1/3 right-0 w-[650px] h-[650px] bg-amber-100/30 rounded-full blur-[150px] translate-x-1/3" />

        {/* Geometric Grid Texture */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#0057B8] animate-ping" />
            <span className="text-xs font-extrabold tracking-widest text-[#0057B8] uppercase">
              TRANSFORMATIVE OFFERINGS
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
            Explore Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]">
              Programs
            </span>
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 font-normal leading-relaxed">
            Choose the learning path that matches your ambition and unlock your full potential.
          </p>
        </div>

        {/* Programs Grid: 2x3 Desktop, 2 Tablet, 1 Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 mb-20">
          {programsData.map((program, idx) => (
            <ProgramCard key={idx} program={program} />
          ))}
        </div>

        {/* Full-width Bottom Guidance CTA Banner */}
        <div className="relative rounded-[32px] bg-gradient-to-r from-[#0057B8] via-[#00418A] to-[#002855] text-white p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden border border-white/10">
          {/* Ambient Lighting effects */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#00BFFF]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold text-amber-300 uppercase tracking-widest">
              <span>Need Guidance?</span>
            </div>

            <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Not Sure Which Program Is Right for You?
            </h3>

            <p className="text-slate-200 text-sm sm:text-base lg:text-lg font-normal leading-relaxed max-w-2xl mx-auto">
              Our mentors will help you choose the best learning path based on your goals, strengths, and interests.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#book-counselling"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95"
              >
                Book Free Counselling
              </a>
              <a
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}