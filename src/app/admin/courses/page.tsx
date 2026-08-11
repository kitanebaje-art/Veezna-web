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
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Course {
  id: string; // Firestore document ID
  courseId: string;
  name: string;
  code: string;
  category: string;
  description: string;
  duration: string;
  tuitionFee: number;
  registrationFee: number;
  totalSeats: number;
  availableSeats: number;
  startDate: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals & Active Selections
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "Academic",
    description: "",
    duration: "",
    tuitionFee: "",
    registrationFee: "",
    totalSeats: "",
    availableSeats: "",
    startDate: "",
    status: "active" as "active" | "inactive",
  });

  // Fetch Courses from Firestore
  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const coursesRef = collection(db, "courses");
      let snapshot;
      try {
        const q = query(coursesRef, orderBy("createdAt", "desc"));
        snapshot = await getDocs(q);
      } catch (err) {
        // Fallback if index for orderBy is missing
        snapshot = await getDocs(coursesRef);
      }

      const courseList: Course[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          courseId: data.courseId || docSnap.id,
          name: data.name || data.title || "",
          code: data.code || "",
          category: data.category || "Academic",
          description: data.description || "",
          duration: data.duration || "",
          tuitionFee: parseNumber(data.tuitionFee ?? data.fee),
          registrationFee: parseNumber(data.registrationFee),
          totalSeats: parseNumber(data.totalSeats ?? data.seats),
          availableSeats: parseNumber(data.availableSeats),
          startDate: parseDateString(data.startDate),
          status: (data.status || "active").toLowerCase() === "inactive" ? "inactive" : "active",
          createdAt: parseDateString(data.createdAt),
          updatedAt: parseDateString(data.updatedAt),
        };
      });

      // Sort client-side safely
      courseList.sort((a, b) => {
        const tA = new Date(a.createdAt).getTime() || 0;
        const tB = new Date(b.createdAt).getTime() || 0;
        return tB - tA;
      });

      setCourses(courseList);
    } catch (err: unknown) {
      console.error("Error fetching courses:", err);
      setError("Unable to load courses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Safe Parsing Helpers
  function parseNumber(val: unknown): number {
    if (val === undefined || val === null || val === "") return 0;
    const num = Number(val);
    return isNaN(num) ? 0 : num;
  }

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

  function formatCurrency(num: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  }

  function formatDateDisplay(isoStr: string): string {
    if (!isoStr) return "—";
    const dt = new Date(isoStr);
    if (isNaN(dt.getTime())) return "—";
    return dt.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Filtered Courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const sTerm = searchTerm.toLowerCase().trim();
      const nameMatch = c.name.toLowerCase().includes(sTerm);
      const codeMatch = c.code.toLowerCase().includes(sTerm);
      const categoryMatch = categoryFilter === "All" || c.category === categoryFilter;
      const statusMatch = statusFilter === "All" || c.status === statusFilter.toLowerCase();

      return (nameMatch || codeMatch) && categoryMatch && statusMatch;
    });
  }, [courses, searchTerm, categoryFilter, statusFilter]);

  // Modal Controls
  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      category: "Academic",
      description: "",
      duration: "",
      tuitionFee: "",
      registrationFee: "",
      totalSeats: "",
      availableSeats: "",
      startDate: "",
      status: "active",
    });
  };

  const openAddModal = () => {
    resetForm();
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      category: course.category || "Academic",
      description: course.description,
      duration: course.duration,
      tuitionFee: course.tuitionFee ? String(course.tuitionFee) : "",
      registrationFee: course.registrationFee ? String(course.registrationFee) : "",
      totalSeats: course.totalSeats ? String(course.totalSeats) : "",
      availableSeats: course.availableSeats ? String(course.availableSeats) : "",
      startDate: course.startDate ? course.startDate.split("T")[0] : "",
      status: course.status,
    });
    setIsModalOpen(true);
  };

  // Submit Handler for Add / Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a valid Course Name.");
      return;
    }

    const tuitionFeeNum = parseNumber(formData.tuitionFee);
    const regFeeNum = parseNumber(formData.registrationFee);
    const totalSeatsNum = parseNumber(formData.totalSeats);
    const availSeatsNum = parseNumber(formData.availableSeats);

    if (tuitionFeeNum < 0 || regFeeNum < 0 || totalSeatsNum < 0 || availSeatsNum < 0) {
      alert("Fees and seats cannot be negative values.");
      return;
    }

    if (availSeatsNum > totalSeatsNum) {
      alert("Available seats cannot exceed Total seats.");
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      if (editingCourse) {
        // Update Course
        const docRef = doc(db, "courses", editingCourse.id);
        const updatePayload = {
          name: formData.name.trim(),
          code: formData.code.trim(),
          category: formData.category,
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          tuitionFee: tuitionFeeNum,
          registrationFee: regFeeNum,
          totalSeats: totalSeatsNum,
          availableSeats: availSeatsNum,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : "",
          status: formData.status,
          updatedAt: now,
        };

        await updateDoc(docRef, updatePayload);

        setCourses((prev) =>
          prev.map((c) => (c.id === editingCourse.id ? { ...c, ...updatePayload } : c))
        );

        if (viewingCourse?.id === editingCourse.id) {
          setViewingCourse((prev) => (prev ? { ...prev, ...updatePayload } : null));
        }

        showToast("Course updated successfully.");
      } else {
        // Create Course
        const autoCourseId = `VZ-COURSE-${Math.floor(1000 + Math.random() * 9000)}`;

        const newCoursePayload = {
          courseId: autoCourseId,
          name: formData.name.trim(),
          code: formData.code.trim() || autoCourseId,
          category: formData.category,
          description: formData.description.trim(),
          duration: formData.duration.trim(),
          tuitionFee: tuitionFeeNum,
          registrationFee: regFeeNum,
          totalSeats: totalSeatsNum,
          availableSeats: availSeatsNum,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : "",
          status: formData.status,
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await addDoc(collection(db, "courses"), newCoursePayload);

        setCourses((prev) => [{ id: docRef.id, ...newCoursePayload }, ...prev]);
        showToast("Course added successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      console.error("Error saving course:", err);
      alert("Failed to save course. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Activate / Deactivate
  const handleToggleStatus = async (course: Course) => {
    const newStatus: "active" | "inactive" = course.status === "active" ? "inactive" : "active";
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const docRef = doc(db, "courses", course.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: now,
      });

      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, status: newStatus, updatedAt: now } : c))
      );

      if (viewingCourse?.id === course.id) {
        setViewingCourse((prev) => (prev ? { ...prev, status: newStatus, updatedAt: now } : null));
      }

      showToast(`Course status changed to ${newStatus}.`);
    } catch (err: unknown) {
      console.error("Error toggling course status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (course: Course) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${course.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    setDeletingId(course.id);
    try {
      await deleteDoc(doc(db, "courses", course.id));
      setCourses((prev) => prev.filter((c) => c.id !== course.id));

      if (viewingCourse?.id === course.id) {
        setViewingCourse(null);
      }

      showToast("Course deleted successfully.");
    } catch (err: unknown) {
      console.error("Error deleting course:", err);
      alert("Failed to delete course. Please check permissions.");
    } finally {
      setDeletingId(null);
    }
  };

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

        {/* TOP NAVIGATION & ADMIN BREADCRUMB */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link href="/admin/students" className="hover:text-slate-600">Students</Link>
              <span>•</span>
              <Link href="/admin/admissions" className="hover:text-slate-600">Admissions</Link>
              <span>•</span>
              <Link href="/admin/fees" className="hover:text-slate-600">Fees</Link>
              <span>•</span>
              <Link href="/admin/attendance" className="hover:text-slate-600">Attendance</Link>
              <span>•</span>
              <Link href="/admin/batches" className="hover:text-slate-600">Batches</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchCourses}
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
              <span>+ Add Course</span>
            </button>
          </div>
        </div>

        {/* PAGE HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Create and manage Veezna programs, fees, duration and availability.
          </p>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by course name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Categories</option>
                <option value="Academic">Academic</option>
                <option value="Professional">Professional</option>
                <option value="Language">Language</option>
                <option value="Technology">Technology</option>
                <option value="Wellness">Wellness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* COURSE CARDS DISPLAY */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading courses...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-200 shadow-sm text-rose-700 space-y-3">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">No courses found.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No matching courses available. Click "+ Add Course" to create a new program.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => {
              const isActive = course.status === "active";
              const isDeleting = deletingId === course.id;
              const totalFeeCalculated = course.tuitionFee + course.registrationFee;

              return (
                <div
                  key={course.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold rounded-lg truncate">
                        {course.code || course.courseId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-800 leading-snug">
                        {course.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 font-light">
                        {course.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="bg-blue-50 text-[#0057B8] font-semibold px-2.5 py-0.5 rounded-md">
                        {course.category}
                      </span>
                      {course.duration && (
                        <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-0.5 rounded-md">
                          ⏱ {course.duration}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Total Fee</span>
                        <span className="text-slate-800 font-extrabold text-sm">{formatCurrency(totalFeeCalculated)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] font-bold uppercase">Available Seats</span>
                        <span className="text-slate-700 font-bold text-sm">
                          {course.availableSeats} / {course.totalSeats}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setViewingCourse(course)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      View
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(course)}
                        className="px-3 py-1.5 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-xl text-xs font-semibold transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleStatus(course)}
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {isActive ? "Deactivate" : "Activate"}
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(course)}
                        disabled={isDeleting}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                        title="Delete Course"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW COURSE MODAL */}
      {viewingCourse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setViewingCourse(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="px-3 py-1 bg-[#0057B8]/10 text-[#0057B8] font-mono text-xs font-bold rounded-lg">
                Code: {viewingCourse.code || viewingCourse.courseId}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">
                {viewingCourse.name}
              </h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-[#0057B8] text-sm border-b border-slate-200/80 pb-1">
                Description
              </h3>
              <p className="text-slate-600 font-light leading-relaxed">
                {viewingCourse.description || "No description provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Details</span>
                <p><strong className="text-slate-600">Category:</strong> {viewingCourse.category}</p>
                <p><strong className="text-slate-600">Duration:</strong> {viewingCourse.duration || "—"}</p>
                <p><strong className="text-slate-600">Status:</strong> <span className="capitalize font-semibold">{viewingCourse.status}</span></p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Seats & Dates</span>
                <p><strong className="text-slate-600">Total Seats:</strong> {viewingCourse.totalSeats}</p>
                <p><strong className="text-slate-600">Available:</strong> {viewingCourse.availableSeats}</p>
                <p><strong className="text-slate-600">Start Date:</strong> {formatDateDisplay(viewingCourse.startDate)}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-[#0057B8] text-sm border-b border-slate-200/80 pb-1">
                Fee Breakdown
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Tuition Fee</span>
                  <span className="font-bold text-slate-800 text-xs">{formatCurrency(viewingCourse.tuitionFee)}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <span className="block text-[9px] text-slate-400 font-bold uppercase">Registration</span>
                  <span className="font-bold text-slate-800 text-xs">{formatCurrency(viewingCourse.registrationFee)}</span>
                </div>
                <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                  <span className="block text-[9px] text-[#0057B8] font-bold uppercase">Total Fee</span>
                  <span className="font-bold text-[#0057B8] text-xs">
                    {formatCurrency(viewingCourse.tuitionFee + viewingCourse.registrationFee)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 p-3 rounded-2xl text-[11px] text-slate-500 space-y-0.5">
              <p><strong>Created Date:</strong> {formatDateDisplay(viewingCourse.createdAt)}</p>
              <p><strong>Last Updated:</strong> {formatDateDisplay(viewingCourse.updatedAt)}</p>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setViewingCourse(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COURSE MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#0057B8]">
                {editingCourse ? "Edit Course" : "Add New Course"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingCourse ? "Update course details and fee structures." : "Create a new course offering for Veezna students."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-600 font-semibold mb-1">Course Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Veezna Vox"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-slate-600 font-semibold mb-1">Course Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. VOX-101"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Program overview and objectives..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Professional">Professional</option>
                    <option value="Language">Language</option>
                    <option value="Technology">Technology</option>
                    <option value="Wellness">Wellness</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Duration</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g. 6 Months"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tuition Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.tuitionFee}
                    onChange={(e) => setFormData({ ...formData, tuitionFee: e.target.value })}
                    placeholder="e.g. 25000"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Registration Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.registrationFee}
                    onChange={(e) => setFormData({ ...formData, registrationFee: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Total Calculated Fee:</span>
                <span className="font-extrabold text-[#0057B8] text-sm">
                  {formatCurrency(parseNumber(formData.tuitionFee) + parseNumber(formData.registrationFee))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Seats</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalSeats}
                    onChange={(e) => setFormData({ ...formData, totalSeats: e.target.value })}
                    placeholder="e.g. 60"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Available Seats</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.availableSeats}
                    onChange={(e) => setFormData({ ...formData, availableSeats: e.target.value })}
                    placeholder="e.g. 45"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingCourse ? "Update Course" : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}