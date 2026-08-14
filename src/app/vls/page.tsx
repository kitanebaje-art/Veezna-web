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
import { ModuleDocument, LessonDocument, StudentProgressDocument } from "@/types/vls";

export default function StudentVLSPage() {
  const { student, loading: authLoading } = useStudentAuth();

  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [modules, setModules] = useState<ModuleDocument[]>([]);
  const [lessons, setLessons] = useState<LessonDocument[]>([]);
  const [progress, setProgress] = useState<StudentProgressDocument | null>(null);

  const [selectedLesson, setSelectedLesson] = useState<LessonDocument | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingProgress, setSavingProgress] = useState<boolean>(false);

  // Helper to format YouTube URLs into Embeddable URLs safely
  const getEmbeddableVideoUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  // 1. Fetch Student Active Enrollment & Resolve Course Identifiers
  useEffect(() => {
    async function resolveEnrollment() {
      if (!student) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        const studentBusinessId = student.studentId || student.uid;

        // Query active enrollments for this student
        const enrollmentsQ = query(
          collection(db, "enrollments"),
          where("studentId", "==", studentBusinessId),
          where("status", "==", "active")
        );
        const enrollmentsSnap = await getDocs(enrollmentsQ);

        let targetCourseId: string | null = null;
        let title: string = "Enrolled Course";

        if (!enrollmentsSnap.empty) {
          const activeEnrollment = enrollmentsSnap.docs[0].data();
          targetCourseId = activeEnrollment.courseId || activeEnrollment.id || null;
          title = activeEnrollment.courseName || activeEnrollment.courseTitle || title;
        } else {
          // Fallback check on student record
          const userDocRef = doc(db, "users", student.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            targetCourseId = userData.enrolledCourseId || userData.courseId || null;
            title = userData.courseName || title;
          }
        }

        if (!targetCourseId) {
          setActiveCourseId(null);
          setLoading(false);
          return;
        }

        console.log("VLS Resolved Active Course ID:", targetCourseId);
        setActiveCourseId(targetCourseId);
        setCourseTitle(title);
      } catch (err: any) {
        console.error("VLS Enrollment Resolution Error:", err);
        setErrorMsg("Unable to load your enrollment details. Please refresh or contact support.");
        setLoading(false);
      }
    }

    if (!authLoading) {
      resolveEnrollment();
    }
  }, [student, authLoading]);

  // 2. Fetch Modules, Lessons, and Progress for Active Course
  useEffect(() => {
    async function loadCurriculumAndProgress() {
      if (!activeCourseId || !student) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        const studentBusinessId = student.studentId || student.uid;

        // Fetch Modules
        let fetchedModules: ModuleDocument[] = [];
        try {
          const modulesQ = query(
            collection(db, "modules"),
            where("courseId", "==", activeCourseId),
            orderBy("order", "asc")
          );
          const modulesSnap = await getDocs(modulesQ);
          fetchedModules = modulesSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ModuleDocument, "id">),
          }));
        } catch (mErr: any) {
          console.warn("Ordered module query failed, attempting un-ordered fallback:", mErr);
          const fallbackQ = query(
            collection(db, "modules"),
            where("courseId", "==", activeCourseId)
          );
          const snap = await getDocs(fallbackQ);
          fetchedModules = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<ModuleDocument, "id">) }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        // Fetch Lessons
        let fetchedLessons: LessonDocument[] = [];
        try {
          const lessonsQ = query(
            collection(db, "lessons"),
            where("courseId", "==", activeCourseId),
            orderBy("order", "asc")
          );
          const lessonsSnap = await getDocs(lessonsQ);
          fetchedLessons = lessonsSnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<LessonDocument, "id">),
          }));
        } catch (lErr: any) {
          console.warn("Ordered lesson query failed, attempting un-ordered fallback:", lErr);
          const fallbackQ = query(
            collection(db, "lessons"),
            where("courseId", "==", activeCourseId)
          );
          const snap = await getDocs(fallbackQ);
          fetchedLessons = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<LessonDocument, "id">) }))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        console.log("Loaded VLS Modules:", fetchedModules.length);
        console.log("Loaded VLS Lessons:", fetchedLessons.length);

        setModules(fetchedModules);
        setLessons(fetchedLessons);

        if (fetchedLessons.length > 0) {
          setSelectedLesson(fetchedLessons[0]);
        }

        // Fetch Student Progress Document
        const progressDocId = `${studentBusinessId}_${activeCourseId}`;
        const progressRef = doc(db, "progress", progressDocId);
        const progressSnap = await getDoc(progressRef);

        if (progressSnap.exists()) {
          setProgress(progressSnap.data() as StudentProgressDocument);
        } else {
          setProgress({
            progressId: progressDocId,
            studentId: studentBusinessId,
            courseId: activeCourseId,
            completedLessonIds: [],
            completionPercentage: 0,
            totalTimeSpentMinutes: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        console.error("Error loading VLS curriculum:", err);
        if (err?.code === "permission-denied") {
          setErrorMsg("Permission denied while accessing curriculum. Please verify your student account status.");
        } else {
          setErrorMsg("Unable to load your VLS curriculum. Please refresh the page or contact Veezna support.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadCurriculumAndProgress();
  }, [activeCourseId, student]);

  // Toggle Lesson Completion
  const handleToggleComplete = async (lessonId: string) => {
    if (!student || !activeCourseId || !progress) return;

    const studentBusinessId = student.studentId || student.uid;
    setSavingProgress(true);

    try {
      const currentCompleted = progress.completedLessonIds || [];
      const isCompleted = currentCompleted.includes(lessonId);
      const updatedCompleted = isCompleted
        ? currentCompleted.filter((id) => id !== lessonId)
        : [...currentCompleted, lessonId];

      const totalLessons = lessons.length || 1;
      const percentage = Math.round((updatedCompleted.length / totalLessons) * 100);

      const progressDocId = `${studentBusinessId}_${activeCourseId}`;
      const progressRef = doc(db, "progress", progressDocId);

      const updatedPayload: StudentProgressDocument = {
        progressId: progressDocId,
        studentId: studentBusinessId,
        courseId: activeCourseId,
        completedLessonIds: updatedCompleted,
        completionPercentage: percentage,
        lastAccessedLessonId: lessonId,
        totalTimeSpentMinutes: progress.totalTimeSpentMinutes || 0,
        updatedAt: serverTimestamp(),
      };

      await setDoc(progressRef, updatedPayload, { merge: true });

      setProgress({
        ...updatedPayload,
        updatedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error("Failed to update lesson progress:", err);
      alert("Failed to save progress. Please check your network connection and try again.");
    } finally {
      setSavingProgress(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0057B8] border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium">Loading VEEZNA VLS...</p>
        </div>
      </div>
    );
  }

  if (!activeCourseId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl mb-4">
          🎓
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Course Enrollment Found</h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          You are currently not enrolled in an active course. Please contact administration or check your student dashboard.
        </p>
        <Link
          href="/student/dashboard"
          className="bg-[#0057B8] hover:bg-[#004390] text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition"
        >
          Return to Student Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* HEADER */}
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
              <span className="text-[#F7931E]">VEEZNA</span> VLS
            </h1>
            <p className="text-xs text-slate-400">{courseTitle}</p>
          </div>
        </div>

        {progress && (
          <div className="hidden md:flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
            <div className="text-right">
              <p className="text-xs text-slate-400">Course Progress</p>
              <p className="text-sm font-bold text-emerald-400">{progress.completionPercentage || 0}%</p>
            </div>
            <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${progress.completionPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </header>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-200 px-6 py-3 text-xs flex items-center justify-between">
          <span>⚠️ {errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="underline text-rose-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* MAIN TWO COLUMN LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT SIDEBAR: CURRICULUM */}
        <aside className="lg:col-span-4 bg-slate-900/90 border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-65px)] p-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 px-2">
            Course Curriculum
          </h2>

          {modules.length === 0 ? (
            <div className="p-6 text-center bg-slate-800/40 rounded-xl border border-slate-800">
              <p className="text-sm font-semibold text-slate-300">
                No modules published for this course yet.
              </p>
              <p className="text-xs text-slate-500 mt-1">Check back later or contact your instructor.</p>
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
                      {mod.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{mod.description}</p>
                      )}
                    </div>

                    <div className="p-1 space-y-1">
                      {modLessons.length === 0 ? (
                        <p className="text-[11px] text-slate-500 italic p-2">No lessons in this module.</p>
                      ) : (
                        modLessons.map((les) => {
                          const isSelected = selectedLesson?.id === les.id || selectedLesson?.lessonId === les.lessonId;
                          const currentCompleted = progress?.completedLessonIds || [];
                          const isDone = currentCompleted.includes(les.lessonId) || currentCompleted.includes(les.id || "");

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

                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-950/40 text-slate-400 border border-slate-700/50 ml-2">
                                {les.type || "lesson"}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* RIGHT PANEL: LESSON CONTENT */}
        <main className="lg:col-span-8 bg-slate-950 overflow-y-auto max-h-[calc(100vh-65px)] p-6 md:p-8">
          {selectedLesson ? (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-[#F7931E] font-semibold uppercase tracking-wider">
                    Lesson {selectedLesson.order} • {selectedLesson.type || "video"}
                  </span>
                  <h2 className="text-2xl font-bold text-white mt-1">{selectedLesson.title}</h2>
                </div>

                <button
                  onClick={() => handleToggleComplete(selectedLesson.lessonId || selectedLesson.id || "")}
                  disabled={savingProgress}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 shadow-sm ${
                    progress?.completedLessonIds?.includes(selectedLesson.lessonId || selectedLesson.id || "")
                      ? "bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30"
                      : "bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
                  }`}
                >
                  {savingProgress
                    ? "Updating..."
                    : progress?.completedLessonIds?.includes(selectedLesson.lessonId || selectedLesson.id || "")
                    ? "✓ Completed (Click to Undo)"
                    : "Mark as Complete"}
                </button>
              </div>

              {/* VIDEO PLAYER */}
              {selectedLesson.videoUrl && (
                <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
                  {selectedLesson.videoUrl.includes("youtube.com") || selectedLesson.videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={getEmbeddableVideoUrl(selectedLesson.videoUrl)}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={selectedLesson.title}
                    />
                  ) : (
                    <video src={selectedLesson.videoUrl} controls className="w-full h-full object-cover" />
                  )}
                </div>
              )}

              {/* TEXT CONTENT */}
              {selectedLesson.textContent && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedLesson.textContent}
                </div>
              )}

              {/* DOWNLOADABLE RESOURCE */}
              {selectedLesson.resourceUrl && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-xl">📁</div>
                    <div>
                      <p className="text-xs font-bold text-white">Attached Study Resource</p>
                      <p className="text-[11px] text-slate-400">Download supplementary materials for this lesson.</p>
                    </div>
                  </div>
                  <a
                    href={selectedLesson.resourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-medium border border-slate-700 transition"
                  >
                    Download Resource
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-16">
              <p className="text-base font-semibold text-slate-400">Select a lesson from the curriculum menu</p>
              <p className="text-xs mt-1">Your progress will be automatically saved as you complete lessons.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}