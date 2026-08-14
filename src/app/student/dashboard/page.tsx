'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import Image from 'next/image';

// ==========================================
// ADVANCED 3D TILT CARD
// ==========================================
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  glowColor = 'rgba(0, 87, 184, 0.12)',
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState(
    'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)'
  );
  const [glareStyle, setGlareStyle] = useState({ opacity: 0, x: '50%', y: '50%' });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
          2
        )}deg) translateZ(8px)`
      );

      setGlareStyle({
        opacity: 0.15,
        x: `${((x / rect.width) * 100).toFixed(1)}%`,
        y: `${((y / rect.height) * 100).toFixed(1)}%`,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)');
    setGlareStyle({ opacity: 0, x: '50%', y: '50%' });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStyle,
        transition: 'transform 0.18s cubic-bezier(0.1, 0.8, 0.3, 1)',
        willChange: 'transform',
      }}
      className={`relative rounded-3xl transition-all duration-300 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-20"
        style={{
          background: `radial-gradient(circle at ${glareStyle.x} ${glareStyle.y}, rgba(255,255,255,0.8) 0%, transparent 60%)`,
          opacity: glareStyle.opacity,
        }}
      />
      {children}
    </div>
  );
};

export default function StudentDashboardPage() {
  const router = useRouter();
  const { studentData, activeEnrollment, loading, error } = useStudentAuth(true);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // LOGOUT HANDLER
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut(auth);
      router.push('/student/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      setIsSigningOut(false);
    }
  };

  // Student Initials Helper
  const getInitials = (name?: string) => {
    if (!name) return 'ST';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // --------------------------------------------------
  // LOADING SKELETON
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="relative z-10 w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-36 bg-slate-200 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-10 bg-slate-200 rounded-full animate-pulse" />
          </div>

          <div className="h-56 w-full bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm animate-pulse">
            <div className="space-y-3">
              <div className="h-8 w-72 bg-slate-200 rounded-lg" />
              <div className="h-4 w-48 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-12 w-52 bg-[#0057B8]/30 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-white border border-slate-200 rounded-2xl p-5 animate-pulse space-y-3"
              >
                <div className="h-4 w-20 bg-slate-200 rounded" />
                <div className="h-8 w-16 bg-slate-100 rounded" />
              </div>
            ))}
          </div>

          <div className="text-center pt-4">
            <p className="text-xs tracking-widest uppercase text-slate-400 font-bold animate-pulse">
              Syncing Veezna Student Portal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // ERROR STATE
  // --------------------------------------------------
  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
            <p className="text-sm text-slate-600">
              {error || 'Unable to verify student profile. Please sign in again.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/student/login')}
              className="flex-1 py-3 px-4 bg-[#0057B8] hover:bg-[#004494] text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/10"
            >
              Return to Login
            </button>
            <button
              onClick={handleSignOut}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-800 font-sans selection:bg-[#0057B8] selection:text-white relative overflow-x-hidden">
      {/* Ambient Background Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0057B8]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#F7931E]/6 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ================================================== */}
        {/* 1. TOP NAVIGATION WITH VEEZNA OFFICIAL LOGO       */}
        {/* ================================================== */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            
            {/* VEEZNA LOGO BRAND SECTION */}
            <div className="flex items-center gap-3">
              <div
                className="relative cursor-pointer flex items-center gap-3 group"
                onClick={() => router.push('/vls')}
              >
                {!logoError ? (
                  <div className="relative h-10 w-36 sm:w-44 flex items-center">
                    <Image
                      src="/logo.png"
                      alt="Veezna Logo"
                      fill
                      priority
                      className="object-contain object-left transition-transform group-hover:scale-[1.02]"
                      onError={() => setLogoError(true)}
                    />
                  </div>
                ) : (
                  /* High-Precision Fallback Wordmark if image asset is renamed */
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-2xl tracking-tight text-[#0057B8] leading-none">
                        VEEZNA
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
                    </div>
                    <span className="text-[9px] font-extrabold tracking-widest text-slate-400 uppercase mt-0.5">
                      Education Portal
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Center Search Bar (Desktop) */}
            <div className="hidden md:flex items-center flex-1 max-w-sm mx-6">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search courses, modules, topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200/80 focus:bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-blue-500/10 text-xs font-medium text-slate-800 outline-none transition"
                />
                <svg
                  className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="w-10 h-10 rounded-xl bg-slate-100/80 border border-slate-200 hover:bg-slate-200/60 flex items-center justify-center text-slate-600 transition relative focus:outline-none"
                  aria-label="View notifications"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#F7931E] rounded-full ring-2 ring-white" />
                </button>

                {/* Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 text-xs z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                      <span className="font-bold text-slate-900">Notifications</span>
                      <span className="text-[10px] bg-blue-50 text-[#0057B8] px-2 py-0.5 rounded-full font-semibold">
                        System Active
                      </span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-700">
                      <p className="font-semibold text-slate-900 mb-0.5">Veezna Portal Active</p>
                      <p className="text-slate-500 text-[11px]">
                        Your enrollment is synced across all learning modules.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Student Profile */}
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="w-10 h-10 rounded-xl bg-[#0057B8] flex items-center justify-center font-extrabold text-white text-sm shadow-sm">
                  {getInitials(studentData.name)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-900 max-w-[120px] truncate">
                    {studentData.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ID: {studentData.studentId}
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 focus:outline-none"
              >
                <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {/* ================================================== */}
          {/* BRAND DIVISIONS BAR                                */}
          {/* ================================================== */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-extrabold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-[#0057B8]" />
                <span>Veezna Core Divisions</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
                {[
                  { title: 'VLS Engine', label: 'Learning System', color: 'text-blue-600', bg: 'bg-blue-50' },
                  { title: 'V-CPM Test', label: 'Cognitive Mapping', color: 'text-orange-600', bg: 'bg-orange-50' },
                  { title: 'Academic Hub', label: 'Excellence Division', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { title: 'Wellness Framework', label: 'Mind & Growth', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((brand, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-300 transition cursor-default"
                  >
                    <div className={`w-7 h-7 rounded-lg ${brand.bg} ${brand.color} flex items-center justify-center font-black text-xs`}>
                      {brand.title[0]}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 leading-tight">{brand.title}</div>
                      <div className="text-[9px] text-slate-400 font-medium">{brand.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* 2. WELCOME HERO SECTION                            */}
          {/* ================================================== */}
          <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#003B7E] via-[#0057B8] to-blue-700 shadow-xl p-6 sm:p-10 text-white">
            <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
                  <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-ping" />
                  <span>Class: {studentData.academicClass || 'General'}</span>
                  <span>•</span>
                  <span>ID: {studentData.studentId}</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  Good Morning, {studentData.name} 👋
                </h1>

                <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                  Ready to continue your learning journey? Step into your personal space and build real confidence today.
                </p>
              </div>

              <button
                onClick={() => router.push('/vls')}
                className="group relative inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-[#F7931E] hover:bg-amber-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] active:scale-95 focus:outline-none"
              >
                <span>Continue Learning</span>
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </section>

          {/* ================================================== */}
          {/* 3 & 4. LEARNING JOURNEY + QUICK STATS GRID        */}
          {/* ================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card3D className="lg:col-span-2 bg-white border border-slate-200/90 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-sm">
              <div className="absolute top-0 left-0 right-0 h-1 bg-[#0057B8]" />

              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚀</span>
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      My Current Journey
                    </h2>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                      activeEnrollment?.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activeEnrollment?.status || 'Active'}
                  </span>
                </div>

                {activeEnrollment ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Enrolled Course</span>
                      <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                        {activeEnrollment.courseId || 'General Curriculum'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-500 block">Batch Code</span>
                        <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                          {activeEnrollment.batchId || 'Default Batch'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Start Date</span>
                        <span className="font-medium text-slate-800 text-sm mt-0.5 block">
                          {activeEnrollment.startDate || 'Registered'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    <p className="text-sm font-medium">No active course enrollment record found.</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Contact your Veezna system administrator for assignment.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Veezna VLS System</span>
                <button
                  onClick={() => router.push('/vls')}
                  className="text-xs font-bold text-[#0057B8] hover:text-[#004494] flex items-center gap-1 transition"
                >
                  <span>Open Space</span>
                  <span>→</span>
                </button>
              </div>
            </Card3D>

            <div className="grid grid-cols-2 gap-4">
              <Card3D className="bg-white border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Progress</span>
                  <span className="text-[#0057B8] text-sm">📊</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-extrabold text-slate-900">0%</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Not started</p>
                </div>
              </Card3D>

              <Card3D className="bg-white border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Streak</span>
                  <span className="text-[#F7931E] text-sm">🔥</span>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-extrabold text-slate-900">0 Days</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">No activity yet</p>
                </div>
              </Card3D>

              <Card3D className="bg-white border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-semibold">Course</span>
                  <span className="text-emerald-600 text-sm">📚</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {activeEnrollment?.courseId || 'Enrolled'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Current track</p>
                </div>
              </Card3D>

              <Card3D className="bg-[#0057B8] text-white border border-blue-600 p-5 flex flex-col justify-between shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-blue-100 font-semibold">Status</span>
                  <span className="text-[#F7931E] text-sm">⚡</span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-bold text-white uppercase">
                    {activeEnrollment?.status || 'Active'}
                  </p>
                  <p className="text-[10px] text-blue-100 font-medium mt-1">Verified account</p>
                </div>
              </Card3D>
            </div>
          </div>

          {/* ================================================== */}
          {/* 5. YOUR LEARNING SPACE                             */}
          {/* ================================================== */}
          <section className="space-y-4">
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Your Learning Space
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => router.push('/vls')}
                className="group cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 hover:border-[#0057B8]/40 p-5 rounded-2xl transition-all duration-200 space-y-3 shadow-sm hover:shadow-md"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                  ▶
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Continue Learning</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Jump directly into your active VLS path.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0057B8] inline-flex items-center gap-1 pt-1">
                  Launch Space →
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 opacity-75 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    📖
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">My Course Modules</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Detailed syllabus and chapter breakdown.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 opacity-75 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    📈
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Analytics &amp; Score</h3>
                  <p className="text-xs text-slate-500 mt-1">Track quiz scores and practice speed.</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 opacity-75 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F7931E] flex items-center justify-center font-bold">
                    📁
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                    Coming Soon
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Resource Library</h3>
                  <p className="text-xs text-slate-500 mt-1">Downloadable guides and worksheets.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ================================================== */}
          {/* 6. VEEZNA VLS FEATURE CARD                         */}
          {/* ================================================== */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-[#0057B8]">
                  <span>Structured Learning Engine</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Veezna Learning System (VLS)
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Your structured path from initial concept clarity to complete exam confidence.
                </p>
              </div>

              <button
                onClick={() => router.push('/vls')}
                className="px-6 py-3.5 rounded-xl bg-[#0057B8] hover:bg-[#004494] text-white font-bold text-sm shadow-md shadow-blue-500/10 transition whitespace-nowrap self-start lg:self-center"
              >
                Launch VLS Portal →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-100">
              {[
                { step: '01', title: 'Learn', desc: 'Core Concepts' },
                { step: '02', title: 'Practice', desc: 'Guided Exercises' },
                { step: '03', title: 'Understand', desc: 'Deep Clarity' },
                { step: '04', title: 'Apply', desc: 'Real Testing' },
              ].map((m) => (
                <div
                  key={m.step}
                  className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:border-blue-200 transition"
                >
                  <span className="text-[10px] font-mono text-[#F7931E] font-bold">{m.step}</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{m.title}</p>
                  <p className="text-[11px] text-slate-500">{m.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ================================================== */}
          {/* 7 & 8. AI MENTOR & ANNOUNCEMENTS                   */}
          {/* ================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#0057B8] flex items-center justify-center font-bold text-sm">
                      🤖
                    </span>
                    <h3 className="font-bold text-slate-900 text-base">Veezna AI Mentor</h3>
                  </div>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full border border-slate-200">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ask instant questions, clarify complex topic doubts, and practice with guided AI
                  learning support tailored to your curriculum.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs border border-slate-200 cursor-not-allowed"
                >
                  AI Assistant Unavailable
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>📢</span>
                  <span>Platform Updates</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-400">Official</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-[10px] font-semibold text-[#F7931E] block uppercase tracking-wider">
                  Veezna Learning Engine
                </span>
                <p className="text-xs font-bold text-slate-900">
                  Your learning portal is fully synchronized.
                </p>
                <p className="text-xs text-slate-500">
                  Access live curriculum through VLS. Regular updates will appear here.
                </p>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* 9. LEARNING ROADMAP METHODOLOGY                    */}
          {/* ================================================== */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="text-center max-w-lg mx-auto space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#F7931E]">
                Veezna Methodology
              </h3>
              <p className="text-lg font-extrabold text-slate-900">The 5-Step Path to Excellence</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {[
                { num: '01', label: 'Discover' },
                { num: '02', label: 'Learn' },
                { num: '03', label: 'Practice' },
                { num: '04', label: 'Apply' },
                { num: '05', label: 'Grow' },
              ].map((s, idx) => (
                <div
                  key={s.num}
                  className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center relative group hover:border-blue-200 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-[#0057B8] font-bold font-mono text-xs flex items-center justify-center mx-auto mb-2">
                    {s.num}
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">{s.label}</span>
                  {idx < 4 && (
                    <span className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs z-10">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* ================================================== */}
        {/* 10. FOOTER                                         */}
        {/* ================================================== */}
        <footer className="border-t border-slate-200/80 bg-white mt-auto py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">VEEZNA</span>
              <span>•</span>
              <span>Student Ecosystem</span>
            </div>
            <p className="font-medium text-slate-500">Vision Turns Into Mission</p>
          </div>
        </footer>
      </div>
    </div>
  );
}