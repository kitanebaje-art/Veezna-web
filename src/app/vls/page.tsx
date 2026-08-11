// src/app/vls/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStudentAuth } from '@/hooks/useStudentAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import type { LessonDocument, ModuleDocument, StudentProgressDocument } from '@/types/vls';

export default function VLSMainPage() {
  const router = useRouter();
  const { studentData, activeEnrollment, loading: authLoading } = useStudentAuth(true);

  const [modules, setModules] = useState<ModuleDocument[]>([]);
  const [lessons, setLessons] = useState<LessonDocument[]>([]);
  const [activeLesson, setActiveLesson] = useState<LessonDocument | null>(null);
  const [progress, setProgress] = useState<StudentProgressDocument | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    if (activeEnrollment && studentData) {
      loadCourseContent(activeEnrollment.courseId, studentData.studentId);
    }
  }, [activeEnrollment, studentData]);

  const loadCourseContent = async (courseId: string, studentId: string) => {
    setLoadingContent(true);
    try {
      // 1. Fetch Modules
      const modulesQ = query(
        collection(db, 'modules'),
        where('courseId', '==', courseId),
        orderBy('order', 'asc')
      );
      const modulesSnap = await getDocs(modulesQ);
      const fetchedModules: ModuleDocument[] = [];
      modulesSnap.forEach((docSnap) => fetchedModules.push(docSnap.data() as ModuleDocument));
      setModules(fetchedModules);

      // 2. Fetch Lessons
      const lessonsQ = query(
        collection(db, 'lessons'),
        where('courseId', '==', courseId),
        orderBy('order', 'asc')
      );
      const lessonsSnap = await getDocs(lessonsQ);
      const fetchedLessons: LessonDocument[] = [];
      lessonsSnap.forEach((docSnap) => fetchedLessons.push(docSnap.data() as LessonDocument));
      setLessons(fetchedLessons);

      if (fetchedLessons.length > 0) {
        setActiveLesson(fetchedLessons[0]);
      }

      // 3. Fetch Student Progress
      const progressDocId = `${studentId}_${courseId}`;
      const progressSnap = await getDoc(doc(db, 'progress', progressDocId));

      if (progressSnap.exists()) {
        setProgress(progressSnap.data() as StudentProgressDocument);
      } else {
        const newProgress: StudentProgressDocument = {
          progressId: progressDocId,
          studentId,
          courseId,
          completedLessonIds: [],
          completionPercentage: 0,
          totalTimeSpentMinutes: 0,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, 'progress', progressDocId), newProgress);
        setProgress(newProgress);
      }
    } catch (err) {
      console.error('Error loading VLS content:', err);
    } finally {
      setLoadingContent(false);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    if (!studentData || !activeEnrollment || !progress) return;

    if (progress.completedLessonIds.includes(lessonId)) return;

    const updatedCompleted = [...progress.completedLessonIds, lessonId];
    const totalLessonsCount = lessons.length || 1;
    const completionPercentage = Math.round((updatedCompleted.length / totalLessonsCount) * 100);

    const updatedProgress: StudentProgressDocument = {
      ...progress,
      completedLessonIds: updatedCompleted,
      lastAccessedLessonId: lessonId,
      completionPercentage,
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'progress', progress.progressId), updatedProgress);
      setProgress(updatedProgress);
    } catch (err) {
      console.error('Error updating lesson progress:', err);
    }
  };

  if (authLoading || loadingContent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Loading Veezna Learning System (VLS)...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
            VEEZNA LEARNING SYSTEM (VLS)
          </span>
          <h1 className="text-lg font-bold text-white">
            {activeEnrollment?.courseId || 'Course Portal'}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-slate-400">Course Progress</div>
            <div className="text-sm font-bold text-emerald-400">
              {progress?.completionPercentage || 0}% Complete
            </div>
          </div>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-slate-300 border border-slate-700 transition"
          >
            ← Exit to Dashboard
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar: Course Curriculum */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 overflow-y-auto p-4 space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Course Curriculum
          </h2>

          {modules.length === 0 && (
            <div className="p-4 text-xs text-slate-500 text-center">
              No modules published for this course yet.
            </div>
          )}

          {modules.map((module) => {
            const moduleLessons = lessons.filter((l) => l.moduleId === module.moduleId);

            return (
              <div key={module.moduleId} className="bg-slate-950/50 rounded-xl border border-slate-800 p-3 space-y-2">
                <div className="font-semibold text-sm text-slate-200">{module.title}</div>
                <div className="space-y-1">
                  {moduleLessons.map((lesson) => {
                    const isCompleted = progress?.completedLessonIds.includes(lesson.lessonId);
                    const isActive = activeLesson?.lessonId === lesson.lessonId;

                    return (
                      <button
                        key={lesson.lessonId}
                        onClick={() => setActiveLesson(lesson)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                            : 'hover:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="truncate">{lesson.title}</span>
                        {isCompleted && (
                          <span className="text-emerald-400 font-bold ml-2">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Content Viewer / Lesson Player */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto space-y-6">
          {activeLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    {activeLesson.type.toUpperCase()} LESSON
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">{activeLesson.title}</h2>
                </div>
                <button
                  onClick={() => markLessonComplete(activeLesson.lessonId)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
                    progress?.completedLessonIds.includes(activeLesson.lessonId)
                      ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md'
                  }`}
                >
                  {progress?.completedLessonIds.includes(activeLesson.lessonId)
                    ? '✓ Completed'
                    : 'Mark as Complete'}
                </button>
              </div>

              {/* Content Body */}
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 min-h-[300px] text-slate-300 leading-relaxed text-sm">
                {activeLesson.textContent || (
                  <p className="text-slate-500">
                    Lesson content and practice exercises will render here.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Select a lesson from the curriculum to begin learning.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}