// src/app/student/dashboard/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStudentAuth } from '@/hooks/useStudentAuth';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { studentData, activeEnrollment, loading, error } = useStudentAuth(true);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/student/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading student portal...
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <p className="text-red-400 text-sm mb-4">{error || 'Unable to load profile.'}</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg hover:bg-slate-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              VEEZNA Student Ecosystem
            </span>
            <h1 className="text-2xl font-black text-white mt-0.5">
              Welcome back, {studentData.name}!
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Student ID: <span className="font-mono text-emerald-400">{studentData.studentId}</span> | Class: {studentData.academicClass}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            Sign Out
          </button>
        </header>

        {/* Core Prompt Card: What should I learn next? */}
        <div className="bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-8 rounded-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-3">
            <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30">
              MY NEXT STEP
            </span>
            <h2 className="text-3xl font-black text-white">What should I learn next?</h2>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Your structured learning path for <strong className="text-white">{studentData.academicClass}</strong> is active. Pick up directly where you left off in the Veezna Learning System (VLS).
            </p>
            <div className="pt-2">
              <button
                onClick={() => router.push('/vls')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
              >
                Continue Today&apos;s Learning Plan →
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Enrollment Info */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Current Enrollment
            </h3>
            {activeEnrollment ? (
              <div className="space-y-2">
                <p className="text-lg font-bold text-white">
                  {activeEnrollment.courseId}
                </p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>Batch: <span className="text-slate-200">{activeEnrollment.batchId}</span></div>
                  <div>Started: <span className="text-slate-200">{activeEnrollment.startDate}</span></div>
                  <div>
                    Status:{' '}
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md font-semibold">
                      {activeEnrollment.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active course enrollment found.</p>
            )}
          </div>

          {/* Quick Learning Stats */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Learning Activity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center pt-2">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-2xl font-black text-emerald-400">0</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Streak Days</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-2xl font-black text-emerald-400">0%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Course Progress</div>
              </div>
            </div>
          </div>

          {/* AI Mentor Callout */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-3 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                AI Companion
              </span>
              <h3 className="text-lg font-bold text-white mt-1">Veezna AI Mentor</h3>
              <p className="text-xs text-slate-400 mt-2">
                Ask questions, clarify concepts, or practice problem sets tailored to your active lessons.
              </p>
            </div>
            <button
              disabled
              className="w-full py-2 bg-slate-800 text-slate-500 font-semibold text-xs rounded-xl border border-slate-700/50 cursor-not-allowed"
            >
              Coming Soon in Phase 5
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}