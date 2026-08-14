"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { VLSModule, VLSLesson, StudentProgress } from "@/types/vls";

export default function StudentVLSPage() {
  const { user, userData, studentData, activeEnrollment, loading: authLoading } = useStudentAuth();

  const [modules, setModules] = useState<VLSModule[]>([]);
  const [lessons, setLessons] = useState<VLSLesson[]>([]);
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<VLSLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);

  const resolvedStudentId = studentData?.studentId || userData?.studentId || user?.uid;
  const courseId = activeEnrollment?.courseId || activeEnrollment?.id;

  useEffect(() => {
    async function loadCurriculum() {
      if (!user || !courseId || !resolvedStudentId) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        // 1. Fetch Modules with memory sort fallback
        let fetchedModules: VLSModule[] = [];
        try {
          const modQ = query(
            collection(db, "modules"),
            where("courseId", "==", courseId),
            orderBy("order", "asc")
          );
          const modSnap = await getDocs(modQ);
          fetchedModules = modSnap.docs.map((d) => ({ id: d.id, ...d.data() } as VLSModule));
        } catch (e) {
          const fallbackQ = query(collection(db, "modules"), where("courseId", "==", courseId));
          const snap = await getDocs(fallbackQ);
          fetchedModules = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as VLSModule))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        // 2. Fetch Lessons with memory sort fallback
        let fetchedLessons: VLSLesson[] = [];
        try {
          const lesQ = query(
            collection(db, "lessons"),
            where("courseId", "==", courseId),
            orderBy("order", "asc")
          );
          const lesSnap = await getDocs(lesQ);
          fetchedLessons = lesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as VLSLesson));
        } catch (e) {
          const fallbackQ = query(collection(db, "lessons"), where("courseId", "==", courseId));
          const snap = await getDocs(fallbackQ);
          fetchedLessons = snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as VLSLesson))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        setModules(fetchedModules);
        setLessons(fetchedLessons);

        if (fetchedLessons.length > 0) {
          setSelectedLesson(fetchedLessons[0]);
        }

        // 3. Fetch Progress Document
        const progressDocId = `${resolvedStudentId}_${courseId}`;
        const progressRef = doc(db, "progress", progressDocId);
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
          setProgress(progressSnap.data() as StudentProgress);
        } else {
          setProgress({
            progressId: progressDocId,
            studentId: resolvedStudentId,
            courseId,
            completedLessonIds: [],
            completionPercentage: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error("VLS Load Error:", err);
        if (err?.code === "permission-denied") {
          setErrorMsg("Permission denied while accessing curriculum. Please verify your student profile status.");
        } else {
          setErrorMsg("Unable to load your VLS curriculum. Please refresh or contact Veezna support.");
        }
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadCurriculum();
    }
  }, [user, courseId, resolvedStudentId, authLoading]);

  const handleToggleComplete = async (lessonId: string) => {
    if (!user || !courseId || !resolvedStudentId || !progress) return;

    setSavingProgress(true);
    try {
      const isCompleted = progress.completedLessonIds.includes(lessonId);
      const updatedCompleted = isCompleted
        ? progress.completedLessonIds.filter((id: string) => id !== lessonId)
        : [...progress.completedLessonIds, lessonId];

      const totalLessons = lessons.length || 1;
      const percentage = Math.round((updatedCompleted.length / totalLessons) * 100);

      const progressDocId = `${resolvedStudentId}_${courseId}`;
      const progressRef = doc(db, "progress", progressDocId);

      const updatedPayload: StudentProgress = {
        progressId: progressDocId,
        studentId: resolvedStudentId,
        courseId,
        completedLessonIds: updatedCompleted,
        completionPercentage: percentage,
        lastAccessedLessonId: lessonId,
        updatedAt: serverTimestamp(),
      };

      await setDoc(progressRef, updatedPayload, { merge: true });

      setProgress({
        ...updatedPayload,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Error saving VLS progress:", err);
      alert("Failed to save lesson progress. Please check network connection.");
    } finally {
      setSavingProgress(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0057B8] border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading VEEZNA VLS Portal...</p>
        </div>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-4">
          🎓
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Course Enrollment Found</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          You are currently not enrolled in an active course. Please contact administration or return to your student portal.
        </p>
        <Link
          href="/student/dashboard"
          className="bg-[#0057B8] hover:bg-[#004390] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/student/dashboard"
            className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-md"
          >
            ← Dashboard
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#F7931E]">VEEZNA</span> VLS Portal
            </h1>
            <p className="text-xs text-slate-400">Course ID: {courseId}</p>
          </div>
        </div>

        {progress && (
          <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <div className="text-right">
              <p className="text-xs text-slate-400">Course Progress</p>
              <p className="text-sm font-bold text-emerald-400">{progress.completionPercentage}%</p>
            </div>
            <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {errorMsg && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-6 py-3 text-xs flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline text-rose-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <aside className="lg:col-span-4 bg-slate-900/90 border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-65px)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
            Course Curriculum
          </h2>

          {modules.length === 0 ? (
            <div className="p-6 text-center bg-slate-800/40 rounded-xl border border-slate-800">
              <p className="text-sm font-semibold text-slate-300">
                No modules published for this course yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((mod) => {
                const modLessons = lessons.filter(
                  (l) => l.moduleId === mod.moduleId || l.moduleId === mod.id
                );

                return (
                  <div key={mod.id || mod.moduleId} className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-800/80 border-b border-slate-800">
                      <span className="text-[10px] font-bold text-[#F7931E] uppercase tracking-wider block">
                        Module {mod.order}
                      </span>
                      <h3 className="text-sm font-bold text-white">{mod.title}</h3>
                    </div>

                    <div className="p-1 space-y-1">
                      {modLessons.map((les) => {
                        const isSelected = selectedLesson?.id === les.id || selectedLesson?.lessonId === les.lessonId;
                        const isDone = progress?.completedLessonIds?.includes(les.lessonId || les.id || "");

                        return (
                          <button
                            key={les.id || les.lessonId}
                            onClick={() => setSelectedLesson(les)}
                            className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition ${
                              isSelected
                                ? "bg-[#0057B8] text-white font-medium shadow"
                                : "hover:bg-slate-800/60 text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                  isDone
                                    ? "bg-emerald-500 text-slate-950"
                                    : isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-700 text-slate-400"
                                }`}
                              >
                                {isDone ? "✓" : les.order}
                              </span>
                              <span className="truncate">{les.title}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        <main className="lg:col-span-8 bg-slate-950 overflow-y-auto max-h-[calc(100vh-65px)] p-6 md:p-8">
          {selectedLesson ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#F7931E] font-semibold uppercase tracking-wider">
                    Lesson {selectedLesson.order} • {selectedLesson.type || "video"}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedLesson.title}</h2>
                </div>

                <button
                  onClick={() => handleToggleComplete(selectedLesson.lessonId || selectedLesson.id || "")}
                  disabled={savingProgress}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm ${
                    progress?.completedLessonIds?.includes(selectedLesson.lessonId || selectedLesson.id || "")
                      ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400"
                      : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  }`}
                >
                  {savingProgress
                    ? "Saving..."
                    : progress?.completedLessonIds?.includes(selectedLesson.lessonId || selectedLesson.id || "")
                    ? "✓ Completed"
                    : "Mark Complete"}
                </button>
              </div>

              {selectedLesson.videoUrl && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                  <iframe
                    src={selectedLesson.videoUrl.replace("watch?v=", "embed/")}
                    className="w-full h-full border-0"
                    allowFullScreen
                    title={selectedLesson.title}
                  />
                </div>
              )}

              {selectedLesson.textContent && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.textContent}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
              <p className="text-base font-semibold text-slate-400">Select a lesson from the curriculum menu</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}