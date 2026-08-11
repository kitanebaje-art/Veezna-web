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
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";

export interface CourseRef {
  id: string;
  courseId: string;
  name: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  subject: string;
  module: string;
  type: "PDF" | "Notes" | "Assignment" | "Worksheet" | "Practice Paper" | "Question Paper" | "Video" | "External Link" | "Other";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  externalUrl?: string;
  thumbnailUrl?: string;
  academicClass?: string;
  visibility: "Enrolled Students" | "All Students" | "Specific Course";
  status: "published" | "draft";
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function AdminStudyMaterialPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals & Active Selections
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<StudyMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<StudyMaterial | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    courseId: "",
    courseName: "",
    subject: "",
    module: "",
    type: "PDF" as StudyMaterial["type"],
    externalUrl: "",
    thumbnailUrl: "",
    academicClass: "",
    visibility: "Enrolled Students" as StudyMaterial["visibility"],
    status: "published" as StudyMaterial["status"],
  });

  // Fetch Courses & Study Materials
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load Courses for dropdown mapping
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

      // 2. Load Materials
      const matSnap = await getDocs(collection(db, "studyMaterials"));
      const matList: StudyMaterial[] = matSnap.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          title: d.title || "Untitled Resource",
          description: d.description || "",
          courseId: d.courseId || "",
          courseName: d.courseName || "General",
          subject: d.subject || "General",
          module: d.module || "General",
          type: d.type || "PDF",
          fileUrl: d.fileUrl || "",
          fileName: d.fileName || "",
          fileSize: d.fileSize || 0,
          externalUrl: d.externalUrl || "",
          thumbnailUrl: d.thumbnailUrl || "",
          academicClass: d.academicClass || "",
          visibility: d.visibility || "Enrolled Students",
          status: d.status || "published",
          uploadedBy: d.uploadedBy || "admin",
          uploadedByName: d.uploadedByName || "Veezna Admin",
          createdAt: parseDateString(d.createdAt),
          updatedAt: parseDateString(d.updatedAt),
          publishedAt: d.publishedAt ? parseDateString(d.publishedAt) : undefined,
        };
      });

      matList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMaterials(matList);
    } catch (err) {
      console.error("Error fetching study materials:", err);
      setError("Unable to load study materials. Please check connection and permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  function parseDateString(val: unknown): string {
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
  }

  function formatDateDisplay(isoStr?: string): string {
    if (!isoStr) return "—";
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  // Filtered List
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !sTerm ||
        m.title.toLowerCase().includes(sTerm) ||
        m.subject.toLowerCase().includes(sTerm) ||
        m.module.toLowerCase().includes(sTerm) ||
        m.courseName.toLowerCase().includes(sTerm);

      const matchesCourse = courseFilter === "All" || m.courseId === courseFilter;
      const matchesType = typeFilter === "All" || m.type === typeFilter;
      const matchesStatus = statusFilter === "All" || m.status === statusFilter.toLowerCase();

      return matchesSearch && matchesCourse && matchesType && matchesStatus;
    });
  }, [materials, searchTerm, courseFilter, typeFilter, statusFilter]);

  // Form Reset & Open Modals
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      courseId: courses.length > 0 ? courses[0].courseId : "",
      courseName: courses.length > 0 ? courses[0].name : "",
      subject: "",
      module: "",
      type: "PDF",
      externalUrl: "",
      thumbnailUrl: "",
      academicClass: "",
      visibility: "Enrolled Students",
      status: "published",
    });
    setSelectedFile(null);
    setUploadProgress(null);
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
      subject: mat.subject,
      module: mat.module,
      type: mat.type,
      externalUrl: mat.externalUrl || "",
      thumbnailUrl: mat.thumbnailUrl || "",
      academicClass: mat.academicClass || "",
      visibility: mat.visibility,
      status: mat.status,
    });
    setSelectedFile(null);
    setUploadProgress(null);
    setIsModalOpen(true);
  };

  const handleCourseChange = (selectedCourseId: string) => {
    const selected = courses.find((c) => c.courseId === selectedCourseId || c.id === selectedCourseId);
    setFormData((prev) => ({
      ...prev,
      courseId: selectedCourseId,
      courseName: selected ? selected.name : "General",
    }));
  };

  // Submit Handler for Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Please enter a Material Title.");
      return;
    }
    if (!formData.courseId) {
      alert("Please select a Course.");
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      let fileUrl = editingMaterial?.fileUrl || "";
      let fileName = editingMaterial?.fileName || "";
      let fileSize = editingMaterial?.fileSize || 0;

      // Handle File Upload if selected
      if (selectedFile) {
        if (selectedFile.size > 25 * 1024 * 1024) {
          alert("File size exceeds 25MB limit. Please compress or use an External URL.");
          setIsSubmitting(false);
          return;
        }

        if (storage) {
          const fileRef = ref(
            storage,
            `study-materials/${formData.courseId}/${Date.now()}_${selectedFile.name}`
          );
          const uploadTask = uploadBytesResumable(fileRef, selectedFile);

          await new Promise<void>((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                setUploadProgress(progress);
              },
              (err) => reject(err),
              async () => {
                fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
                fileName = selectedFile.name;
                fileSize = selectedFile.size;
                resolve();
              }
            );
          });
        }
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        courseId: formData.courseId,
        courseName: formData.courseName,
        subject: formData.subject.trim() || "General",
        module: formData.module.trim() || "General",
        type: formData.type,
        fileUrl,
        fileName,
        fileSize,
        externalUrl: formData.externalUrl.trim(),
        thumbnailUrl: formData.thumbnailUrl.trim(),
        academicClass: formData.academicClass.trim(),
        visibility: formData.visibility,
        status: formData.status,
        updatedAt: now,
      };

      if (editingMaterial) {
        // Update Document
        const docRef = doc(db, "studyMaterials", editingMaterial.id);
        await updateDoc(docRef, payload);

        setMaterials((prev) =>
          prev.map((m) => (m.id === editingMaterial.id ? { ...m, ...payload } : m))
        );
        showToast("Study Material updated successfully.");
      } else {
        // Create Document
        const createPayload = {
          ...payload,
          uploadedBy: "admin",
          uploadedByName: "Veezna Admin",
          createdAt: now,
          publishedAt: formData.status === "published" ? now : "",
        };

        const docRef = await addDoc(collection(db, "studyMaterials"), createPayload);
        setMaterials((prev) => [{ id: docRef.id, ...createPayload }, ...prev]);
        showToast("Study Material created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving material:", err);
      alert("Failed to save Study Material. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (mat: StudyMaterial) => {
    const newStatus = mat.status === "published" ? "draft" : "published";
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const docRef = doc(db, "studyMaterials", mat.id);
      await updateDoc(docRef, {
        status: newStatus,
        publishedAt: newStatus === "published" ? now : mat.publishedAt || "",
        updatedAt: now,
      });

      setMaterials((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, status: newStatus, updatedAt: now } : m))
      );
      showToast(`Material status changed to ${newStatus}.`);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Material
  const handleDelete = async (mat: StudyMaterial) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${mat.title}"?`);
    if (!confirmDelete) return;

    setDeletingId(mat.id);
    try {
      // Optional Storage Cleanup
      if (storage && mat.fileUrl && mat.fileUrl.includes("firebasestorage")) {
        try {
          const fileRef = ref(storage, mat.fileUrl);
          await deleteObject(fileRef);
        } catch (e) {
          console.warn("Storage deletion skipped or file not found:", e);
        }
      }

      await deleteDoc(doc(db, "studyMaterials", mat.id));
      setMaterials((prev) => prev.filter((m) => m.id !== mat.id));
      showToast("Material deleted successfully.");
    } catch (err) {
      console.error("Error deleting material:", err);
      alert("Failed to delete resource. Please check permissions.");
    } finally {
      setDeletingId(null);
    }
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = materials.length;
    const published = materials.filter((m) => m.status === "published").length;
    const draft = total - published;
    const uniqueCourses = new Set(materials.map((m) => m.courseId)).size;
    return { total, published, draft, uniqueCourses };
  }, [materials]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* TOAST ALERT */}
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
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin Dashboard
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh List
            </button>

            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <span>+ Add Material</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Study Material
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Manage learning resources, PDF notes, assignments, and external video resources for Veezna students.
          </p>
        </div>

        {/* OVERVIEW METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Materials</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{metrics.total}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Published</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics.published}</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">Draft / Unpublished</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.draft}</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">Courses Covered</span>
            <span className="text-2xl font-black text-[#0057B8] mt-1 block">{metrics.uniqueCourses}</span>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search title, subject, module..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

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

            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Resource Types</option>
                <option value="PDF">PDF</option>
                <option value="Notes">Notes</option>
                <option value="Assignment">Assignment</option>
                <option value="Worksheet">Worksheet</option>
                <option value="Practice Paper">Practice Paper</option>
                <option value="Question Paper">Question Paper</option>
                <option value="Video">Video</option>
                <option value="External Link">External Link</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft / Unpublished</option>
              </select>
            </div>
          </div>
        </div>

        {/* MATERIAL LIST DISPLAY */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading study materials...</p>
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
            <h3 className="text-sm font-bold text-slate-700">No study materials found.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click "+ Add Material" to upload notes, assignments, or external video resources for Veezna students.
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
                      <th className="py-3.5 px-4">Material Title</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Subject / Module</th>
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredMaterials.map((mat) => {
                      const isPub = mat.status === "published";
                      const isDeleting = deletingId === mat.id;

                      return (
                        <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block truncate max-w-xs">{mat.title}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{mat.fileName || mat.externalUrl || "Resource Link"}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">{mat.courseName}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-blue-50 text-[#0057B8] font-semibold px-2 py-0.5 rounded text-[10px]">
                              {mat.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {mat.subject} {mat.module ? `• ${mat.module}` : ""}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">{formatDateDisplay(mat.createdAt)}</td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isPub ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {mat.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingMaterial(mat)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditModal(mat)}
                                className="px-2.5 py-1 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-[11px] font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleTogglePublish(mat)}
                                disabled={isSubmitting}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                                  isPub ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {isPub ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                onClick={() => handleDelete(mat)}
                                disabled={isDeleting}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
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
                  <div key={mat.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="bg-blue-50 text-[#0057B8] font-bold px-2 py-0.5 rounded text-[10px] inline-block mb-1">
                          {mat.type}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 leading-snug">{mat.title}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                          isPub ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {mat.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-0.5">
                      <p>Course: <strong className="text-slate-700">{mat.courseName}</strong></p>
                      <p>Subject: <span className="text-slate-700">{mat.subject}</span> {mat.module ? `• ${mat.module}` : ""}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{formatDateDisplay(mat.createdAt)}</span>
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
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

      </div>

      {/* VIEW MATERIAL MODAL */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setViewingMaterial(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="bg-blue-50 text-[#0057B8] font-bold text-xs px-2.5 py-0.5 rounded">
                {viewingMaterial.type}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{viewingMaterial.title}</h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <p><strong className="text-slate-500">Course:</strong> {viewingMaterial.courseName}</p>
              <p><strong className="text-slate-500">Subject:</strong> {viewingMaterial.subject}</p>
              <p><strong className="text-slate-500">Module / Chapter:</strong> {viewingMaterial.module || "—"}</p>
              <p><strong className="text-slate-500">Visibility:</strong> {viewingMaterial.visibility}</p>
              <p><strong className="text-slate-500">Description:</strong> {viewingMaterial.description || "No description provided."}</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {viewingMaterial.fileUrl && (
                <a
                  href={viewingMaterial.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#0057B8] text-white text-xs font-semibold rounded-xl"
                >
                  Download File
                </a>
              )}
              {viewingMaterial.externalUrl && (
                <a
                  href={viewingMaterial.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#F7931E] text-white text-xs font-semibold rounded-xl"
                >
                  Open External Resource
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

      {/* ADD / EDIT MATERIAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
            >
              ✕
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#0057B8]">
                {editingMaterial ? "Edit Study Material" : "Add Study Material"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload learning resources for Veezna enrolled students.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Material Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. JavaScript Functions – Complete Notes"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief summary of learning objectives or topic overview..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Target Course *</label>
                  <select
                    required
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="">Select Course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.courseId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Material Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as StudyMaterial["type"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="PDF">PDF</option>
                    <option value="Notes">Notes</option>
                    <option value="Assignment">Assignment</option>
                    <option value="Worksheet">Worksheet</option>
                    <option value="Practice Paper">Practice Paper</option>
                    <option value="Question Paper">Question Paper</option>
                    <option value="Video">Video</option>
                    <option value="External Link">External Link</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Subject</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Computer Science"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Module / Chapter</label>
                  <input
                    type="text"
                    value={formData.module}
                    onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                    placeholder="e.g. Chapter 3: Functions"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              {/* FILE UPLOAD & EXTERNAL URL OPTION */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Upload File (PDF / Doc / PPT)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                    onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#0057B8]"
                  />
                  {uploadProgress !== null && (
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div className="bg-[#0057B8] h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">OR External Resource / Video URL</label>
                  <input
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or Google Drive Link"
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Visibility</label>
                  <select
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as StudyMaterial["visibility"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="Enrolled Students">Enrolled Students</option>
                    <option value="All Students">All Students</option>
                    <option value="Specific Course">Specific Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudyMaterial["status"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft / Unpublished</option>
                  </select>
                </div>
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
                  {isSubmitting ? "Saving Resource..." : editingMaterial ? "Update Material" : "Save & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}