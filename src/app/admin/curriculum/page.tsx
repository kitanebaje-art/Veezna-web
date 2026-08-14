"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- TYPES ---
interface Course {
  id: string; // Firestore document ID
  courseId: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
}

interface ModuleData {
  id: string; // Firestore document ID
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  status: "published" | "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface LessonData {
  id: string; // Firestore document ID
  lessonId: string;
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  type: "video" | "reading" | "assignment" | "quiz" | "practice" | "lesson";
  textContent: string;
  videoUrl: string;
  resourceUrl: string;
  order: number;
  status: "published" | "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

interface Toast {
  id: string;
  type: "success" | "error";
  message: string;
}

// Helper to generate custom IDs (e.g., VZ-MOD-12345678, VZ-LESSON-87654321)
const generateCustomId = (prefix: string) => {
  const randomStr = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}-${randomStr}`;
};

export default function AdminCurriculumPage() {
  // --- STATES ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [modules, setModules] = useState<ModuleData[]>([]);
  const [lessons, setLessons] = useState<LessonData[]>([]);

  const [loadingCourses, setLoadingCourses] = useState<boolean>(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "active" | "inactive">("all");

  // Selection for Details/Editing
  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<LessonData | null>(null);

  // Active Mode on Right Panel
  const [activeMode, setActiveMode] = useState<"none" | "add-module" | "edit-module" | "add-lesson" | "edit-lesson">("none");

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Form States
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    order: 1,
    status: "published" as "published" | "active" | "inactive",
  });

  const [lessonForm, setLessonForm] = useState({
    title: "",
    description: "",
    type: "video" as "video" | "reading" | "assignment" | "quiz" | "practice" | "lesson",
    textContent: "",
    videoUrl: "",
    resourceUrl: "",
    order: 1,
    status: "published" as "published" | "active" | "inactive",
  });

  // --- TOAST NOTIFICATION HELPER ---
  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- FETCH COURSES ---
  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const q = query(collection(db, "courses"));
      const snap = await getDocs(q);
      const list: Course[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Course, "id">),
      }));

      const activeCourses = list.filter((c) => !c.status || c.status.toLowerCase() === "active" || c.status.toLowerCase() === "published");
      setCourses(activeCourses);

      if (activeCourses.length > 0 && !selectedCourseId) {
        setSelectedCourseId(activeCourses[0].courseId || activeCourses[0].id);
      }
    } catch (err: any) {
      console.error("Failed to fetch courses:", err);
      showToast("Failed to load courses. Check administrative permissions.", "error");
    } finally {
      setLoadingCourses(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // --- FETCH MODULES & LESSONS FOR SELECTED COURSE ---
  const fetchCurriculum = async (courseId: string) => {
    if (!courseId) return;
    setLoadingCurriculum(true);
    try {
      // Fetch Modules
      let fetchedModules: ModuleData[] = [];
      try {
        const modulesQ = query(
          collection(db, "modules"),
          where("courseId", "==", courseId),
          orderBy("order", "asc")
        );
        const modulesSnap = await getDocs(modulesQ);
        fetchedModules = modulesSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ModuleData, "id">) }));
      } catch (e) {
        // Fallback without orderBy if composite index isn't ready
        const fallbackQ = query(collection(db, "modules"), where("courseId", "==", courseId));
        const snap = await getDocs(fallbackQ);
        fetchedModules = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<ModuleData, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      // Fetch Lessons
      let fetchedLessons: LessonData[] = [];
      try {
        const lessonsQ = query(
          collection(db, "lessons"),
          where("courseId", "==", courseId),
          orderBy("order", "asc")
        );
        const lessonsSnap = await getDocs(lessonsQ);
        fetchedLessons = lessonsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LessonData, "id">) }));
      } catch (e) {
        const fallbackQ = query(collection(db, "lessons"), where("courseId", "==", courseId));
        const snap = await getDocs(fallbackQ);
        fetchedLessons = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<LessonData, "id">) }))
          .sort((a, b) => (a.order || 0) - (b.order || 0));
      }

      setModules(fetchedModules);
      setLessons(fetchedLessons);
    } catch (err: any) {
      console.error("Error loading curriculum:", err);
      showToast("Error loading curriculum modules and lessons.", "error");
    } finally {
      setLoadingCurriculum(false);
    }
  };

  useEffect(() => {
    if (selectedCourseId) {
      setSelectedModule(null);
      setSelectedLesson(null);
      setActiveMode("none");
      fetchCurriculum(selectedCourseId);
    }
  }, [selectedCourseId]);

  // --- URL VALIDATOR ---
  const isValidUrl = (urlStr: string) => {
    if (!urlStr) return true;
    try {
      new URL(urlStr);
      return true;
    } catch (_) {
      return false;
    }
  };

  // --- MODULE ACTIONS ---
  const openAddModule = () => {
    const nextOrder = modules.length > 0 ? Math.max(...modules.map((m) => m.order || 0)) + 1 : 1;
    setModuleForm({
      title: "",
      description: "",
      order: nextOrder,
      status: "published",
    });
    setSelectedModule(null);
    setSelectedLesson(null);
    setActiveMode("add-module");
  };

  const openEditModule = (mod: ModuleData) => {
    setSelectedModule(mod);
    setSelectedLesson(null);
    setModuleForm({
      title: mod.title,
      description: mod.description || "",
      order: mod.order || 1,
      status: mod.status || "published",
    });
    setActiveMode("edit-module");
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = moduleForm.title.trim();
    const description = moduleForm.description.trim();
    const order = Number(moduleForm.order);

    if (!title) {
      showToast("Module title is required.", "error");
      return;
    }
    if (order < 0) {
      showToast("Order cannot be a negative number.", "error");
      return;
    }
    if (!selectedCourseId) {
      showToast("No course selected.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      if (activeMode === "add-module") {
        const newModuleId = generateCustomId("VZ-MOD");

        const payload: Omit<ModuleData, "id"> = {
          moduleId: newModuleId,
          courseId: selectedCourseId,
          title,
          description,
          order,
          status: moduleForm.status,
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(collection(db, "modules"), payload);
        showToast("Module created successfully.");
      } else if (activeMode === "edit-module" && selectedModule) {
        const docRef = doc(db, "modules", selectedModule.id);
        await updateDoc(docRef, {
          title,
          description,
          order,
          status: moduleForm.status,
          updatedAt: now,
        });
        showToast("Module updated successfully.");
      }

      await fetchCurriculum(selectedCourseId);
      setActiveMode("none");
    } catch (err: any) {
      console.error("Save module error:", err);
      showToast("Failed to save module. Check admin permissions.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModule = async (mod: ModuleData) => {
    const moduleLessons = lessons.filter((l) => l.moduleId === mod.moduleId || l.moduleId === mod.id);
    if (moduleLessons.length > 0) {
      showToast(`This module contains ${moduleLessons.length} lessons. Delete its lessons first.`, "error");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete module "${mod.title}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "modules", mod.id));
      showToast("Module deleted successfully.");
      if (selectedModule?.id === mod.id) {
        setSelectedModule(null);
        setActiveMode("none");
      }
      await fetchCurriculum(selectedCourseId);
    } catch (err) {
      showToast("Failed to delete module.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- LESSON ACTIONS ---
  const openAddLesson = (targetModule: ModuleData) => {
    setSelectedModule(targetModule);
    setSelectedLesson(null);

    const modLessons = lessons.filter((l) => l.moduleId === targetModule.moduleId || l.moduleId === targetModule.id);
    const nextOrder = modLessons.length > 0 ? Math.max(...modLessons.map((l) => l.order || 0)) + 1 : 1;

    setLessonForm({
      title: "",
      description: "",
      type: "video",
      textContent: "",
      videoUrl: "",
      resourceUrl: "",
      order: nextOrder,
      status: "published",
    });
    setActiveMode("add-lesson");
  };

  const openEditLesson = (les: LessonData, parentMod: ModuleData) => {
    setSelectedModule(parentMod);
    setSelectedLesson(les);
    setLessonForm({
      title: les.title,
      description: les.description || "",
      type: les.type || "video",
      textContent: les.textContent || "",
      videoUrl: les.videoUrl || "",
      resourceUrl: les.resourceUrl || "",
      order: les.order || 1,
      status: les.status || "published",
    });
    setActiveMode("edit-lesson");
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedModule) {
      showToast("Parent module is missing.", "error");
      return;
    }
    if (!selectedCourseId) {
      showToast("Course reference is missing.", "error");
      return;
    }

    const title = lessonForm.title.trim();
    const description = lessonForm.description.trim();
    const textContent = lessonForm.textContent.trim();
    const videoUrl = lessonForm.videoUrl.trim();
    const resourceUrl = lessonForm.resourceUrl.trim();
    const order = Number(lessonForm.order);

    if (!title) {
      showToast("Lesson title is required.", "error");
      return;
    }
    if (order < 0) {
      showToast("Order cannot be negative.", "error");
      return;
    }
    if (videoUrl && !isValidUrl(videoUrl)) {
      showToast("Please enter a valid Video URL.", "error");
      return;
    }
    if (resourceUrl && !isValidUrl(resourceUrl)) {
      showToast("Please enter a valid Resource URL.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      if (activeMode === "add-lesson") {
        const newLessonId = generateCustomId("VZ-LESSON");

        const payload: Omit<LessonData, "id"> = {
          lessonId: newLessonId,
          moduleId: selectedModule.moduleId,
          courseId: selectedCourseId,
          title,
          description,
          type: lessonForm.type,
          textContent,
          videoUrl,
          resourceUrl,
          order,
          status: lessonForm.status,
          createdAt: now,
          updatedAt: now,
        };

        await addDoc(collection(db, "lessons"), payload);
        showToast("Lesson created successfully.");
      } else if (activeMode === "edit-lesson" && selectedLesson) {
        const docRef = doc(db, "lessons", selectedLesson.id);
        await updateDoc(docRef, {
          title,
          description,
          type: lessonForm.type,
          textContent,
          videoUrl,
          resourceUrl,
          order,
          status: lessonForm.status,
          updatedAt: now,
        });
        showToast("Lesson updated successfully.");
      }

      await fetchCurriculum(selectedCourseId);
      setActiveMode("none");
    } catch (err: any) {
      console.error("Save lesson error:", err);
      showToast("Failed to save lesson. Verify permissions.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLesson = async (les: LessonData) => {
    if (!window.confirm(`Are you sure you want to delete lesson "${les.title}"?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, "lessons", les.id));
      showToast("Lesson deleted successfully.");
      if (selectedLesson?.id === les.id) {
        setSelectedLesson(null);
        setActiveMode("none");
      }
      await fetchCurriculum(selectedCourseId);
    } catch (err) {
      showToast("Failed to delete lesson.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- FILTERED CURRICULUM COMPUTATION ---
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const modMatch = m.title.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
        const hasMatchingLesson = lessons.some(
          (l) => (l.moduleId === m.moduleId || l.moduleId === m.id) && (l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q))
        );
        return modMatch || hasMatchingLesson;
      }
      return true;
    });
  }, [modules, lessons, statusFilter, searchQuery]);

  const selectedCourseObject = courses.find((c) => c.courseId === selectedCourseId || c.id === selectedCourseId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 md:p-8 font-sans">
      {/* Toast Render */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg text-white font-medium flex items-center justify-between transition-all ${
              t.type === "success" ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            <span>{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-4 text-xs bg-black/20 hover:bg-black/40 px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* TOP HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#0057B8] mb-2 transition-colors"
          >
            ← Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0057B8] flex items-center gap-2">
            VLS Curriculum
            <span className="text-xs bg-[#F7931E] text-white px-2 py-0.5 rounded-full font-semibold">Admin</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Create and manage course modules and lessons for the Veezna Learning System.
          </p>
        </div>

        <button
          onClick={() => fetchCurriculum(selectedCourseId)}
          disabled={loadingCurriculum || !selectedCourseId}
          className="inline-flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium px-4 py-2 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
        >
          🔄 {loadingCurriculum ? "Refreshing..." : "Refresh Curriculum"}
        </button>
      </div>

      {/* COURSE SELECTOR BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 max-w-xl">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Select Course *
          </label>
          {loadingCourses ? (
            <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
          ) : (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2.5 font-medium focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
            >
              {courses.length === 0 ? (
                <option value="">No Active Courses Found</option>
              ) : (
                courses.map((c) => (
                  <option key={c.id} value={c.courseId || c.id}>
                    {c.title || c.name || "Untitled Course"} ({c.courseId || c.id})
                  </option>
                ))
              )}
            </select>
          )}
        </div>

        {selectedCourseObject && (
          <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 md:self-end">
            <span className="font-semibold text-slate-700">Course ID:</span> {selectedCourseObject.courseId || selectedCourseObject.id}
          </div>
        )}
      </div>

      {/* MAIN TWO-COLUMN CURRICULUM LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: MODULE & LESSON NAVIGATION (5 COLS) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-base">Modules & Lessons</h2>
              <button
                onClick={openAddModule}
                disabled={!selectedCourseId || loadingCurriculum}
                className="bg-[#0057B8] hover:bg-[#004390] text-white text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                + Add Module
              </button>
            </div>

            {/* Search & Status Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Search modules/lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="sm:col-span-2 text-xs border border-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Module List Body */}
          <div className="p-4 overflow-y-auto max-h-[600px] flex-1">
            {loadingCurriculum ? (
              <div className="space-y-3 py-4">
                <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
                <div className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p className="text-sm">No modules found for this course.</p>
                <p className="text-xs mt-1">Click "+ Add Module" to start building the curriculum.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredModules.map((mod) => {
                  const modLessons = lessons
                    .filter((l) => l.moduleId === mod.moduleId || l.moduleId === mod.id)
                    .filter((l) => {
                      if (statusFilter !== "all" && l.status !== statusFilter) return false;
                      if (searchQuery.trim()) {
                        const q = searchQuery.toLowerCase();
                        return l.title.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .sort((a, b) => a.order - b.order);

                  const isSelected = selectedModule?.id === mod.id && !selectedLesson;

                  return (
                    <div
                      key={mod.id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        isSelected ? "border-[#0057B8] ring-1 ring-[#0057B8]" : "border-slate-200"
                      }`}
                    >
                      {/* Module Item Header */}
                      <div className="bg-slate-100/70 p-3 flex items-center justify-between gap-2">
                        <div
                          onClick={() => openEditModule(mod)}
                          className="flex-1 cursor-pointer flex items-center gap-2 min-w-0"
                        >
                          <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Order {mod.order}
                          </span>
                          <span className="font-semibold text-slate-800 text-sm truncate">{mod.title}</span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                              mod.status === "inactive"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {mod.status || "published"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openAddLesson(mod)}
                            title="Add Lesson to this Module"
                            className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 px-2 py-1 rounded font-medium transition"
                          >
                            + Lesson
                          </button>
                          <button
                            onClick={() => handleDeleteModule(mod)}
                            title="Delete Module"
                            className="text-xs text-rose-600 hover:bg-rose-50 px-1.5 py-1 rounded transition"
                          >
                            🗑
                          </button>
                        </div>
                      </div>

                      {/* Module Lessons sub-tree */}
                      <div className="bg-white p-2 space-y-1">
                        {modLessons.length === 0 ? (
                          <div className="text-[11px] text-slate-400 italic px-2 py-1">
                            No lessons in this module.
                          </div>
                        ) : (
                          modLessons.map((les) => {
                            const isLessonSelected = selectedLesson?.id === les.id;
                            return (
                              <div
                                key={les.id}
                                onClick={() => openEditLesson(les, mod)}
                                className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition ${
                                  isLessonSelected
                                    ? "bg-blue-50 text-[#0057B8] font-semibold border border-blue-200"
                                    : "hover:bg-slate-50 text-slate-700"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="text-slate-400 font-mono text-[10px]">{les.order}.</span>
                                  <span className="truncate">{les.title}</span>
                                  <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                    {les.type}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1">
                                  {les.status === "inactive" && (
                                    <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded">off</span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteLesson(les);
                                    }}
                                    className="text-slate-400 hover:text-rose-600 px-1"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DETAIL & MANAGEMENT FORM PANEL (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          {activeMode === "none" && (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-3">
                📚
              </div>
              <h3 className="font-semibold text-slate-700 text-base">No Module or Lesson Selected</h3>
              <p className="text-xs max-w-sm mt-1">
                Select a module/lesson on the left to view or edit details, or click "+ Add Module" to construct new content.
              </p>
            </div>
          )}

          {/* ADD / EDIT MODULE FORM */}
          {(activeMode === "add-module" || activeMode === "edit-module") && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <h3 className="font-bold text-slate-800 text-lg">
                  {activeMode === "add-module" ? "Create New Module" : "Edit Module"}
                </h3>
                {selectedModule && (
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    ID: {selectedModule.moduleId}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Module Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Module 1: Introduction to Financial Accounting"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what this module covers..."
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Display Order *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={moduleForm.order}
                      onChange={(e) => setModuleForm({ ...moduleForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Status *
                    </label>
                    <select
                      value={moduleForm.status}
                      onChange={(e) => setModuleForm({ ...moduleForm, status: e.target.value as any })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                    >
                      <option value="published">Published (Visible in VLS)</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMode("none")}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#0057B8] hover:bg-[#004390] text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : activeMode === "add-module" ? "Create Module" : "Update Module"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ADD / EDIT LESSON FORM */}
          {(activeMode === "add-lesson" || activeMode === "edit-lesson") && (
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {activeMode === "add-lesson" ? "Add Lesson" : "Edit Lesson"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Parent Module: <span className="font-semibold text-slate-700">{selectedModule?.title}</span>
                  </p>
                </div>
                {selectedLesson && (
                  <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded">
                    ID: {selectedLesson.lessonId}
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveLesson} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Understanding Double Entry Systems"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Lesson Type *
                    </label>
                    <select
                      value={lessonForm.type}
                      onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value as any })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                    >
                      <option value="video">Video</option>
                      <option value="reading">Reading</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="practice">Practice</option>
                      <option value="lesson">General Lesson</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Order *
                    </label>
                    <input
                      type="number"
                      min={0}
                      required
                      value={lessonForm.order}
                      onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Status *
                    </label>
                    <select
                      value={lessonForm.status}
                      onChange={(e) => setLessonForm({ ...lessonForm, status: e.target.value as any })}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                    >
                      <option value="published">Published (Visible in VLS)</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive (Hidden)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    placeholder="Brief objective of this lesson..."
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Video URL (YouTube, Vimeo, HLS)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Downloadable Resource URL (PDF, Docs)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={lessonForm.resourceUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, resourceUrl: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Text Content / Notes
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Enter lesson body text, reading notes, or assignment instructions..."
                    value={lessonForm.textContent}
                    onChange={(e) => setLessonForm({ ...lessonForm, textContent: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:border-[#0057B8] outline-none font-mono text-xs"
                  />
                </div>

                <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMode("none")}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-[#0057B8] hover:bg-[#004390] text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving..." : activeMode === "add-lesson" ? "Create Lesson" : "Update Lesson"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}