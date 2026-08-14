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
import { VLSModule, VLSStatus } from "@/types/vls";

export default function AdminVLSModulesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [modules, setModules] = useState<VLSModule[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingModule, setEditingModule] = useState<VLSModule | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    courseId: "",
    title: "",
    description: "",
    order: 1,
    status: "published" as VLSStatus,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load Courses
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

      // Load Modules
      const mSnap = await getDocs(collection(db, "modules"));
      const mList: VLSModule[] = [];
      mSnap.forEach((d) => {
        const data = d.data();
        mList.push({
          id: d.id,
          moduleId: data.moduleId || d.id,
          courseId: data.courseId,
          title: data.title || "Untitled Module",
          description: data.description || "",
          order: Number(data.order || 1),
          status: data.status || "published",
        });
      });
      mList.sort((a, b) => a.order - b.order);
      setModules(mList);
    } catch (err: any) {
      console.error("Error fetching VLS modules:", err);
      setError("Unable to load modules. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      if (selectedCourseFilter !== "ALL" && m.courseId !== selectedCourseFilter) return false;
      if (statusFilter !== "ALL" && m.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(term);
        const matchDesc = (m.description || "").toLowerCase().includes(term);
        const matchId = m.moduleId.toLowerCase().includes(term);
        return matchTitle || matchDesc || matchId;
      }
      return true;
    });
  }, [modules, selectedCourseFilter, statusFilter, searchTerm]);

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData({
      courseId: courses[0]?.courseId || "",
      title: "",
      description: "",
      order: modules.length + 1,
      status: "published",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mod: VLSModule) => {
    setEditingModule(mod);
    setFormData({
      courseId: mod.courseId,
      title: mod.title,
      description: mod.description || "",
      order: mod.order,
      status: mod.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.courseId || !formData.title.trim()) return;

    setSaving(true);
    try {
      if (editingModule?.id) {
        await updateDoc(doc(db, "modules", editingModule.id), {
          courseId: formData.courseId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          order: Number(formData.order),
          status: formData.status,
          updatedAt: serverTimestamp(),
        });
      } else {
        const generatedId = `MOD-${Date.now().toString().slice(-6)}`;
        await addDoc(collection(db, "modules"), {
          moduleId: generatedId,
          courseId: formData.courseId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          order: Number(formData.order),
          status: formData.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setIsModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert("Error saving module: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mod: VLSModule) => {
    if (!window.confirm(`Delete module "${mod.title}"?`)) return;
    try {
      if (mod.id) {
        await deleteDoc(doc(db, "modules", mod.id));
        await fetchData();
      }
    } catch (err: any) {
      alert("Error deleting module: " + err.message);
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
              <span className="text-slate-800 font-semibold">VLS Modules</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Module Repository
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Overview and management of all curriculum modules across courses.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
          >
            + Add New Module
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
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold"
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

      {/* FILTER BAR */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by module title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
            />
            <span className="absolute left-3 top-3 text-slate-400">🔍</span>
          </div>

          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
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

      {/* ERROR BANNER */}
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
      ) : filteredModules.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">No modules found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="p-4">Order</th>
                  <th className="p-4">Module Title</th>
                  <th className="p-4">Course ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModules.map((m) => (
                  <tr key={m.id || m.moduleId} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono font-bold text-slate-600">{m.order}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{m.title}</div>
                      {m.description && (
                        <div className="text-xs text-slate-500 mt-0.5 max-w-md line-clamp-1">
                          {m.description}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{m.courseId}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded capitalize ${
                          m.status === "published" || m.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(m)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
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
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingModule ? "Edit Module" : "Create New Module"}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course *</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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
                <label className="block font-semibold text-slate-700 mb-1">Module Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Introduction to Programming"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Module summary..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: Number(e.target.value) })
                    }
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
                  {saving ? "Saving..." : "Save Module"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}