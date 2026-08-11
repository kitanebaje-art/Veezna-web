'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

export default function AdmissionCTA() {
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setCardTilt({ x: y * -10, y: x * 10 });
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setCardTilt({ x: 0, y: 0 });
  }, []);

  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-br from-[#071A33] via-[#003B73] to-[#0057B8] text-white overflow-hidden font-sans">
      {/* Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[450px] h-[450px] bg-[#F7931E]/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[450px] h-[450px] bg-[#0057B8]/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Geometric Grid Mesh Overlay */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10 [perspective:1000px]">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
            transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
            transformStyle: 'preserve-3d',
          }}
          className="rounded-[40px] bg-white/10 border border-white/20 backdrop-blur-2xl p-8 sm:p-14 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)] relative overflow-hidden"
        >
          {/* Top Gradient Highlight Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0057B8] via-[#00BFFF] to-[#F7931E]" />

          <div className="space-y-6 [transform:translateZ(20px)]">
            {/* Admissions Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E] animate-pulse" />
              <span className="text-xs font-black tracking-widest uppercase text-orange-200">
                Admissions Open for New Cohort
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12]">
              Start Your Journey Toward Real{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-[#F7931E]">
                Capability.
              </span>
            </h2>

            {/* Human-Centered Body Text */}
            <p className="text-base sm:text-lg lg:text-xl text-blue-100/90 max-w-2xl mx-auto font-normal leading-relaxed">
              Every learner has potential waiting to be unlocked. Join us to build true conceptual understanding, speak with natural confidence, and develop skills for life.
            </p>

            {/* Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 [transform:translateZ(30px)]">
              <Link
                href="/apply"
                className="w-full sm:w-auto px-9 py-4 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-extrabold text-base shadow-xl shadow-[#F7931E]/30 transition-all duration-300 hover:scale-105 active:scale-95 text-center"
              >
                Enquire Now
              </Link>

              <a
                href="https://wa.me/+919001170039"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-9 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-white font-extrabold text-base backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-2.5"
              >
                <span> Chat on WhatsApp</span>
              </a>
            </div>

            {/* Trust Assurance Pills */}
            <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-blue-200/90 [transform:translateZ(15px)]">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                Focused Batch Sizes
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                 Personal Mentorship
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                Practical Capability
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}