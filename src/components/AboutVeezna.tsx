'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';

interface VisionTab {
  id: string;
  title: string;
  badge: string;
  heading: string;
  description: string;
  pillars: { icon: string; title: string; subtitle: string }[];
}

export default function AboutVeezna() {
  const [activeTab, setActiveTab] = useState<number>(0);
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

  const tabs: VisionTab[] = [
    {
      id: 'vision',
      title: 'Our Vision',
      badge: 'FUTURE-READY',
      heading: 'Clarity. Confidence. Capability.',
      description:
  'We help learners truly understand what they study, speak with confidence, and build practical skills that stay with them for life.',
      pillars: [
        { icon: '', title: 'Knowledge Development', subtitle: 'Deep conceptual clarity' },
        { icon: '', title: 'Confidence Building', subtitle: 'VOX Spoken Expression' },
        { icon: '', title: 'Career Growth', subtitle: 'Real-world execution' },
      ],
    },
    {
      id: 'mission',
      title: 'Our Mission',
      badge: 'PURPOSE DRIVEN',
      heading: 'Clarity With Compassionate Care.',
      description:
        'To transform education into an active journey of self-belief, deliberate practice, emotional strength, and functional capability.',
      pillars: [
        { icon: '', title: 'Actionable Learning', subtitle: 'Hands-on practical projects' },
        { icon: '', title: 'Mentorship First', subtitle: '1-on-1 personal guidance' },
        { icon: '', title: 'Holistic Mindset', subtitle: 'Discipline and wellness balance' },
      ],
    },
    {
      id: 'values',
      title: 'Core Values',
      badge: 'FOUNDATIONAL',
      heading: 'Principles That Shape Excellence.',
      description:
        'We believe real education must change how a learner thinks, communicates, acts, and contributes in the real world.',
      pillars: [
        { icon: '⚡', title: 'Integrity & Rigor', subtitle: 'No shortcuts to mastery' },
        { icon: '💡', title: 'Inquisitive Mindset', subtitle: 'Encouraging question-based discovery' },
        { icon: '🌍', title: 'Global Capability', subtitle: 'Future-ready skillsets' },
      ],
    },
  ];

  // 3D Mouse Tilt Calculation
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setCardTilt({ x: y * -12, y: x * 12 });
    },
    [prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setCardTilt({ x: 0, y: 0 });
  }, []);

  const currentTab = tabs[activeTab];

  return (
    <section
      id="about"
      className="relative py-24 lg:py-32 bg-gradient-to-br from-[#071A33] via-[#003B73] to-[#0057B8] text-white overflow-hidden font-sans"
    >
      {/* Background Ambient Orbs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#F7931E]/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#0057B8]/30 rounded-full blur-[140px] pointer-events-none" />

      {/* Architectural Geometric Mesh Lines */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* LEFT CONTENT */}
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
              <span className="text-xs font-extrabold tracking-widest text-orange-200 uppercase">
                ABOUT VEEZNA
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Building Skills.{' '}
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-[#F7931E]">
                Creating Possibilities.
              </span>
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-blue-100/90 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              <p>
                Veezna is a modern learning space designed to help you build the skills, mindset, and confidence required for real-world success. Whether you are aiming for academic excellence, mastering communication, or seeking personal direction, we provide structured coaching and compassionate mentorship to guide your journey every step of the way.
              </p>
              <p className="text-sm sm:text-base text-blue-200/80 font-medium border-l-2 border-[#F7931E] pl-4 text-left">
                We combine academic support, communication practice, wellness guidance, and future-ready skills to help you achieve real, lasting growth.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                href="/about"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-extrabold text-base shadow-xl shadow-[#F7931E]/30 transition-all duration-300 hover:scale-105 active:scale-95 text-center"
              >
                Know More About Veezna
              </Link>
            </div>
          </div>

          {/* RIGHT SIDE 3D INTERACTIVE CARD */}
          <div className="lg:col-span-6 flex justify-center [perspective:1000px]">
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
                transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d',
              }}
              className="w-full max-w-lg rounded-[36px] bg-white/10 border border-white/20 backdrop-blur-2xl p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.3)] relative overflow-hidden"
            >
              {/* Glass Reflection Highlight */}
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

              {/* CARD TABS SWITCHER */}
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6 [transform:translateZ(20px)]">
                <div className="flex gap-1.5 p-1 rounded-2xl bg-black/20 backdrop-blur-md border border-white/10">
                  {tabs.map((tab, idx) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                        activeTab === idx
                          ? 'bg-[#0057B8] text-white shadow-md'
                          : 'text-blue-200 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab.title}
                    </button>
                  ))}
                </div>

                <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-[#F7931E]/20 border border-[#F7931E]/40 text-[#F7931E] text-[10px] font-black uppercase tracking-wider">
                  {currentTab.badge}
                </span>
              </div>

              {/* DYNAMIC CONTENT */}
              <div key={activeTab} className="space-y-6 [transform:translateZ(30px)]">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {currentTab.heading}
                  </h3>
                  <p className="mt-3 text-sm text-blue-100/90 leading-relaxed font-normal">
                    {currentTab.description}
                  </p>
                </div>

                {/* PILLARS LIST */}
                <div className="space-y-3 pt-2">
                  {currentTab.pillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl p-4 transition-all duration-200"
                    >
                      <span className="text-2xl">{pillar.icon}</span>
                      <div>
                        <h4 className="text-sm font-extrabold text-white">
                          {pillar.title}
                        </h4>
                        <p className="text-xs text-blue-200/80 font-medium mt-0.5">
                          {pillar.subtitle}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CARD FOOTER */}
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-blue-200/80 [transform:translateZ(15px)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2ECC71] animate-ping" />
                  <span>Interactive Ecosystem</span>
                </div>
                <span className="text-[10px] uppercase font-black tracking-widest text-[#F7931E]">
                  VEEZNA VLS
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}