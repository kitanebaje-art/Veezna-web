import React from 'react';
import Link from 'next/link';

const programs = [
  {
    title: 'Academic Excellence',
    category: 'Core Education',
    desc: 'Structured coaching for secondary and senior secondary boards with deep conceptual grounding and exam mastery.',
    tags: ['Board Prep', 'Accountancy', 'Mathematics', 'Science'],
    slug: 'academic-excellence',
    accent: '#0057B8',
  },
  {
    title: 'Veezna VOX',
    category: 'Communication Skills',
    desc: 'Transformative program focusing on spoken English, interview preparation, public speaking, and confidence building.',
    tags: ['Spoken English', 'Fluency', 'Public Speaking'],
    slug: 'spoken-english-vox',
    accent: '#F7931E',
  },
  {
    title: 'Web & Tech Mastery',
    category: 'Technology',
    desc: 'Practical software engineering and web development training covering modern tools and project delivery.',
    tags: ['Frontend', 'JavaScript', 'React', 'Full Stack'],
    slug: 'web-development',
    accent: '#00BFFF',
  },
  {
    title: 'Wellness & Counselling',
    category: 'Holistic Health',
    desc: 'Ethical, non-invasive support promoting mental clarity, academic stress management, and emotional equilibrium.',
    tags: ['Guidance', 'Stress Relief', 'Counseling'],
    slug: 'wellness-counselling',
    accent: '#10B981',
  },
];

export default function ProgramsGrid() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="text-xs font-bold text-[#F7931E] uppercase tracking-widest bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
              Transformative Offerings
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-4">
              Our Core Divisions
            </h2>
          </div>
          <p className="text-slate-600 max-w-md text-sm sm:text-base leading-relaxed">
            Tailored programs designed to equip learners with practical expertise, confidence, and career resilience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {programs.map((prog, idx) => (
            <div
              key={idx}
              className="rounded-3xl border border-slate-200/80 bg-slate-50/50 p-8 hover:bg-white hover:border-slate-300 transition-all hover-lift flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {prog.category}
                  </span>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: prog.accent }}
                  />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#0057B8] transition-colors">
                  {prog.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{prog.desc}</p>
              </div>

              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {prog.tags.map((t, i) => (
                    <span key={i} className="text-xs font-semibold text-slate-700 bg-slate-200/60 px-2.5 py-1 rounded-md">
                      {t}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/programs/${prog.slug}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#0057B8] hover:text-[#00438F] group-hover:translate-x-1 transition-transform"
                >
                  <span>Explore Curriculum & Details</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}