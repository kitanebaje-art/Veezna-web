"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// --- TYPESCRIPT INTERFACES ---
export interface CourseRef {
  id: string;
  courseId: string;
  name: string;
}

export type MaterialType =
  | "Notes"
  | "PDF"
  | "Video"
  | "External Link"
  | "Document"
  | "Other";

export type MaterialStatus = "draft" | "published";

export interface StudyMaterial {
  id: string; // Firestore Document ID
  materialId: string; // Human-readable ID (e.g. VZ-MAT-1001)
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  className: string;
  subject: string;
  chapter: string;
  batch: string;
  materialType: MaterialType;
  resourceUrl: string;
  fileUrl: string;
  status: MaterialStatus;
  createdAt: string;
  updatedAt: string;
}

export default function AdminStudyMaterialPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [classFilter, setClassFilter] = useState<string>("All");
  const [batchFilter, setBatchFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modal & Selection States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Action / Form States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    courseName: "",
    className: "",
    subject: "",
    chapter: "",
    batch: "",
    materialType: "PDF" as MaterialType,
    resourceUrl: "",
    fileUrl: "",
    status: "published" as MaterialStatus,
  });

  // --- HELPERS ---
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const parseDateString = (val: unknown): string => {
    if (!val) return new Date().toISOString();
    if (val instanceof Timestamp) return val.toDate().toISOString();
    if (typeof (val as { toMillis?: () => number })?.toMillis === "function") {
      return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
    }
    if (val instanceof Date) return val.toISOString();
    if (typeof val === "string") {
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    }
    return new Date().toISOString();
  };

  const formatDateDisplay = (isoStr?: string): string => {
    if (!isoStr) return "—";
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // --- DATA FETCHING ---
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Courses for Selection Mapping
      try {
        const courseSnap = await getDocs(collection(db, "courses"));
        const courseList: CourseRef[] = courseSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            courseId: d.courseId || docSnap.id,
            name: d.name || d.title || "Untitled Course",
          };
        });
        setCourses(courseList);
      } catch (cErr) {
        console.warn("Notice: Unable to load courses for mapping, proceeding with existing entries.", cErr);
      }

      // 2. Fetch Study Materials
      const matSnap = await getDocs(collection(db, "studyMaterials"));
      const matList: StudyMaterial[] = matSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          materialId: d.materialId || docSnap.id,
          title: d.title || "Untitled Resource",
          description: d.description || "",
          courseId: d.courseId || "",
          courseName: d.courseName || "General",
          className: d.className || "All Classes",
          subject: d.subject || "General",
          chapter: d.chapter || "General",
          batch: d.batch || "All Batches",
          materialType: (d.materialType as MaterialType) || "PDF",
          resourceUrl: d.resourceUrl || "",
          fileUrl: d.fileUrl || "",
          status: (d.status as MaterialStatus) || "published",
          createdAt: parseDateString(d.createdAt),
          updatedAt: parseDateString(d.updatedAt),
        };
      });

      matList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMaterials(matList);
    } catch (err) {
      console.error("Error fetching study materials:", err);
      setError("Unable to load study materials. Please check your database permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- UNIQUE FILTER DROPDOWN OPTIONS ---
  const availableClasses = useMemo(() => {
    const setObj = new Set<string>();
    materials.forEach((m) => {
      if (m.className) setObj.add(m.className);
    });
    return ["All", ...Array.from(setObj)];
  }, [materials]);

  const availableBatches = useMemo(() => {
    const setObj = new Set<string>();
    materials.forEach((m) => {
      if (m.batch) setObj.add(m.batch);
    });
    return ["All", ...Array.from(setObj)];
  }, [materials]);

  // --- FILTERED LIST ---
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !sTerm ||
        m.title.toLowerCase().includes(sTerm) ||
        m.courseName.toLowerCase().includes(sTerm) ||
        m.subject.toLowerCase().includes(sTerm) ||
        m.chapter.toLowerCase().includes(sTerm) ||
        m.materialId.toLowerCase().includes(sTerm);

      const matchesType = typeFilter === "All" || m.materialType === typeFilter;
      const matchesCourse = courseFilter === "All" || m.courseId === courseFilter;
      const matchesClass = classFilter === "All" || m.className === classFilter;
      const matchesBatch = batchFilter === "All" || m.batch === batchFilter;
      const matchesStatus = statusFilter === "All" || m.status === statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesType &&
        matchesCourse &&
        matchesClass &&
        matchesBatch &&
        matchesStatus
      );
    });
  }, [
    materials,
    searchTerm,
    typeFilter,
    courseFilter,
    classFilter,
    batchFilter,
    statusFilter,
  ]);

  // --- OVERVIEW CARDS COUNTS ---
  const overviewStats = useMemo(() => {
    const total = materials.length;
    const published = materials.filter((m) => m.status === "published").length;
    const draft = total - published;
    const pdfNotesCount = materials.filter(
      (m) => m.materialType === "PDF" || m.materialType === "Notes" || m.materialType === "Document"
    ).length;
    const videoLinksCount = materials.filter(
      (m) => m.materialType === "Video" || m.materialType === "External Link"
    ).length;

    return { total, published, draft, pdfNotesCount, videoLinksCount };
  }, [materials]);

  // --- FORM RESET & MODAL CONTROLS ---
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseId: courses.length > 0 ? courses[0].courseId : "",
      courseName: courses.length > 0 ? courses[0].name : "",
      className: "All Classes",
      subject: "",
      chapter: "",
      batch: "All Batches",
      materialType: "PDF",
      resourceUrl: "",
      fileUrl: "",
      status: "published",
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingMaterial(null);
    setIsModalOpen(true);
  };

  const openEditModal = (mat: StudyMaterial) => {
    setEditingMaterial(mat);
    setFormData({
      title: mat.title,
      description: mat.description,
      courseId: mat.courseId,
      courseName: mat.courseName,
      className: mat.className,
      subject: mat.subject,
      chapter: mat.chapter,
      batch: mat.batch,
      materialType: mat.materialType,
      resourceUrl: mat.resourceUrl,
      fileUrl: mat.fileUrl,
      status: mat.status,
    });
    setIsModalOpen(true);
  };

  const handleCourseChange = (selectedCourseId: string) => {
    const selected = courses.find(
      (c) => c.courseId === selectedCourseId || c.id === selectedCourseId
    );
    setFormData((prev) => ({
      ...prev,
      courseId: selectedCourseId,
      courseName: selected ? selected.name : prev.courseName || "General",
    }));
  };

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("All");
    setCourseFilter("All");
    setClassFilter("All");
    setBatchFilter("All");
    setStatusFilter("All");
  };

  // --- CRUD ACTIONS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a Material Title.");
      return;
    }
    if (!formData.courseId && courses.length > 0) {
      alert("Please select a Course.");
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId || "general",
        courseName: formData.courseName.trim() || "General",
        className: formData.className.trim() || "All Classes",
        subject: formData.subject.trim() || "General",
        chapter: formData.chapter.trim() || "General",
        batch: formData.batch.trim() || "All Batches",
        materialType: formData.materialType,
        resourceUrl: formData.resourceUrl.trim(),
        fileUrl: formData.fileUrl.trim(),
        status: formData.status,
        updatedAt: now,
      };

      if (editingMaterial) {
        // Update Existing Record
        const docRef = doc(db, "studyMaterials", editingMaterial.id);
        await updateDoc(docRef, payload);

        setMaterials((prev) =>
          prev.map((m) =>
            m.id === editingMaterial.id ? { ...m, ...payload } : m
          )
        );
        showToast("Study material updated successfully.");
      } else {
        // Create New Record
        const generatedMaterialId = `VZ-MAT-${Math.floor(1000 + Math.random() * 9000)}`;
        const createPayload = {
          ...payload,
          materialId: generatedMaterialId,
          createdAt: now,
        };

        const docRef = await addDoc(
          collection(db, "studyMaterials"),
          createPayload
        );
        setMaterials((prev) => [
          { id: docRef.id, ...createPayload },
          ...prev,
        ]);
        showToast("Study material created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving study material:", err);
      alert("Failed to save material. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (mat: StudyMaterial) => {
    const newStatus: MaterialStatus =
      mat.status === "published" ? "draft" : "published";

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const docRef = doc(db, "studyMaterials", mat.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: now,
      });

      setMaterials((prev) =>
        prev.map((m) =>
          m.id === mat.id ? { ...m, status: newStatus, updatedAt: now } : m
        )
      );

      if (viewingMaterial?.id === mat.id) {
        setViewingMaterial((prev) =>
          prev ? { ...prev, status: newStatus, updatedAt: now } : null
        );
      }

      showToast(`Material status changed to ${newStatus}.`);
    } catch (err) {
      console.error("Error updating publish status:", err);
      alert("Failed to change publish status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (mat: StudyMaterial) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${mat.title}" (${mat.materialId})?`
    );
    if (!confirmDelete) return;

    setDeletingId(mat.id);
    try {
      await deleteDoc(doc(db, "studyMaterials", mat.id));
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));

      if (viewingMaterial?.id === mat.id) {
        setViewingMaterial(null);
      }

      showToast("Study material deleted successfully.");
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Failed to delete study material. Please check permissions.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* TOP NAVIGATION BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Admin Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <span>+ Add Material</span>
            </button>
          </div>
        </div>

        {/* PAGE HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Study Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Manage notes, PDFs, learning resources and educational content.
          </p>
        </div>

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Materials
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {overviewStats.total}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Published
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {overviewStats.published}
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Draft
            </span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              {overviewStats.draft}
            </span>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">
              PDFs & Notes
            </span>
            <span className="text-2xl font-black text-[#0057B8] mt-1 block">
              {overviewStats.pdfNotesCount}
            </span>
          </div>

          <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-purple-600">
              Videos & Links
            </span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">
              {overviewStats.videoLinksCount}
            </span>
          </div>
        </div>

        {/* SEARCH AND FILTERS PANEL */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="Search title, course, subject, topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
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

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Types</option>
                <option value="Notes">Notes</option>
                <option value="PDF">PDF</option>
                <option value="Video">Video</option>
                <option value="External Link">External Link</option>
                <option value="Document">Document</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Course Filter */}
            <div>
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.courseId}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                {availableClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls === "All" ? "All Classes" : cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch / Status Filter Composite */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">
              Showing {filteredMaterials.length} of {materials.length} resources
            </span>
            <button
              onClick={clearFilters}
              className="text-[#0057B8] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* MAIN LIST DISPLAY */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">
              Loading study materials...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-200 shadow-sm text-rose-700 space-y-3">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              📚
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No study materials found.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No matching records found. Click "+ Add Material" to upload or create educational resources.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden lg:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">Material</th>
                      <th className="py-3.5 px-4">Course & Class</th>
                      <th className="py-3.5 px-4">Subject / Chapter</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Created Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.map((mat) => {
                      const isPub = mat.status === "published";
                      const isDeleting = deletingId === mat.id;

                      return (
                        <tr
                          key={mat.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block truncate max-w-xs">
                              {mat.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: {mat.materialId}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 block">
                              {mat.courseName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {mat.className}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 block">
                              {mat.subject}
                            </span>
                            <span className="text-slate-400 text-[10px] block truncate max-w-[120px]">
                              Ch: {mat.chapter}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {mat.batch}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="bg-blue-50 text-[#0057B8] font-semibold px-2.5 py-0.5 rounded text-[10px]">
                              {mat.materialType}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isPub
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {mat.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {formatDateDisplay(mat.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingMaterial(mat)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditModal(mat)}
                                className="px-2.5 py-1 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-[11px] font-medium transition"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleTogglePublish(mat)}
                                disabled={isSubmitting}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                                  isPub
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {isPub ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                onClick={() => handleDelete(mat)}
                                disabled={isDeleting}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Resource"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block lg:hidden space-y-3">
              {filteredMaterials.map((mat) => {
                const isPub = mat.status === "published";
                const isDeleting = deletingId === mat.id;

                return (
                  <div
                    key={mat.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="bg-blue-50 text-[#0057B8] font-bold px-2 py-0.5 rounded text-[10px] inline-block mb-1">
                          {mat.materialType}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 leading-snug">
                          {mat.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {mat.materialId}
                        </span>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                          isPub
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {mat.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p>
                        Course: <strong className="text-slate-700">{mat.courseName}</strong> ({mat.className})
                      </p>
                      <p>
                        Subject: <span className="text-slate-700">{mat.subject}</span> • Ch: {mat.chapter}
                      </p>
                      <p>Batch: <span className="text-slate-700">{mat.batch}</span></p>
                    </div>

                    <div className="pt-1 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">
                        {formatDateDisplay(mat.createdAt)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingMaterial(mat)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(mat)}
                          className="px-2.5 py-1 bg-blue-50 text-[#0057B8] rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublish(mat)}
                          className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-semibold"
                        >
                          {isPub ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => handleDelete(mat)}
                          disabled={isDeleting}
                          className="p-1 text-rose-500 rounded-lg"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* VIEW MATERIAL DETAILS MODAL */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setViewingMaterial(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="bg-blue-50 text-[#0057B8] font-mono font-bold text-xs px-2.5 py-0.5 rounded">
                ID: {viewingMaterial.materialId}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">
                {viewingMaterial.title}
              </h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <p>
                <strong className="text-slate-500">Course Name:</strong>{" "}
                {viewingMaterial.courseName}
              </p>
              <p>
                <strong className="text-slate-500">Target Class:</strong>{" "}
                {viewingMaterial.className}
              </p>
              <p>
                <strong className="text-slate-500">Subject:</strong>{" "}
                {viewingMaterial.subject}
              </p>
              <p>
                <strong className="text-slate-500">Chapter / Topic:</strong>{" "}
                {viewingMaterial.chapter}
              </p>
              <p>
                <strong className="text-slate-500">Assigned Batch:</strong>{" "}
                {viewingMaterial.batch}
              </p>
              <p>
                <strong className="text-slate-500">Material Type:</strong>{" "}
                {viewingMaterial.materialType}
              </p>
              <p>
                <strong className="text-slate-500">Publish Status:</strong>{" "}
                <span className="capitalize font-semibold">
                  {viewingMaterial.status}
                </span>
              </p>
              <p>
                <strong className="text-slate-500">Description:</strong>{" "}
                {viewingMaterial.description || "No description provided."}
              </p>
            </div>

            <div className="bg-slate-100 p-3 rounded-2xl text-[11px] text-slate-500 space-y-0.5">
              <p>
                <strong>Created Date:</strong>{" "}
                {formatDateDisplay(viewingMaterial.createdAt)}
              </p>
              <p>
                <strong>Last Updated:</strong>{" "}
                {formatDateDisplay(viewingMaterial.updatedAt)}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {(viewingMaterial.resourceUrl || viewingMaterial.fileUrl) && (
                <a
                  href={
                    viewingMaterial.resourceUrl || viewingMaterial.fileUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2 bg-[#0057B8] hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
                >
                  Open Resource URL
                </a>
              )}
              <button
                onClick={() => setViewingMaterial(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition"
            >
              ✕
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#0057B8]">
                {editingMaterial ? "Edit Study Material" : "Add Study Material"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set educational resources, video links, or document URLs for Veezna students.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Physics Thermodynamics Notes"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Overview of resource contents or study objectives..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Target Course *
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="">General / All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.courseId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Class / Level
                  </label>
                  <input
                    type="text"
                    value={formData.className}
                    onChange={(e) =>
                      setFormData({ ...formData, className: e.target.value })
                    }
                    placeholder="e.g. Class 11 / Class 12"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Chapter / Topic
                  </label>
                  <input
                    type="text"
                    value={formData.chapter}
                    onChange={(e) =>
                      setFormData({ ...formData, chapter: e.target.value })
                    }
                    placeholder="e.g. Calculus Chapter 4"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Target Batch
                  </label>
                  <input
                    type="text"
                    value={formData.batch}
                    onChange={(e) =>
                      setFormData({ ...formData, batch: e.target.value })
                    }
                    placeholder="e.g. Morning / Evening Batch"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Material Type *
                  </label>
                  <select
                    value={formData.materialType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        materialType: e.target.value as MaterialType,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="Notes">Notes</option>
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                    <option value="External Link">External Link</option>
                    <option value="Document">Document</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Resource / Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.resourceUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, resourceUrl: e.target.value })
                    }
                    placeholder="https://youtube.com/watch?v=... or Google Drive URL"
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Direct File / Document URL
                  </label>
                  <input
                    type="url"
                    value={formData.fileUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fileUrl: e.target.value })
                    }
                    placeholder="https://example.com/notes.pdf"
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as MaterialStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl font-semibold shadow-md disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving Material..."
                    : editingMaterial
                    ? "Update Material"
                    : "Save & Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}