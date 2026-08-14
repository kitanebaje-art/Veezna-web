"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { VLSLesson, VLSModule, VLSStatus } from "@/types/vls";

export default function AdminVLSLessonsPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<VLSModule[]>([]);
  const [lessons, setLessons] = useState<VLSLesson[]>([]);

  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingLesson, setEditingLesson] = useState<VLSLesson | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    courseId: "",
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Courses
      const cSnap = await getDocs(collection(db, "courses"));
      const cList: any[] = [];
      cSnap.forEach((d) => {
        const data = d.data();
        cList.push({
          id: d.id,
          courseId: data.courseId || d.id,
          title: data.title || data.name || "Untitled Course",
        });
      });
      setCourses(cList);

      // Modules
      const mSnap = await getDocs(collection(db, "modules"));
      const mList: VLSModule[] = [];
      mSnap.forEach((d) => {
        const data = d.data();
        mList.push({
          id: d.id,
          moduleId: data.moduleId || d.id,
          courseId: data.courseId,
          title: data.title || "Untitled Module",
          order: Number(data.order || 1),
          status: data.status || "published",
        });
      });
      setModules(mList);

      // Lessons
      const lSnap = await getDocs(collection(db, "lessons"));
      const lList: VLSLesson[] = [];
      lSnap.forEach((d) => {
        const data = d.data();
        lList.push({
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
      });
      lList.sort((a, b) => a.order - b.order);
      setLessons(lList);
    } catch (err: any) {
      console.error("Error fetching lessons:", err);
      setError("Unable to load lessons. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter modules based on selected course in form
  const availableModulesForCourse = useMemo(() => {
    if (!formData.courseId) return [];
    return modules.filter((m) => m.courseId === formData.courseId);
  }, [modules, formData.courseId]);

  const filteredLessons = useMemo(() => {
    return lessons.filter((l) => {
      if (selectedCourseFilter !== "ALL" && l.courseId !== selectedCourseFilter) return false;
      if (selectedModuleFilter !== "ALL" && l.moduleId !== selectedModuleFilter) return false;
      if (statusFilter !== "ALL" && l.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = l.title.toLowerCase().includes(term);
        const matchDesc = (l.description || "").toLowerCase().includes(term);
        const matchId = l.lessonId.toLowerCase().includes(term);
        return matchTitle || matchDesc || matchId;
      }
      return true;
    });
  }, [lessons, selectedCourseFilter, selectedModuleFilter, statusFilter, searchTerm]);

  const handleOpenCreate = () => {
    const defaultCourse = courses[0]?.courseId || "";
    const defaultModules = modules.filter((m) => m.courseId === defaultCourse);

    setEditingLesson(null);
    setFormData({
      courseId: defaultCourse,
      moduleId: defaultModules[0]?.moduleId || "",
      title: "",
      description: "",
      type: "video",
      textContent: "",
      videoUrl: "",
      duration: "10 mins",
      order: lessons.length + 1,
      status: "published",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (les: VLSLesson) => {
    setEditingLesson(les);
    setFormData({
      courseId: les.courseId,
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
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.moduleId || !formData.title.trim()) return;

    setSaving(true);
    try {
      if (editingLesson?.id) {
        await updateDoc(doc(db, "lessons", editingLesson.id), {
          courseId: formData.courseId,
          moduleId: formData.moduleId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          textContent: formData.textContent.trim(),
          videoUrl: formData.videoUrl.trim(),
          duration: formData.duration.trim(),
          order: Number(formData.order),
          status: formData.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        const generatedId = `LES-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, "lessons"), {
          lessonId: generatedId,
          courseId: formData.courseId,
          moduleId: formData.moduleId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          textContent: formData.textContent.trim(),
          videoUrl: formData.videoUrl.trim(),
          duration: formData.duration.trim(),
          order: Number(formData.order),
          status: formData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert("Error saving lesson: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (les: VLSLesson) => {
    if (!window.confirm(`Delete lesson "${les.title}"?`)) return;
    try {
      if (les.id) {
        await deleteDoc(doc(db, "lessons", les.id));
        await fetchData();
      }
    } catch (err: any) {
      alert("Error deleting lesson: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-[#0057B8] transition font-medium">
                ← Admin Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">VLS Lessons</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Lesson Repository
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Manage video embeds, reading materials, exercises, and lesson publication states.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
          >
            + Add New Lesson
          </button>
        </div>

        <nav className="flex gap-2 border-b border-slate-200 pb-3 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/vls/curriculum"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
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
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold"
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

      {/* FILTERS */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
            />
            <span className="absolute left-3 top-3 text-slate-400">🔍</span>
          </div>

          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => {
                setSelectedCourseFilter(e.target.value);
                setSelectedModuleFilter("ALL");
              }}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.courseId}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedModuleFilter}
              onChange={(e) => setSelectedModuleFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
            >
              <option value="ALL">All Modules</option>
              {modules
                .filter((m) => selectedCourseFilter === "ALL" || m.courseId === selectedCourseFilter)
                .map((m) => (
                  <option key={m.id} value={m.moduleId}>
                    {m.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">No lessons found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="p-4">Order</th>
                  <th className="p-4">Lesson Title</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Course / Module</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLessons.map((l) => (
                  <tr key={l.id || l.lessonId} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-600">{l.order}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{l.title}</div>
                      {l.duration && (
                        <div className="text-[11px] text-slate-400">⏱️ {l.duration}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {l.type}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      <div>{l.courseId}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{l.moduleId}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded capitalize ${
                          l.status === "published" || l.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(l)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingLesson ? "Edit Lesson" : "Create New Lesson"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Course *</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        courseId: e.target.value,
                        moduleId:
                          modules.find((m) => m.courseId === e.target.value)?.moduleId || "",
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.courseId}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Module *</label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    {availableModulesForCourse.map((m) => (
                      <option key={m.id} value={m.moduleId}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Variables and Data Types"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Content Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
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
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>
              </div>

              {formData.type === "video" && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Video Embed URL</label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reading Content / Notes</label>
                <textarea
                  rows={4}
                  placeholder="Markdown or formatted lesson content..."
                  value={formData.textContent}
                  onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as VLSStatus })
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
                  onClick={() => setIsModalOpen(false)}
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