"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { VLSModule, VLSLesson, VLSStatus } from "@/types/vls";

export default function AdminVLSCurriculumPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [modules, setModules] = useState<VLSModule[]>([]);
  const [lessons, setLessons] = useState<VLSLesson[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
  const [isModuleModalOpen, setIsModuleModalOpen] = useState<boolean>(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<VLSModule | null>(null);
  const [editingLesson, setEditingLesson] = useState<VLSLesson | null>(null);

  const [moduleFormData, setModuleFormData] = useState({
    title: "",
    description: "",
    order: 1,
    status: "published" as VLSStatus,
  });

  const [lessonFormData, setLessonFormData] = useState({
    moduleId: "",
    title: "",
    description: "",
    type: "video" as "video" | "reading" | "assignment" | "quiz" | "practice" | "lesson",
    textContent: "",
    videoUrl: "",
    duration: "",
    order: 1,
    status: "published" as VLSStatus,
  });

  const [saving, setSaving] = useState<boolean>(false);

  // Fetch Courses
  const loadCourses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "courses"));
      const list: any[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
          courseId: data.courseId || d.id,
          title: data.title || data.name || "Untitled Course",
        });
      });
      setCourses(list);
      if (list.length > 0 && !selectedCourseId) {
        setSelectedCourseId(list[0].courseId);
      }
    } catch (err: any) {
      console.error("Error loading courses:", err);
      setError("Failed to fetch courses: " + err.message);
    }
  }, [selectedCourseId]);

  // Fetch Curriculum for Selected Course
  const loadCurriculum = useCallback(async () => {
    if (!selectedCourseId) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Modules
      const modulesSnap = await getDocs(collection(db, "modules"));
      const modulesList: VLSModule[] = [];
      modulesSnap.forEach((d) => {
        const data = d.data();
        if (data.courseId === selectedCourseId) {
          modulesList.push({
            id: d.id,
            moduleId: data.moduleId || d.id,
            courseId: data.courseId,
            title: data.title || "Untitled Module",
            description: data.description || "",
            order: Number(data.order || 1),
            status: data.status || "published",
          });
        }
      });
      modulesList.sort((a, b) => a.order - b.order);
      setModules(modulesList);

      // 2. Fetch Lessons
      const lessonsSnap = await getDocs(collection(db, "lessons"));
      const lessonsList: VLSLesson[] = [];
      lessonsSnap.forEach((d) => {
        const data = d.data();
        if (data.courseId === selectedCourseId) {
          lessonsList.push({
            id: d.id,
            lessonId: data.lessonId || d.id,
            moduleId: data.moduleId,
            courseId: data.courseId,
            title: data.title || "Untitled Lesson",
            description: data.description || "",
            type: data.type || "video",
            textContent: data.textContent || "",
            videoUrl: data.videoUrl || "",
            duration: data.duration || "",
            order: Number(data.order || 1),
            status: data.status || "published",
          });
        }
      });
      lessonsList.sort((a, b) => a.order - b.order);
      setLessons(lessonsList);
    } catch (err: any) {
      console.error("Error loading VLS curriculum:", err);
      setError("Unable to load curriculum. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId) {
      loadCurriculum();
    }
  }, [selectedCourseId, loadCurriculum]);

  // Module Handlers
  const handleOpenCreateModule = () => {
    setEditingModule(null);
    setModuleFormData({
      title: "",
      description: "",
      order: modules.length + 1,
      status: "published",
    });
    setIsModuleModalOpen(true);
  };

  const handleOpenEditModule = (mod: VLSModule) => {
    setEditingModule(mod);
    setModuleFormData({
      title: mod.title,
      description: mod.description || "",
      order: mod.order,
      status: mod.status,
    });
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !moduleFormData.title.trim()) return;

    setSaving(true);
    try {
      if (editingModule?.id) {
        const ref = doc(db, "modules", editingModule.id);
        await updateDoc(ref, {
          title: moduleFormData.title.trim(),
          description: moduleFormData.description.trim(),
          order: Number(moduleFormData.order),
          status: moduleFormData.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        const generatedId = `MOD-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, "modules"), {
          moduleId: generatedId,
          courseId: selectedCourseId,
          title: moduleFormData.title.trim(),
          description: moduleFormData.description.trim(),
          order: Number(moduleFormData.order),
          status: moduleFormData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModuleModalOpen(false);
      await loadCurriculum();
    } catch (err: any) {
      alert("Error saving module: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (mod: VLSModule) => {
    const modLessons = lessons.filter(
      (l) => l.moduleId === mod.moduleId || l.moduleId === mod.id
    );

    if (modLessons.length > 0) {
      alert(
        `Cannot delete module "${mod.title}" because it contains ${modLessons.length} lessons. Please delete or reassign its lessons first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete module "${mod.title}"?`)) return;

    try {
      if (mod.id) {
        await deleteDoc(doc(db, "modules", mod.id));
        await loadCurriculum();
      }
    } catch (err: any) {
      alert("Error deleting module: " + err.message);
    }
  };

  // Lesson Handlers
  const handleOpenCreateLesson = (targetModuleId: string) => {
    setEditingLesson(null);
    const existingCount = lessons.filter(
      (l) => l.moduleId === targetModuleId
    ).length;

    setLessonFormData({
      moduleId: targetModuleId,
      title: "",
      description: "",
      type: "video",
      textContent: "",
      videoUrl: "",
      duration: "10 mins",
      order: existingCount + 1,
      status: "published",
    });
    setIsLessonModalOpen(true);
  };

  const handleOpenEditLesson = (les: VLSLesson) => {
    setEditingLesson(les);
    setLessonFormData({
      moduleId: les.moduleId,
      title: les.title,
      description: les.description || "",
      type: les.type as any,
      textContent: les.textContent || "",
      videoUrl: les.videoUrl || "",
      duration: les.duration || "",
      order: les.order,
      status: les.status,
    });
    setIsLessonModalOpen(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !lessonFormData.title.trim() || !lessonFormData.moduleId) return;

    setSaving(true);
    try {
      if (editingLesson?.id) {
        const ref = doc(db, "lessons", editingLesson.id);
        await updateDoc(ref, {
          title: lessonFormData.title.trim(),
          description: lessonFormData.description.trim(),
          type: lessonFormData.type,
          textContent: lessonFormData.textContent.trim(),
          videoUrl: lessonFormData.videoUrl.trim(),
          duration: lessonFormData.duration.trim(),
          order: Number(lessonFormData.order),
          status: lessonFormData.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        const generatedId = `LES-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, "lessons"), {
          lessonId: generatedId,
          moduleId: lessonFormData.moduleId,
          courseId: selectedCourseId,
          title: lessonFormData.title.trim(),
          description: lessonFormData.description.trim(),
          type: lessonFormData.type,
          textContent: lessonFormData.textContent.trim(),
          videoUrl: lessonFormData.videoUrl.trim(),
          duration: lessonFormData.duration.trim(),
          order: Number(lessonFormData.order),
          status: lessonFormData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsLessonModalOpen(false);
      await loadCurriculum();
    } catch (err: any) {
      alert("Error saving lesson: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (les: VLSLesson) => {
    if (!window.confirm(`Delete lesson "${les.title}"?`)) return;
    try {
      if (les.id) {
        await deleteDoc(doc(db, "lessons", les.id));
        await loadCurriculum();
      }
    } catch (err: any) {
      alert("Error deleting lesson: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      {/* HEADER */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-[#0057B8] transition font-medium">
                ← Admin Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">VLS Curriculum</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Curriculum Management
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Structure courses into modules and lessons. Published items automatically sync with Student VLS.
            </p>
          </div>

          {selectedCourseId && (
            <button
              onClick={handleOpenCreateModule}
              className="bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
            >
              + Add New Module
            </button>
          )}
        </div>

        {/* SUBNAV */}
        <nav className="flex gap-2 border-b border-slate-200 pb-3 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/vls/curriculum"
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold"
          >
            Curriculum Builder
          </Link>
          <Link
            href="/admin/vls/modules"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            Modules List
          </Link>
          <Link
            href="/admin/vls/lessons"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            Lessons List
          </Link>
          <Link
            href="/admin/vls/progress"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            Student Progress
          </Link>
        </nav>
      </header>

      {/* SELECT COURSE BAR */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1 max-w-md">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Select Course Program
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-bold bg-white"
          >
            {courses.length === 0 ? (
              <option value="">No courses available</option>
            ) : (
              courses.map((c) => (
                <option key={c.id} value={c.courseId}>
                  {c.title} ({c.courseId})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="text-xs text-slate-500 text-right">
          Total Modules: <span className="font-bold text-slate-900">{modules.length}</span> •
          Total Lessons: <span className="font-bold text-slate-900">{lessons.length}</span>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* CURRICULUM TREE */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-4">
            No curriculum modules created for this course yet.
          </p>
          <button
            onClick={handleOpenCreateModule}
            className="px-4 py-2 bg-[#0057B8] text-white rounded-xl text-xs font-semibold hover:bg-[#004494]"
          >
            + Create First Module
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((mod) => {
            const modLessons = lessons.filter(
              (l) => l.moduleId === mod.moduleId || l.moduleId === mod.id
            );

            return (
              <div
                key={mod.id || mod.moduleId}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Module Header */}
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-[#0057B8] font-bold text-xs flex items-center justify-center border border-blue-100">
                      {mod.order}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{mod.title}</h3>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded capitalize ${
                            mod.status === "published" || mod.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {mod.status}
                        </span>
                      </div>
                      {mod.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCreateLesson(mod.moduleId)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0057B8] bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200"
                    >
                      + Add Lesson
                    </button>
                    <button
                      onClick={() => handleOpenEditModule(mod)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      title="Delete Module"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Module Lessons */}
                <div className="p-4 space-y-2 bg-white">
                  {modLessons.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-2">
                      No lessons in this module. Click "+ Add Lesson" to create one.
                    </p>
                  ) : (
                    modLessons.map((les) => (
                      <div
                        key={les.id || les.lessonId}
                        className="p-3 bg-slate-50/60 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {les.order}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {les.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {les.type}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
                                  les.status === "published" || les.status === "active"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {les.status}
                              </span>
                            </div>
                            {les.duration && (
                              <span className="text-[11px] text-slate-400">⏱️ {les.duration}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditLesson(les)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(les)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODULE MODAL */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingModule ? "Edit Module" : "Create New Module"}
            </h3>

            <form onSubmit={handleSaveModule} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Programming"
                  value={moduleFormData.title}
                  onChange={(e) => setModuleFormData({ ...moduleFormData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Module summary..."
                  value={moduleFormData.description}
                  onChange={(e) =>
                    setModuleFormData({ ...moduleFormData, description: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    value={moduleFormData.order}
                    onChange={(e) =>
                      setModuleFormData({ ...moduleFormData, order: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={moduleFormData.status}
                    onChange={(e) =>
                      setModuleFormData({ ...moduleFormData, status: e.target.value as VLSStatus })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494]"
                >
                  {saving ? "Saving..." : "Save Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON MODAL */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingLesson ? "Edit Lesson" : "Create New Lesson"}
            </h3>

            <form onSubmit={handleSaveLesson} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Variables and Data Types"
                  value={lessonFormData.title}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={lessonFormData.type}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, type: e.target.value as any })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="video">Video Lesson</option>
                    <option value="reading">Reading / Markdown</option>
                    <option value="quiz">Quiz</option>
                    <option value="practice">Practice Exercise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 15 mins"
                    value={lessonFormData.duration}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, duration: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>
              </div>

              {lessonFormData.type === "video" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Video Embed URL</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={lessonFormData.videoUrl}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, videoUrl: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reading Content / Notes</label>
                <textarea
                  rows={4}
                  placeholder="Markdown or formatted lesson content..."
                  value={lessonFormData.textContent}
                  onChange={(e) =>
                    setLessonFormData({ ...lessonFormData, textContent: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    value={lessonFormData.order}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, order: Number(e.target.value) })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={lessonFormData.status}
                    onChange={(e) =>
                      setLessonFormData({ ...lessonFormData, status: e.target.value as VLSStatus })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494]"
                >
                  {saving ? "Saving..." : "Save Lesson"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}