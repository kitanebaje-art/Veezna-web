'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

// --- UTILITY COMPONENT: ANIMATED COUNTER ---
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

export default function VeeznaLearningSystemPage() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activePipeline, setActivePipeline] = useState<number>(0);
  const [activeProfile, setActiveProfile] = useState<number>(0);
  const [activeDimension, setActiveDimension] = useState<number>(0);
  const [activeSessionStep, setActiveSessionStep] = useState<number>(0);

  // 3D Tilt State
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const steps = [
    {
      num: '01',
      title: 'Learn',
      badge: 'FOUNDATION',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      description: 'Build deep conceptual understanding from the fundamentals.',
      examples: ['Concept clarity', 'Structured lessons', 'Question-based learning', 'Expert guidance', 'Strong foundations'],
    },
    {
      num: '02',
      title: 'Practice',
      badge: 'APPLICATION',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Turn understanding into ability through deliberate practice.',
      examples: ['Exercises', 'Assignments', 'Problem solving', 'Quizzes', 'Real-time application', 'Feedback'],
    },
    {
      num: '03',
      title: 'Communicate',
      badge: 'EXPRESSION',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      description: 'Learn to express your knowledge with clarity and confidence.',
      examples: ['Speaking', 'VOX Spoken English', 'Discussions', 'Presentations', 'Public speaking', 'Confidence building'],
    },
    {
      num: '04',
      title: 'Create',
      badge: 'HANDS-ON',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      description: 'Transform knowledge into something real.',
      examples: ['Projects', 'Portfolio work', 'Experiments', 'Creative tasks', 'Real-world challenges', 'Practical output'],
    },
    {
      num: '05',
      title: 'Grow',
      badge: 'PERSONAL DEVELOPMENT',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'Develop the mindset and habits required for sustainable growth.',
      examples: ['Confidence', 'Discipline', 'Leadership', 'Emotional awareness', 'Goal setting', 'Wellness balance'],
    },
    {
      num: '06',
      title: 'Achieve',
      badge: 'OUTCOME',
      icon: (
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      description: 'Use your combined knowledge and capabilities to move toward meaningful outcomes.',
      examples: ['Career readiness', 'Certifications', 'Portfolio', 'Skill confidence', 'Higher-level learning', 'Long-term capability'],
    },
  ];

  const pipelineNodes = [
    { id: 'input', title: 'INPUT', subtitle: 'Curiosity & Goals', description: 'Curiosity, questions, and baseline learning goals drive the entry point.' },
    { id: 'understanding', title: 'UNDERSTANDING', subtitle: 'Core Fundamentals', description: 'Build strong conceptual foundations through interactive discovery.' },
    { id: 'practice', title: 'PRACTICE', subtitle: 'Deliberate Application', description: 'Apply what you learn repeatedly until it becomes second nature.' },
    { id: 'expression', title: 'EXPRESSION', subtitle: 'Confident Articulation', description: 'Communicate your ideas clearly to peers and mentors.' },
    { id: 'creation', title: 'CREATION', subtitle: 'Tangible Output', description: 'Build something real with your knowledge via practical projects.' },
    { id: 'growth', title: 'GROWTH', subtitle: 'Mindset & Discipline', description: 'Develop confidence, personal discipline, and a resilient mindset.' },
    { id: 'capability', title: 'CAPABILITY', subtitle: 'Real-World Readiness', description: 'Become ready to use your skills independently in life and career.' },
  ];

  const dimensions = [
    {
      id: 'knowledge',
      dimension: 'KNOWLEDGE',
      ring: 'ACADEMICS',
      definition: 'Deep conceptual clarity rather than rote memorization.',
      importance: 'Acts as the foundation for analytical thought and problem-solving.',
      vlsApproach: 'Question-driven lessons with structured academic guidance.',
    },
    {
      id: 'skills',
      dimension: 'SKILLS',
      ring: 'PRACTICE',
      definition: 'The ability to perform techniques and tasks accurately.',
      importance: 'Bridges theoretical ideas with functional execution.',
      vlsApproach: 'Daily practical exercises, assignments, and guided feedback.',
    },
    {
      id: 'communication',
      dimension: 'COMMUNICATION',
      ring: 'EXPRESSION',
      definition: 'Clear articulation of ideas in spoken and written formats.',
      importance: 'Ensures knowledge can be shared, defended, and collaborated on.',
      vlsApproach: 'VOX Spoken English, presentations, and group discussions.',
    },
    {
      id: 'creativity',
      dimension: 'CREATIVITY',
      ring: 'PROJECTS',
      definition: 'Synthesizing ideas to build unique, practical solutions.',
      importance: 'Encourages innovation and adaptability in novel situations.',
      vlsApproach: 'Hands-on projects, portfolio creation, and real-world tasks.',
    },
    {
      id: 'confidence',
      dimension: 'CONFIDENCE',
      ring: 'MINDSET',
      definition: 'Self-belief rooted in demonstrated competence.',
      importance: 'Overcomes fear of failure and encourages active participation.',
      vlsApproach: 'Incremental success milestones and public speaking opportunities.',
    },
    {
      id: 'character',
      dimension: 'CHARACTER',
      ring: 'WELLNESS',
      definition: 'Discipline, emotional awareness, and ethical clarity.',
      importance: 'Sustains long-term personal success and ethical leadership.',
      vlsApproach: 'Holistic mentorship, goal tracking, and balanced wellness.',
    },
  ];

  const sessionSteps = [
    { num: '01', title: 'CONNECT', desc: 'Teacher connects with the learner and identifies the learning goal.' },
    { num: '02', title: 'EXPLAIN', desc: 'The concept is explained clearly with real-world context.' },
    { num: '03', title: 'QUESTION', desc: 'Learners ask, explore, and challenge their understanding.' },
    { num: '04', title: 'PRACTISE', desc: 'Learners solve, speak, perform, or apply live.' },
    { num: '05', title: 'FEEDBACK', desc: 'The learner receives targeted correction and positive guidance.' },
    { num: '06', title: 'REFLECT', desc: 'Learner identifies what was understood and areas to refine.' },
    { num: '07', title: 'APPLY', desc: 'The learner uses the knowledge in an extended practical task.' },
  ];

  const learnerProfiles = [
    {
      id: 'curious',
      title: 'THE CURIOUS LEARNER',
      tagline: 'Needs deeper understanding.',
      need: 'Wants to know the "why" behind every concept rather than just formulas.',
      vlsSolution: 'Provides question-based modules and underlying principles that satisfy intellectual curiosity.',
      icon: (
        <svg className="w-6 h-6 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'quiet',
      title: 'THE QUIET LEARNER',
      tagline: 'Needs confidence and expression.',
      need: 'Understands concepts internally but hesitates to speak up or present ideas.',
      vlsSolution: 'Offers safe, structured speaking exercises in small groups to build natural fluency and poise.',
      icon: (
        <svg className="w-6 h-6 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      ),
    },
    {
      id: 'struggling',
      title: 'THE STRUGGLING LEARNER',
      tagline: 'Needs clarity and guided practice.',
      need: 'Gets overwhelmed by fast-paced classroom lectures and complex assignments.',
      vlsSolution: 'Breaks lessons into clear, digestible steps with step-by-step guidance and deliberate practice.',
      icon: (
        <svg className="w-6 h-6 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      id: 'fast',
      title: 'THE FAST LEARNER',
      tagline: 'Needs challenges and deeper application.',
      need: 'Grows bored when instruction moves at an average pace without extension tasks.',
      vlsSolution: 'Unlocks advanced project tracks, creative challenges, and real-world problem solving.',
      icon: (
        <svg className="w-6 h-6 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      id: 'creative',
      title: 'THE CREATIVE LEARNER',
      tagline: 'Needs opportunities to build and experiment.',
      need: 'Thrives when allowed to make, design, and express ideas in hands-on formats.',
      vlsSolution: 'Integrates portfolio-building tasks, coding projects, and multi-media assignments.',
      icon: (
        <svg className="w-6 h-6 text-[#0057B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V4zM4 7a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V7zM18 7a2 2 0 114 0v1a2 2 0 01-2 2 2 2 0 01-2-2V7z" />
        </svg>
      ),
    },
    {
      id: 'futureready',
      title: 'THE FUTURE-READY LEARNER',
      tagline: 'Needs skills beyond textbooks.',
      need: 'Wants an education that prepares them for higher studies, careers, and life leadership.',
      vlsSolution: 'Combines academic perfection with personality growth, discipline, and practical capability.',
      icon: (
        <svg className="w-6 h-6 text-[#F7931E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11.085" />
        </svg>
      ),
    },
  ];

  const realWorldPathway = [
    { title: 'TEXTBOOK', desc: 'Raw information input' },
    { title: 'CONCEPT', desc: 'Deep understanding' },
    { title: 'PRACTICE', desc: 'Deliberate repetition' },
    { title: 'SKILL', desc: 'Demonstrated technique' },
    { title: 'PROJECT', desc: 'Practical output' },
    { title: 'CONFIDENCE', desc: 'Self-belief in ability' },
    { title: 'CAPABILITY', desc: 'Functional mastery' },
    { title: 'REAL WORLD', desc: 'Success in life' },
  ];

  // Automatic Rotation
  useEffect(() => {
    if (isPaused || prefersReducedMotion) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPaused, steps.length, prefersReducedMotion]);

  // 3D Tilt Handlers
  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setHeroTilt({ x: y * -15, y: x * 15 });
    },
    [prefersReducedMotion]
  );

  const handleCardMouseMove = useCallback(
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
    setHeroTilt({ x: 0, y: 0 });
    setCardTilt({ x: 0, y: 0 });
    setIsPaused(false);
  }, []);

  const currentStep = steps[activeStep];

  return (
    <div className="bg-[#F7FAFF] text-[#071A33] font-sans overflow-x-hidden selection:bg-[#F7931E]/20 selection:text-[#0057B8]">
      
      {/* SECTION 1: HERO & 3D ORBITING ECOSYSTEM */}
      <section className="relative min-h-[90vh] flex items-center py-20 bg-gradient-to-b from-[#071A33] via-[#003B73] to-[#0057B8] text-white overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#F7931E]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-32 w-96 h-96 bg-[#0057B8]/30 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* HERO LEFT TEXT */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase text-orange-200">
                  THE VEEZNA LEARNING SYSTEM
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
                Learning That Turns Knowledge Into{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-200 to-[#F7931E]">
                  Capability.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100/90 font-normal leading-relaxed max-w-2xl mx-auto lg:mx-0">
                VLS is Veezna&apos;s structured learning methodology designed to help learners understand deeply, practise consistently, communicate confidently, create practically, grow personally, and achieve meaningfully.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#journey"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-lg shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95 text-center"
                >
                  Explore VLS
                </a>
                <a
                  href="#stages"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-base backdrop-blur-md transition-all hover:scale-105 active:scale-95 text-center"
                >
                  See the Learning Journey
                </a>
              </div>

              <div className="pt-6 border-t border-white/10 text-xs font-semibold text-blue-200/80 tracking-wide uppercase">
                Knowledge • Practice • Communication • Creation • Growth • Achievement
              </div>
            </div>

            {/* HERO RIGHT 3D ORBIT VISUAL (CLICKABLE FIX APPLIED HERE) */}
            <div
              ref={heroRef}
              onMouseMove={handleHeroMouseMove}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={handleMouseLeave}
              className="lg:col-span-6 flex justify-center items-center relative py-12 [perspective:1000px]"
            >
              <div
                style={{
                  transform: `rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg)`,
                  transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
                  transformStyle: 'preserve-3d',
                }}
                className="relative w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] flex items-center justify-center pointer-events-none"
              >
                {/* Orbital Tracks */}
                <div className="absolute inset-0 rounded-full border border-white/15 border-dashed animate-spin-ultra-slow pointer-events-none" />
                <div className="absolute inset-8 rounded-full border border-white/10 pointer-events-none" />

                {/* CENTRAL 3D VLS NODE */}
                <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-white/10 border border-white/30 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center p-3 text-center pointer-events-auto [transform:translateZ(20px)]">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#0057B8] to-[#F7931E] flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-md mb-1">
                    VLS
                  </div>
                  <span className="font-extrabold text-white text-xs sm:text-sm tracking-tight">
                    {steps[activeStep].title}
                  </span>
                  <span className="text-[9px] text-orange-300 font-bold tracking-widest uppercase">
                    STAGE {steps[activeStep].num}
                  </span>
                </div>

                {/* 6 ORBITING NODES WITH EXPLICIT POINTER EVENTS & Z-INDEX */}
                {steps.map((st, i) => {
                  const angle = (i * 360) / steps.length - 90;
                  const radius = 135;
                  const radiusSm = 180;
                  const rad = (angle * Math.PI) / 180;

                  const xSm = Math.cos(rad) * radiusSm;
                  const ySm = Math.sin(rad) * radiusSm;

                  const isActive = activeStep === i;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveStep(i);
                        setIsPaused(true);
                      }}
                      style={{
                        transform: `translate(${xSm}px, ${ySm}px)`,
                      }}
                      className={`absolute z-30 w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer border pointer-events-auto ${
                        isActive
                          ? 'bg-[#F7931E] border-white text-white shadow-xl shadow-[#F7931E]/50 scale-125 ring-4 ring-white/40'
                          : 'bg-white/20 hover:bg-white/40 border-white/30 text-white backdrop-blur-md hover:scale-110'
                      }`}
                      aria-label={`Select stage ${st.num}: ${st.title}`}
                    >
                      <div>{st.icon}</div>
                      <span className="text-[9px] font-black">{st.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2: "WHAT IS VLS?" & INTERACTIVE DIAGRAM */}
      <section id="journey" className="py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              CORE METHODOLOGY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              What Exactly Is VLS?
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              VLS is not just a syllabus. It is the way Veezna transforms learning into real capability.
            </p>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {pipelineNodes.map((node, i) => {
                const isActive = activePipeline === i;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setActivePipeline(i)}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 cursor-pointer relative overflow-hidden ${
                      isActive
                        ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-lg shadow-[#0057B8]/20 -translate-y-1'
                        : 'bg-[#F7FAFF] text-slate-700 border-slate-200/80 hover:border-[#0057B8]'
                    }`}
                  >
                    <div className="text-[10px] font-black tracking-widest opacity-80 mb-1">
                      0{i + 1}
                    </div>
                    <div className="text-xs font-extrabold uppercase tracking-wider block">
                      {node.title}
                    </div>
                    <div className={`text-[11px] mt-1 line-clamp-1 ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                      {node.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-[#F7FAFF] border border-slate-200/80 shadow-sm transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6 mb-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-[#F7931E]">
                    TRANSFORMATION STEP 0{activePipeline + 1} OF 07
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-[#071A33] mt-1">
                    {pipelineNodes[activePipeline].title}
                  </h3>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-bold uppercase tracking-wider">
                  {pipelineNodes[activePipeline].subtitle}
                </span>
              </div>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-3xl">
                {pipelineNodes[activePipeline].description}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: THE SIX VLS STAGES */}
      <section id="stages" className="py-20 lg:py-28 bg-[#F7FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              STRUCTURED PROGRESSION
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              Your Journey Through VLS
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              A 6-stage progressive model designed to turn curiosity into functional life mastery.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            {steps.map((s, idx) => {
              const isActive = activeStep === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveStep(idx);
                    setIsPaused(true);
                  }}
                  className={`p-4 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border text-center cursor-pointer ${
                    isActive
                      ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-lg scale-105 ring-4 ring-[#0057B8]/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-[#0057B8] hover:bg-slate-50'
                  }`}
                >
                  <div className={`mb-2 ${isActive ? 'text-white' : 'text-[#0057B8]'}`}>
                    {s.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    STAGE {s.num}
                  </span>
                  <span className="text-sm font-extrabold">{s.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center [perspective:1000px]">
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={handleMouseLeave}
              style={{
                transform: `rotateX(${cardTilt.x}deg) rotateY(${cardTilt.y}deg)`,
                transition: prefersReducedMotion ? 'none' : 'transform 0.15s ease-out',
                transformStyle: 'preserve-3d',
              }}
              className="w-full max-w-3xl rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 shadow-xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-6 mb-6 [transform:translateZ(20px)]">
                <div>
                  <span className="text-xs font-black text-[#F7931E] uppercase tracking-widest">
                    STAGE {currentStep.num} OF 06
                  </span>
                  <h3 className="text-3xl font-black text-[#071A33] mt-1">
                    {currentStep.title} Stage
                  </h3>
                </div>
                <span className="px-4 py-1.5 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-bold uppercase tracking-wider">
                  {currentStep.badge}
                </span>
              </div>

              <div key={activeStep} className="space-y-6 [transform:translateZ(30px)]">
                <p className="text-lg text-slate-700 leading-relaxed font-medium">
                  {currentStep.description}
                </p>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
                    WHAT HAPPENS IN THIS STAGE:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentStep.examples.map((ex, i) => (
                      <span
                        key={i}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7FAFF] border border-slate-200/80 text-slate-700 text-xs font-bold"
                      >
                        ✓ {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 [transform:translateZ(15px)]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
                      setIsPaused(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                  >
                    ← Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStep((prev) => (prev + 1) % steps.length);
                      setIsPaused(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#0057B8] hover:bg-[#00418A] text-white font-bold text-xs transition"
                  >
                    Next Stage →
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                  <span>Stage {currentStep.num} of 06</span>
                  <button
                    type="button"
                    onClick={() => setIsPaused(!isPaused)}
                    className="text-[#0057B8] hover:underline"
                  >
                    {isPaused ? 'Resume Auto-Tour' : 'Pause'}
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4: THE VLS DIFFERENCE */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              METHODOLOGY COMPARISON
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              The VLS Difference
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              VLS complements academic learning by adding practical capability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-6">
              <div className="inline-block px-4 py-1.5 rounded-full bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider">
                TRADITIONAL APPROACH
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                Memorize → Test → Score
              </h3>
              <ul className="space-y-4 text-sm text-slate-600 font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">✕</span>
                  <span>Focuses mainly on storing information for tests.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">✕</span>
                  <span>Learning typically ends when the examination concludes.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">✕</span>
                  <span>Teacher explains passively while learners listen.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-slate-400 font-bold">✕</span>
                  <span>Marks alone measure success and performance.</span>
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#071A33] to-[#0057B8] text-white shadow-xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#F7931E]/10 rounded-full blur-2xl pointer-events-none" />
              <div className="inline-block px-4 py-1.5 rounded-full bg-[#F7931E] text-white text-xs font-black uppercase tracking-wider">
                VEEZNA LEARNING SYSTEM
              </div>
              <h3 className="text-2xl font-black text-white">
                Understand → Practise → Communicate → Create → Grow → Achieve
              </h3>
              <ul className="space-y-4 text-sm text-blue-100 font-medium">
                <li className="flex items-start gap-3">
                  <span className="text-[#F7931E] font-bold">✓</span>
                  <span>Focuses on developing long-term real-world capability.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F7931E] font-bold">✓</span>
                  <span>Learning continues actively through practical application.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F7931E] font-bold">✓</span>
                  <span>Teacher guides while the learner actively participates.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#F7931E] font-bold">✓</span>
                  <span>Evaluates knowledge, skills, confidence, and creation.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 5: 360° LEARNING MODEL */}
      <section className="py-20 lg:py-28 bg-[#F7FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              HOLISTIC DEVELOPMENT
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              The 360° Learning Model
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              Education is bigger than marks. Veezna builds six core dimensions around the learner.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 grid grid-cols-2 gap-3">
              {dimensions.map((dim, i) => {
                const isActive = activeDimension === i;
                return (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => setActiveDimension(i)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-300 cursor-pointer ${
                      isActive
                        ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-lg shadow-[#0057B8]/20 scale-105'
                        : 'bg-white text-slate-700 border-slate-200/80 hover:border-[#0057B8]'
                    }`}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block">
                      RING: {dim.ring}
                    </span>
                    <span className="text-base font-black tracking-tight mt-1 block">
                      {dim.dimension}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-6 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200/80 shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-black uppercase tracking-widest text-[#F7931E]">
                  INNER CORE: THE LEARNER
                </span>
                <span className="px-3 py-1 rounded-full bg-[#0057B8]/10 text-[#0057B8] text-xs font-bold">
                  {dimensions[activeDimension].ring}
                </span>
              </div>

              <h3 className="text-3xl font-black text-[#071A33]">
                {dimensions[activeDimension].dimension}
              </h3>

              <div className="space-y-4 text-sm text-slate-600">
                <div>
                  <strong className="text-[#071A33] block text-xs uppercase tracking-wider mb-1">
                    What it means:
                  </strong>
                  <p>{dimensions[activeDimension].definition}</p>
                </div>
                <div>
                  <strong className="text-[#071A33] block text-xs uppercase tracking-wider mb-1">
                    Why it matters:
                  </strong>
                  <p>{dimensions[activeDimension].importance}</p>
                </div>
                <div>
                  <strong className="text-[#071A33] block text-xs uppercase tracking-wider mb-1">
                    How Veezna develops it:
                  </strong>
                  <p>{dimensions[activeDimension].vlsApproach}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 6: HOW A VEEZNA CLASS WORKS */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              INSIDE THE CLASSROOM
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              What Happens Inside a Veezna Learning Session?
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              A structured 7-step flow in every session ensures no student is left behind.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-2">
              {sessionSteps.map((st, i) => {
                const isActive = activeSessionStep === i;
                return (
                  <button
                    key={st.num}
                    type="button"
                    onClick={() => setActiveSessionStep(i)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center gap-4 cursor-pointer ${
                      isActive
                        ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-md'
                        : 'bg-[#F7FAFF] text-slate-700 border-slate-200/80 hover:border-[#0057B8]'
                    }`}
                  >
                    <span className="text-xs font-black">{st.num}</span>
                    <span className="text-sm font-extrabold uppercase tracking-wider">
                      {st.title}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-7 p-8 sm:p-12 rounded-3xl bg-[#F7FAFF] border border-slate-200/80 shadow-sm space-y-6">
              <span className="text-xs font-black text-[#F7931E] uppercase tracking-widest">
                SESSION STEP {sessionSteps[activeSessionStep].num} OF 07
              </span>
              <h3 className="text-3xl font-black text-[#071A33]">
                {sessionSteps[activeSessionStep].title}
              </h3>
              <p className="text-lg text-slate-700 leading-relaxed">
                {sessionSteps[activeSessionStep].desc}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 7: VLS IS FOR DIFFERENT LEARNERS */}
      <section className="py-20 lg:py-28 bg-[#F7FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              LEARNER-CENTRIC MODEL
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              VLS Is For Different Learners
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              Every child processes information differently. VLS adapts to individual strengths.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learnerProfiles.map((profile, i) => {
              const isActive = activeProfile === i;
              return (
                <div
                  key={profile.id}
                  onClick={() => setActiveProfile(i)}
                  className={`p-8 rounded-3xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white border-[#0057B8] shadow-xl ring-2 ring-[#0057B8]/20 -translate-y-1'
                      : 'bg-white/80 border-slate-200/80 hover:border-[#0057B8]'
                  }`}
                >
                  <div className="mb-4">{profile.icon}</div>
                  <h3 className="text-xl font-black text-[#071A33]">
                    {profile.title}
                  </h3>
                  <p className="text-xs font-bold text-[#F7931E] uppercase tracking-wider mt-1 mb-4">
                    {profile.tagline}
                  </p>
                  <div className="space-y-3 text-xs text-slate-600">
                    <p>
                      <strong>Need:</strong> {profile.need}
                    </p>
                    <p className="text-slate-800 font-medium">
                      <strong>VLS Solution:</strong> {profile.vlsSolution}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* SECTION 8: FROM CLASSROOM TO REAL WORLD */}
      <section className="py-20 lg:py-28 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              PATHWAY TO MASTERY
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              From Classroom to Real World
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              A linear progression bridging theoretical inputs with practical execution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {realWorldPathway.map((path, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-[#F7FAFF] border border-slate-200/80 text-center space-y-2 hover:border-[#0057B8] transition"
              >
                <div className="text-[10px] font-black text-[#0057B8]">0{i + 1}</div>
                <div className="text-xs font-black text-[#071A33] uppercase">{path.title}</div>
                <div className="text-[10px] text-slate-500">{path.desc}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-lg font-bold text-[#0057B8]">
              &ldquo;Knowledge becomes powerful when you can use it.&rdquo;
            </p>
          </div>

        </div>
      </section>

      {/* SECTION 9: VLS OUTCOMES */}
      <section className="py-20 lg:py-28 bg-[#F7FAFF]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-black tracking-widest text-[#0057B8] uppercase">
              TANGIBLE OUTCOMES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
              What The Learner Becomes
            </h2>
            <p className="text-lg text-slate-600 font-normal">
              VLS equips students with verifiable capabilities that endure far beyond school years.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Stronger Concepts', desc: 'Clear understanding of core academic fundamentals.' },
              { title: 'Better Communication', desc: 'Confidence to speak and present effectively.' },
              { title: 'Practical Skills', desc: 'Ability to solve real-world problems.' },
              { title: 'Greater Confidence', desc: 'Self-belief rooted in demonstrated capability.' },
              { title: 'Independent Thinking', desc: 'Ability to analyze and evaluate options.' },
              { title: 'Career Readiness', desc: 'Skills that prepare learners for higher education and beyond.' },
            ].map((outcome, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center space-y-3"
              >
                <h3 className="text-xl font-black text-[#071A33]">{outcome.title}</h3>
                <p className="text-sm text-slate-600">{outcome.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { label: 'Learning Approach', val: 360, suffix: '°' },
              { label: 'Practical Focus', val: 100, suffix: '%' },
              { label: 'VLS Stages', val: 6, suffix: '' },
              { label: 'Core Pillars', val: 4, suffix: '' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm text-center"
              >
                <div className="text-3xl sm:text-4xl font-black text-[#071A33]">
                  <AnimatedCounter end={stat.val} suffix={stat.suffix} />
                </div>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 10: VLS PHILOSOPHY */}
      <section className="py-24 bg-[#071A33] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#0057B8_1px,transparent_1px),linear-gradient(to_bottom,#0057B8_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <span className="text-xs font-black tracking-widest text-orange-300 uppercase">
            OUR PHILOSOPHY
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            At Veezna, We Don&apos;t Just Teach Subjects.
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 font-normal leading-relaxed max-w-3xl mx-auto">
            &ldquo;We help learners build the ability to understand, express, create, and grow.&rdquo;
          </p>

          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-sm font-black tracking-wider text-orange-300">
            <span>LEARN</span>
            <span>→</span>
            <span>THINK</span>
            <span>→</span>
            <span>EXPRESS</span>
            <span>→</span>
            <span>CREATE</span>
            <span>→</span>
            <span>GROW</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 lg:py-28 bg-gradient-to-b from-white to-[#F7FAFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl sm:text-5xl font-black text-[#071A33] tracking-tight">
            Ready to Experience Learning Differently?
          </h2>
          <p className="text-lg text-slate-600 font-normal max-w-2xl mx-auto">
            Discover how Veezna can help you turn learning into confidence, skills, and real-world capability.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/#programs"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F7931E] hover:bg-[#e07f0f] text-white font-bold text-base shadow-xl shadow-[#F7931E]/30 transition-all hover:scale-105 active:scale-95 text-center"
            >
              Explore Programs
            </Link>
            <Link
              href="/apply"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#0057B8] hover:bg-[#00418A] text-white font-bold text-base shadow-xl shadow-[#0057B8]/30 transition-all hover:scale-105 active:scale-95 text-center"
            >
              Start Your Veezna Journey
            </Link>
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes spinUltraSlow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-ultra-slow {
          animation: spinUltraSlow 50s linear infinite;
        }
      `}</style>

    </div>
  );
}