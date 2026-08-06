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
    badgeText: 'Recommended',
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
    badgeText: 'Popular',
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
    badgeText: 'Trending',
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
    badgeText: 'Future Skill',
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
    badgeText: 'Support',
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
    badgeText: 'Guidance',
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

    setTilt({
      x: (y - centerY) / 20,
      y: (centerX - x) / 20,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div className="relative group">

      <div
        className="absolute inset-0 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          backgroundColor: program.glowColor,
        }}
      />

      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: isHovered
            ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-8px)`
            : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        }}
        className="relative h-full flex flex-col rounded-[32px] bg-white/80 border border-slate-200 backdrop-blur-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
      >

        <div className={`h-3 w-full bg-gradient-to-r ${program.bannerGradient}`} />

        <div className="p-7 flex flex-col gap-6">

          <div className="flex justify-between items-center">

            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${program.badgeBg}`}
            >
              {program.badgeText}
            </span>


            <div className="p-3 rounded-2xl bg-slate-50">
              {program.icon}
            </div>

          </div>


          <div>
            <p className="text-xs uppercase text-slate-500 font-bold">
              {program.category}
            </p>

            <h3 className="text-2xl font-black text-slate-900 mt-2">
              {program.title}
            </h3>

            <p className="text-slate-600 mt-3 text-sm leading-relaxed">
              {program.description}
            </p>
          </div>


          <div className="flex flex-wrap gap-2">

            {program.features.map((feature, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-semibold"
              >
                ✓ {feature}
              </span>
            ))}

          </div>


          <a
            href={`#${program.slug}`}
            className="w-full text-center py-3 rounded-xl bg-slate-100 hover:bg-[#0057B8] hover:text-white font-bold transition"
          >
            Learn More →
          </a>

        </div>

      </div>

    </div>
  );
}



export default function ExploreOurPrograms() {

  return (

    <section className="relative py-24 bg-gradient-to-b from-white via-[#F4F8FC] to-white">

      <div className="max-w-7xl mx-auto px-6">


        <div className="text-center mb-16">

          <span className="px-4 py-2 rounded-full bg-white border text-[#0057B8] text-xs font-bold">
            TRANSFORMATIVE OFFERINGS
          </span>


          <h2 className="text-5xl font-black mt-6">
            Explore Our
            <span className="text-[#0057B8]"> Programs</span>
          </h2>


          <p className="text-slate-600 mt-4">
            Choose the learning path that matches your ambition.
          </p>

        </div>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

          {programsData.map((program, index) => (
            <ProgramCard
              key={index}
              program={program}
            />
          ))}

        </div>


        <div className="mt-20 rounded-[32px] bg-gradient-to-r from-[#0057B8] to-[#002855] text-white p-12 text-center">

          <h3 className="text-4xl font-black">
            Not Sure Which Program Is Right for You?
          </h3>

          <p className="mt-4 text-slate-200">
            Our mentors will help you choose the best learning path.
          </p>


          <div className="mt-8 flex justify-center gap-4 flex-wrap">

            <a
              href="#book-counselling"
              className="px-8 py-4 bg-[#F7931E] rounded-2xl font-bold"
            >
              Book Free Counselling
            </a>


            <a
              href="#contact"
              className="px-8 py-4 bg-white/10 rounded-2xl font-bold border border-white/20"
            >
              Contact Us
            </a>

          </div>

        </div>


      </div>

    </section>

  );
}