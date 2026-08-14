'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStudentAuth } from '@/hooks/useStudentAuth';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface CourseData {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  shortDescription?: string;
  thumbnail?: string;
  image?: string;
  duration?: string;
  level?: string;
  category?: string;
  status?: string;
}

export interface ModuleData {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  status?: string;
}

export interface LessonData {
  id: string;
  lessonId: string;
  courseId: string;
  moduleId: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration?: string;
  order: number;
  type?: 'video' | 'reading' | 'quiz' | string;
  status?: string;
}

export interface ProgressRecord {
  id: string;
  studentId?: string;
  uid?: string;
  courseId?: string;
  lessonId: string;
  completed: boolean;
  completedAt?: any;
}

// ==========================================
// 3D TILT CARD COMPONENT
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

      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(
          2
        )}deg) translateZ(6px)`
      );

      setGlareStyle({
        opacity: 0.12,
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
        boxShadow: `0 10px 25px -5px ${glowColor}, 0 4px 6px -2px rgba(0, 0, 0, 0.03)`,
        transition: 'transform 0.18s cubic-bezier(0.1, 0.8, 0.3, 1), box-shadow 0.18s ease-out',
        willChange: 'transform, box-shadow',
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

// ==========================================
// MAIN MY COURSE COMPONENT
// ==========================================

export default function StudentMyCoursePage() {
  const router = useRouter();
  const { studentData, activeEnrollment, loading: authLoading, error: authError } = useStudentAuth(true);

  // Data States
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  // UI States
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress' | 'not_started'>('all');

  // Load Course, Modules, Lessons, & Progress from Firestore
  useEffect(() => {
    async function loadCourseContent() {
      if (authLoading) return;
      if (!activeEnrollment || !activeEnrollment.courseId) {
        setDataLoading(false);
        return;
      }

      setDataLoading(true);
      setDataError(null);

      try {
        const rawCourseId = activeEnrollment.courseId.trim();

        // 1. Fetch Course Doc (Support Doc ID or courseId field match)
        let foundCourse: CourseData | null = null;

        // Try direct document ID reference first
        try {
          const docRef = doc(db, 'courses', rawCourseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const d = docSnap.data();
            foundCourse = {
              id: docSnap.id,
              courseId: d.courseId || docSnap.id,
              title: d.title || d.name || 'Untitled Course',
              description: d.description || d.shortDescription || '',
              shortDescription: d.shortDescription || '',
              thumbnail: d.thumbnail || d.image || '',
              duration: d.duration || 'Flexible',
              level: d.level || 'All Levels',
              category: d.category || 'General',
              status: d.status || 'active',
            };
          }
        } catch {
          // Fall through to query if doc fetch fails
        }

        // Query by courseId field if doc reference match wasn't found
        if (!foundCourse) {
          const courseQuery = query(collection(db, 'courses'), where('courseId', '==', rawCourseId));
          const courseSnap = await getDocs(courseQuery);
          if (!courseSnap.empty) {
            const firstDoc = courseSnap.docs[0];
            const d = firstDoc.data();
            foundCourse = {
              id: firstDoc.id,
              courseId: d.courseId || firstDoc.id,
              title: d.title || d.name || 'Untitled Course',
              description: d.description || d.shortDescription || '',
              shortDescription: d.shortDescription || '',
              thumbnail: d.thumbnail || d.image || '',
              duration: d.duration || 'Flexible',
              level: d.level || 'All Levels',
              category: d.category || 'General',
              status: d.status || 'active',
            };
          }
        }

        if (!foundCourse) {
          setDataLoading(false);
          return;
        }

        setCourse(foundCourse);
        const resolvedCourseId = foundCourse.courseId || foundCourse.id;

        // 2. Fetch Modules belonging to Course
        const modulesList: ModuleData[] = [];
        try {
          const qModules = query(collection(db, 'modules'), where('courseId', '==', resolvedCourseId));
          const modulesSnap = await getDocs(qModules);
          modulesSnap.forEach((docSnap) => {
            const md = docSnap.data();
            modulesList.push({
              id: docSnap.id,
              moduleId: md.moduleId || docSnap.id,
              courseId: md.courseId,
              title: md.title || md.name || 'Untitled Module',
              description: md.description || '',
              order: typeof md.order === 'number' ? md.order : 99,
              status: md.status || 'active',
            });
          });
        } catch (mErr) {
          console.warn('Modules query warning:', mErr);
        }

        // Sort modules by order
        modulesList.sort((a, b) => a.order - b.order);
        setModules(modulesList);

        // Auto-expand all modules initially
        const initialExpanded: Record<string, boolean> = {};
        modulesList.forEach((m) => {
          initialExpanded[m.moduleId] = true;
        });
        setExpandedModules(initialExpanded);

        // 3. Fetch Lessons belonging to Course
        const lessonsList: LessonData[] = [];
        try {
          const qLessons = query(collection(db, 'lessons'), where('courseId', '==', resolvedCourseId));
          const lessonsSnap = await getDocs(qLessons);
          lessonsSnap.forEach((docSnap) => {
            const ld = docSnap.data();
            lessonsList.push({
              id: docSnap.id,
              lessonId: ld.lessonId || docSnap.id,
              courseId: ld.courseId,
              moduleId: ld.moduleId || '',
              title: ld.title || ld.name || 'Untitled Lesson',
              description: ld.description || '',
              content: ld.content || '',
              videoUrl: ld.videoUrl || '',
              duration: ld.duration || '',
              order: typeof ld.order === 'number' ? ld.order : 99,
              type: ld.type || (ld.videoUrl ? 'video' : 'reading'),
              status: ld.status || 'active',
            });
          });
        } catch (lErr) {
          console.warn('Lessons query warning:', lErr);
        }

        // Sort lessons by order
        lessonsList.sort((a, b) => a.order - b.order);
        setLessons(lessonsList);

        // 4. Fetch Student Progress
        const completedSet = new Set<string>();
        if (studentData) {
          const sId = studentData.studentId || studentData.id;
          try {
            const qProgress = query(
              collection(db, 'progress'),
              where('studentId', '==', sId)
            );
            const progressSnap = await getDocs(qProgress);
            progressSnap.forEach((docSnap) => {
              const pd = docSnap.data();
              if (pd.completed && pd.lessonId) {
                completedSet.add(pd.lessonId);
              }
            });
          } catch {
            // Check fallback for uid match if progress query by studentId is empty
            try {
              if (studentData.uid) {
                const qProgressUid = query(
                  collection(db, 'progress'),
                  where('uid', '==', studentData.uid)
                );
                const progressUidSnap = await getDocs(qProgressUid);
                progressUidSnap.forEach((docSnap) => {
                  const pd = docSnap.data();
                  if (pd.completed && pd.lessonId) {
                    completedSet.add(pd.lessonId);
                  }
                });
              }
            } catch (pErr) {
              console.warn('Progress query warning:', pErr);
            }
          }
        }

        setCompletedLessonIds(completedSet);
      } catch (err: any) {
        console.error('Error fetching course curriculum:', err);
        setDataError('Unable to load your course right now. Please check your connection.');
      } finally {
        setDataLoading(false);
      }
    }

    loadCourseContent();
  }, [authLoading, activeEnrollment, studentData]);

  // Compute Overall Real Progress Percentage
  const progressMetrics = useMemo(() => {
    const total = lessons.length;
    if (total === 0) return { completedCount: 0, totalCount: 0, percentage: 0 };

    let completedCount = 0;
    lessons.forEach((l) => {
      if (completedLessonIds.has(l.lessonId) || completedLessonIds.has(l.id)) {
        completedCount++;
      }
    });

    const percentage = Math.round((completedCount / total) * 100);
    return { completedCount, totalCount: total, percentage };
  }, [lessons, completedLessonIds]);

  // Find First Incomplete or First Lesson for "Continue Learning" CTA
  const firstActionableLesson = useMemo(() => {
    if (lessons.length === 0) return null;
    const incomplete = lessons.find(
      (l) => !completedLessonIds.has(l.lessonId) && !completedLessonIds.has(l.id)
    );
    return incomplete || lessons[0];
  }, [lessons, completedLessonIds]);

  // Handle Module Accordion Toggle
  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Safe Navigation Handler for Lesson Clicks
  const handleLessonClick = (lesson: LessonData) => {
    if (!course) return;
    const resolvedCourseKey = course.courseId || course.id;
    const resolvedLessonKey = lesson.lessonId || lesson.id;
    
    // Route to student course lesson view
    router.push(`/student/course/${resolvedCourseKey}/${resolvedLessonKey}`);
  };

  // Client-Side Curriculum Filter & Search
  const filteredModulesWithLessons = useMemo(() => {
    const term = searchQuery.toLowerCase().trim();

    return modules.map((mod) => {
      const moduleLessons = lessons.filter(
        (l) => l.moduleId === mod.moduleId || l.moduleId === mod.id || (!l.moduleId && modules.length === 1)
      );

      const filteredLessons = moduleLessons.filter((lesson) => {
        const isCompleted =
          completedLessonIds.has(lesson.lessonId) || completedLessonIds.has(lesson.id);

        // Status Filter
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (statusFilter === 'not_started' && isCompleted) return false;

        // Text Search
        if (term) {
          const matchLessonTitle = lesson.title.toLowerCase().includes(term);
          const matchLessonDesc = (lesson.description || '').toLowerCase().includes(term);
          const matchModuleTitle = mod.title.toLowerCase().includes(term);
          return matchLessonTitle || matchLessonDesc || matchModuleTitle;
        }

        return true;
      });

      return {
        module: mod,
        lessons: filteredLessons,
        totalModuleLessons: moduleLessons.length,
        completedModuleLessons: moduleLessons.filter(
          (l) => completedLessonIds.has(l.lessonId) || completedLessonIds.has(l.id)
        ).length,
      };
    }).filter((group) => {
      if (!searchQuery && statusFilter === 'all') return true;
      return group.lessons.length > 0;
    });
  }, [modules, lessons, completedLessonIds, searchQuery, statusFilter]);

  // ==========================================
  // LOADING SKELETON
  // ==========================================
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-pulse">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="h-8 w-32 bg-slate-200 rounded-lg" />
          </div>

          {/* Hero Skeleton */}
          <div className="h-64 bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm animate-pulse">
            <div className="space-y-3">
              <div className="h-8 w-80 bg-slate-200 rounded-lg" />
              <div className="h-4 w-full max-w-lg bg-slate-100 rounded-lg" />
            </div>
            <div className="h-12 w-48 bg-[#0057B8]/30 rounded-xl" />
          </div>

          {/* Modules Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR STATE
  // ==========================================
  if (authError || dataError) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 text-red-500 border border-red-200 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
            ⚠️
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Course Unreachable</h2>
            <p className="text-sm text-slate-600">
              {dataError || authError || 'Unable to load your course right now.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 bg-[#0057B8] hover:bg-[#004494] text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10"
            >
              Try Again
            </button>
            <Link
              href="/student/dashboard"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE (NO ACTIVE ENROLLMENT)
  // ==========================================
  if (!activeEnrollment || !course) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 text-[#0057B8] border border-blue-100 rounded-2xl flex items-center justify-center mx-auto text-3xl font-bold">
            📚
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">No Active Course Found</h2>
            <p className="text-sm text-slate-600">
              You are currently not enrolled in an active course program. Please contact your administrator.
            </p>
          </div>

          <Link
            href="/student/dashboard"
            className="inline-block w-full py-3 px-4 bg-[#0057B8] hover:bg-[#004494] text-white rounded-xl text-sm font-semibold transition shadow-md shadow-blue-500/10"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/90 text-slate-800 font-sans selection:bg-[#0057B8] selection:text-white relative overflow-x-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#0057B8]/5 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-[#F7931E]/6 rounded-full blur-[160px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* ================================================== */}
        {/* 1. HEADER                                          */}
        {/* ================================================== */}
        <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            {/* Left Header */}
            <div className="flex items-center gap-4">
              <Link
                href="/student/dashboard"
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center justify-center"
                title="Back to Dashboard"
              >
                ← <span className="hidden sm:inline ml-1 text-xs font-semibold">Dashboard</span>
              </Link>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none">
                    VEEZNA
                  </span>
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-50 text-[#0057B8] uppercase border border-blue-200/60">
                    LMS
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#F7931E] block mt-0.5">
                  My Course
                </span>
              </div>
            </div>

            {/* Right Header: Student Info */}
            {studentData && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{studentData.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    ID: {studentData.studentId}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#0057B8] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
                  {studentData.name ? studentData.name.substring(0, 2).toUpperCase() : 'ST'}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* MAIN BODY */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* ================================================== */}
          {/* 2. COURSE HERO & PROGRESS SECTION (GRID)          */}
          {/* ================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* HERO CARD (2 COLS) */}
            <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#003B7E] via-[#0057B8] to-blue-700 shadow-xl p-6 sm:p-10 text-white flex flex-col justify-between">
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-[#F7931E]/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white">
                  <span>Category: {course.category || 'Academic'}</span>
                  <span>•</span>
                  <span>Level: {course.level || 'Standard'}</span>
                  {course.duration && (
                    <>
                      <span>•</span>
                      <span>⏱️ {course.duration}</span>
                    </>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  {course.title}
                </h1>

                {course.description && (
                  <p className="text-sm sm:text-base text-blue-100 leading-relaxed max-w-2xl line-clamp-3">
                    {course.description}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex items-center justify-between gap-4">
                {firstActionableLesson ? (
                  <button
                    onClick={() => handleLessonClick(firstActionableLesson)}
                    className="group relative inline-flex items-center justify-center px-6 py-3.5 rounded-2xl bg-[#F7931E] hover:bg-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>
                      {progressMetrics.completedCount > 0 ? 'Continue Learning →' : 'Start Course →'}
                    </span>
                  </button>
                ) : (
                  <span className="text-xs font-semibold text-blue-100">
                    Course curriculum is being loaded...
                  </span>
                )}

                <span className="text-xs font-mono font-medium text-blue-200">
                  Batch: {activeEnrollment.batchId || 'Enrolled'}
                </span>
              </div>
            </div>

            {/* REAL PROGRESS CARD */}
            <Card3D className="bg-white border border-slate-200 p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Course Progress
                  </h3>
                  <span className="text-xs font-extrabold text-[#0057B8] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    {progressMetrics.percentage}% Completed
                  </span>
                </div>

                {/* Animated SVG Progress Circle */}
                <div className="relative w-36 h-36 mx-auto my-4 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-100"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeDasharray={263.89}
                      strokeDashoffset={263.89 - (263.89 * progressMetrics.percentage) / 100}
                      strokeLinecap="round"
                      className="text-[#0057B8] transition-all duration-1000 ease-out"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-3xl font-extrabold text-slate-900 leading-none">
                      {progressMetrics.percentage}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      Overall
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Completed
                  </span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    {progressMetrics.completedCount}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                    Total Lessons
                  </span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {progressMetrics.totalCount}
                  </span>
                </div>
              </div>
            </Card3D>
          </div>

          {/* ================================================== */}
          {/* SEARCH & FILTERS BAR                               */}
          {/* ================================================== */}
          <section className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative w-full sm:max-w-md">
              <input
                type="text"
                placeholder="Search modules or lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0057B8] focus:ring-2 focus:ring-blue-500/10 text-xs font-medium text-slate-800 outline-none transition"
              />
              <svg
                className="w-4 h-4 absolute left-3 top-3 text-slate-400"
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

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Lessons' },
                { id: 'completed', label: '✓ Completed' },
                { id: 'not_started', label: 'Incomplete' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    statusFilter === f.id
                      ? 'bg-[#0057B8] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </section>

          {/* ================================================== */}
          {/* CURRICULUM MODULES & LESSONS                       */}
          {/* ================================================== */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Course Curriculum
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                {modules.length} Modules • {lessons.length} Lessons
              </span>
            </div>

            {modules.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  📖
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Course content is being prepared
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  The modules and lessons for this course are currently being published by your instructors.
                </p>
              </div>
            ) : filteredModulesWithLessons.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No lessons found matching your search query or filter selection.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredModulesWithLessons.map((group, modIdx) => {
                  const { module: mod, lessons: moduleLessons, totalModuleLessons, completedModuleLessons } = group;
                  const isExpanded = !!expandedModules[mod.moduleId];
                  const moduleProgressPct =
                    totalModuleLessons > 0
                      ? Math.round((completedModuleLessons / totalModuleLessons) * 100)
                      : 0;

                  return (
                    <div
                      key={mod.id}
                      className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm transition-all"
                    >
                      {/* MODULE HEADER ACCORDION */}
                      <button
                        onClick={() => toggleModule(mod.moduleId)}
                        className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/80 transition"
                      >
                        <div className="space-y-1 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0057B8]">
                              MODULE {String(modIdx + 1).padStart(2, '0')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">
                              {completedModuleLessons} / {totalModuleLessons} completed
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 leading-snug">
                            {mod.title}
                          </h3>
                          {mod.description && (
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {mod.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Module Progress Bar */}
                          <div className="hidden sm:block w-28 text-right">
                            <span className="text-[10px] font-extrabold text-slate-700 block mb-1">
                              {moduleProgressPct}%
                            </span>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-[#0057B8] h-full transition-all duration-500"
                                style={{ width: `${moduleProgressPct}%` }}
                              />
                            </div>
                          </div>

                          <span className="text-slate-400 text-sm font-bold">
                            {isExpanded ? '▲' : '▼'}
                          </span>
                        </div>
                      </button>

                      {/* LESSONS LIST */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-4 space-y-2">
                          {moduleLessons.length === 0 ? (
                            <p className="text-xs text-slate-400 p-2 italic">
                              No lessons currently published in this module.
                            </p>
                          ) : (
                            moduleLessons.map((lesson, lesIdx) => {
                              const isCompleted =
                                completedLessonIds.has(lesson.lessonId) ||
                                completedLessonIds.has(lesson.id);

                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => handleLessonClick(lesson)}
                                  className="group cursor-pointer bg-white border border-slate-200/80 hover:border-[#0057B8]/40 p-3.5 sm:p-4 rounded-xl flex items-center justify-between gap-3 transition-all hover:shadow-md"
                                >
                                  <div className="flex items-center gap-3.5 min-w-0">
                                    {/* Icon Indicator */}
                                    <div
                                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                                        isCompleted
                                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                          : 'bg-blue-50 text-[#0057B8] border border-blue-100 group-hover:bg-[#0057B8] group-hover:text-white'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        '✓'
                                      ) : lesson.type === 'video' || lesson.videoUrl ? (
                                        '▶'
                                      ) : (
                                        '📄'
                                      )}
                                    </div>

                                    {/* Lesson Details */}
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                                          LESSON {String(lesIdx + 1).padStart(2, '0')}
                                        </span>
                                        {lesson.duration && (
                                          <span className="text-[10px] text-slate-400">
                                            • {lesson.duration}
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#0057B8] transition-colors truncate">
                                        {lesson.title}
                                      </h4>
                                    </div>
                                  </div>

                                  {/* Right CTA */}
                                  <div className="shrink-0">
                                    {isCompleted ? (
                                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-bold text-[#0057B8] bg-blue-50 group-hover:bg-[#0057B8] group-hover:text-white px-3 py-1 rounded-lg transition-colors border border-blue-100">
                                        Continue →
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* FOOTER */}
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