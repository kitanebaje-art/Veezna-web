// src/components/programs/ProgramCTA.tsx
import React from 'react';
import Link from 'next/link';

interface ProgramCTAProps {
  title?: string;
  description?: string;
  programSlug?: string;
  buttonText?: string;
}

export const ProgramCTA: React.FC<ProgramCTAProps> = ({
  title = 'Ready to Elevate Your Trajectory?',
  description = 'Join a network of driven learners, industry mentors, and transformative cohorts at VEEZNA.',
  programSlug,
  buttonText = 'Apply for Admission',
}) => {
  const targetUrl = programSlug ? `/apply?program=${programSlug}` : '/apply';

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0057B8] via-[#004494] to-[#002D62] text-white p-8 sm:p-12 my-12 shadow-xl">
      <div className="relative z-10 max-w-3xl">
        <h3 className="text-2xl sm:text-4xl font-extrabold mb-4">{title}</h3>
        <p className="text-blue-100 text-sm sm:text-base leading-relaxed mb-8">{description}</p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={targetUrl}
            className="px-6 py-3 rounded-xl bg-[#F7931E] hover:bg-orange-600 text-white font-bold text-sm transition-colors shadow-lg"
          >
            {buttonText}
          </Link>
          <Link
            href="/programs"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-colors"
          >
            Explore Other Programs
          </Link>
        </div>
      </div>
    </section>
  );
};