'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

interface SimulationSubject {
  id: string;
  name: string;
  category: string;
  badge: string;
  standardApproach: {
    title: string;
    description: string;
    result: string;
  };
  veeznaTransformation: {
    conceptBreakdown: string;
    voxPractice: string;
    realWorldProject: string;
    mindsetOutcome: string;
  };
}

export default function VeeznaTransformationLab() {
  const [activeSubject, setActiveSubject] = useState<number>(0);
  const [activePhase, setActivePhase] = useState<'concept' | 'vox' | 'project' | 'mindset'>('concept');
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

  const subjects: SimulationSubject[] = [
    {
      id: 'accounts',
      name: 'Class 11/12 Accountancy',
      category: 'Academic Excellence',
      badge: 'Board Preparation',
      standardApproach: {
        title: 'Rote Journal Entries',
        description: 'Memorizing debits and credits from textbook questions for upcoming exams.',
        result: 'Confused when non-standard financial scenarios or board trick questions appear.',
      },
      veeznaTransformation: {
        conceptBreakdown: 'V-CPM Cognitive Mapping connects business events to financial statements.',
        voxPractice: 'Student presents and defends balance sheet adjustments in front of peers.',
        realWorldProject: 'Analyzing a real company balance sheet to evaluate financial health.',
        mindsetOutcome: 'Unshakeable confidence in financial logic and board exam readiness.',
      },
    },
    {
      id: 'vox-english',
      name: 'VOX Spoken English',
      category: 'Communication',
      badge: 'Public Speaking',
      standardApproach: {
        title: 'Passive Grammar Exercises',
        description: 'Filling grammar worksheets without actual public speaking or conversational practice.',
        result: 'Knows grammar rules on paper but hesitates and stammers during real speeches.',
      },
      veeznaTransformation: {
        conceptBreakdown: 'Deconstructing vocal modulation, body language, and sentence structure.',
        voxPractice: 'Live impromptu speeches, structured debates, and peer interaction sessions.',
        realWorldProject: 'Delivering a live 3-minute presentation or podcast episode.',
        mindsetOutcome: 'Natural fluency, poise, and zero stage fright in public settings.',
      },
    },
    {
      id: 'science',
      name: 'Secondary Science & Maths',
      category: 'Stem & Logic',
      badge: 'Conceptual Mastery',
      standardApproach: {
        title: 'Formula Memorization',
        description: 'Cramming definitions and steps to solve textbook numerical problems.',
        result: 'Difficulty applying concepts to real-world physics or competitive scenarios.',
      },
      veeznaTransformation: {
        conceptBreakdown: 'Interactive visual discovery of the core principles behind every formula.',
        voxPractice: 'Explaining science experiments aloud to teach fellow classmates.',
        realWorldProject: 'Building hands-on models and practical science demonstrations.',
        mindsetOutcome: 'Inquisitive mindset that approaches complex problems logically.',
      },
    },
    {
      id: 'personality',
      name: 'Personality & Leadership',
      category: 'Personal Growth',
      badge: 'Life Readiness',
      standardApproach: {
        title: 'Generic Advice Lectures',
        description: 'Listening passively to moral stories without habit tracking or accountability.',
        result: 'No long-term change in personal discipline, time management, or focus.',
      },
      veeznaTransformation: {
        conceptBreakdown: 'Self-awareness diagnostics and personalized goal setting.',
        voxPractice: 'Daily routine tracking, public commitment, and 1-on-1 mentorship.',
        realWorldProject: 'Leading a team project, event planning, or peer group workshop.',
        mindsetOutcome: 'Strong personal discipline, emotional awareness, and leadership capability.',
      },
    },
  ];

  // 3D Tilt calculation
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

  const currentSubject = subjects[activeSubject];

  return (
    <section className="py-24 bg-[#071A33] text-white relative overflow-hidden">
      {/* Background Decorative Grid */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      
      {/* Ambient Lighting Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0057B8]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#F7931E]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
            <span className="text-xs font-black tracking-widest text-orange-200 uppercase">
              INTERACTIVE METHODOLOGY SIMULATOR
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            See How Veezna Transforms Learning
          </h2>

          <p className="text-blue-100/90 text-base sm:text-lg leading-relaxed font-normal">
            Select a subject area below to simulate how Veezna elevates ordinary textbook subjects into lifelong capabilities.
          </p>
        </div>

        {/* SUBJECT SELECTOR TABS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {subjects.map((sub, idx) => {
            const isActive = activeSubject === idx;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  setActiveSubject(idx);
                  setActivePhase('concept');
                }}
                className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                  isActive
                    ? 'bg-[#0057B8] text-white border-white/40 shadow-xl shadow-[#0057B8]/40 scale-[1.02] ring-2 ring-white/20'
                    : 'bg-white/5 hover:bg-white/10 text-blue-100 border-white/10'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300 block mb-1">
                  {sub.badge}
                </span>
                <span className="text-base font-extrabold tracking-tight block">
                  {sub.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* MAIN 3D SIMULATION TERMINAL */}
        <div className="flex justify-center [perspective:1000px]">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
              transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
              transformStyle: 'preserve-3d',
            }}
            className="w-full rounded-3xl bg-white/10 border border-white/20 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl relative overflow-hidden"
          >
            {/* TERMINAL HEADER */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-6 mb-8 [transform:translateZ(20px)]">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#F7931E]">
                  ACTIVE SIMULATION TRACK
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {currentSubject.name}
                </h3>
              </div>

              <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-extrabold uppercase tracking-wider text-blue-200">
                {currentSubject.category}
              </span>
            </div>

            {/* COMPARISON GRID */}
            <div className="grid lg:grid-cols-12 gap-8 items-stretch [transform:translateZ(30px)]">
              
              {/* LEFT: STANDARD APPROACH */}
              <div className="lg:col-span-4 p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="inline-block px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black uppercase tracking-wider">
                  STANDARD ROTE METHOD
                </div>

                <h4 className="text-xl font-black text-white">
                  {currentSubject.standardApproach.title}
                </h4>

                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
                  {currentSubject.standardApproach.description}
                </p>

                <div className="pt-4 border-t border-white/10">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block mb-1">
                    TYPICAL OUTCOME:
                  </span>
                  <p className="text-xs text-rose-200/90 font-medium">
                    ✕ {currentSubject.standardApproach.result}
                  </p>
                </div>
              </div>

              {/* RIGHT: VEEZNA 4-STEP TRANSFORMATION */}
              <div className="lg:col-span-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#0057B8]/40 to-[#071A33] border border-[#0057B8] space-y-6">
                
                <div className="flex items-center justify-between">
                  <div className="inline-block px-3 py-1 rounded-full bg-[#F7931E] text-white text-xs font-black uppercase tracking-wider">
                    VEEZNA METHODOLOGY
                  </div>
                  <span className="text-xs font-bold text-blue-200">
                    Interactive Steps ↓
                  </span>
                </div>

                {/* PHASE TOGGLES */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'concept', label: '1. Concept' },
                    { id: 'vox', label: '2. VOX Practice' },
                    { id: 'project', label: '3. Project' },
                    { id: 'mindset', label: '4. Mindset' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePhase(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition ${
                        activePhase === p.id
                          ? 'bg-[#F7931E] text-white shadow-md'
                          : 'bg-white/10 hover:bg-white/20 text-blue-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* ACTIVE PHASE EXPLANATION */}
                <div className="p-5 rounded-xl bg-white/10 border border-white/15 space-y-2 min-h-[110px] flex flex-col justify-center">
                  {activePhase === 'concept' && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">
                        STEP 1: V-CPM CONCEPT BREAKDOWN
                      </span>
                      <p className="text-sm text-white font-semibold">
                        {currentSubject.veeznaTransformation.conceptBreakdown}
                      </p>
                    </>
                  )}

                  {activePhase === 'vox' && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">
                        STEP 2: VOX EXPRESSION & DISCUSSIONS
                      </span>
                      <p className="text-sm text-white font-semibold">
                        {currentSubject.veeznaTransformation.voxPractice}
                      </p>
                    </>
                  )}

                  {activePhase === 'project' && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">
                        STEP 3: PRACTICAL REAL-WORLD APPLICATION
                      </span>
                      <p className="text-sm text-white font-semibold">
                        {currentSubject.veeznaTransformation.realWorldProject}
                      </p>
                    </>
                  )}

                  {activePhase === 'mindset' && (
                    <>
                      <span className="text-[10px] font-black uppercase tracking-wider text-orange-300">
                        STEP 4: LONG-TERM CAPABILITY OUTCOME
                      </span>
                      <p className="text-sm text-white font-semibold">
                        ✓ {currentSubject.veeznaTransformation.mindsetOutcome}
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <p className="text-xs text-blue-200">
                    Click each step above to simulate how students build complete understanding.
                  </p>
                  <a
                    href="/apply"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-extrabold text-xs tracking-wider transition text-center"
                  >
                    Experience VLS Live
                  </a>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}