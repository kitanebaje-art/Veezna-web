"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface CourseOption {
  id: string;
  courseId: string;
  name: string;
}

export interface InstructorOption {
  id: string;
  name: string;
}

export interface BatchItem {
  id: string; // Firestore Document ID
  batchId: string;
  name: string;
  courseId: string;
  courseName: string;
  batchCode: string;
  instructorId?: string;
  instructorName?: string;
  days: string[];
  startTime: string;
  endTime: string;
  room?: string;
  startDate?: string;
  maxStudents: number;
  enrolledStudents: number;
  status: "active" | "inactive" | "completed";
  createdAt: string;
  updatedAt: string;
  rawCreatedAt?: any;
}

export interface BatchFormData {
  name: string;
  batchCode: string;
  courseId: string;
  courseName: string;
  instructorId: string;
  instructorName: string;
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  maxStudents: number;
  status: "active" | "inactive" | "completed";
}

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

// ==========================================
// HELPER FUNCTIONS FOR COMPATIBILITY & SAFETIES
// ==========================================

/**
 * Normalizes mixed date representations (Timestamp, Date string, ISO string, or number)
 * into a safe, displayable string format without breaking on .toDate().
 */
function normalizeDate(val: any): string {
  if (!val) return "N/A";
  try {
    if (typeof val === "object" && typeof val.toDate === "function") {
      return val.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (val instanceof Date) {
      return val.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (typeof val === "string") {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return val;
    }
    if (typeof val === "number") {
      return new Date(val).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    return "N/A";
  }
  return "N/A";
}

/**
 * Robustly parses Firestore documents that may have slightly legacy/varying field names.
 */
function parseBatchDoc(docSnap: any): BatchItem {
  const data = docSnap.data() || {};

  const batchId =
    data.batchId || data.batchID || data.code || `VZ-BATCH-${docSnap.id.substring(0, 5)}`;
  const name = data.name || data.batchName || data.title || "Unnamed Batch";
  const courseId = data.courseId || data.courseID || data.course || "";
  const courseName = data.courseName || data.courseTitle || "Unassigned Course";
  const batchCode = data.batchCode || data.code || batchId;

  const instructorId = data.instructorId || data.teacherId || "";
  const instructorName =
    data.instructorName || data.teacherName || data.instructor || "Unassigned";

  const days = Array.isArray(data.days)
    ? data.days
    : typeof data.days === "string"
    ? data.days.split(",").map((d: string) => d.trim())
    : [];

  const startTime = data.startTime || data.timeStart || "09:00";
  const endTime = data.endTime || data.timeEnd || "10:30";
  const room = data.room || data.classroom || "N/A";

  const maxStudents = Number(data.maxStudents || data.capacity || 20);
  const enrolledStudents = Number(data.enrolledStudents || data.studentCount || 0);

  const status =
    data.status === "inactive" || data.status === "completed"
      ? data.status
      : "active";

  const createdAt = normalizeDate(data.createdAt);
  const updatedAt = normalizeDate(data.updatedAt);

  return {
    id: docSnap.id,
    batchId,
    name,
    courseId,
    courseName,
    batchCode,
    instructorId,
    instructorName,
    days,
    startTime,
    endTime,
    room,
    startDate: data.startDate ? normalizeDate(data.startDate) : undefined,
    maxStudents,
    enrolledStudents,
    status,
    createdAt,
    updatedAt,
    rawCreatedAt: data.createdAt,
  };
}

export default function AdminBatchesPage() {
  // State variables
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [instructors, setInstructors] = useState<InstructorOption[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);

  // Active items for view/edit
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<BatchFormData>({
    name: "",
    batchCode: "",
    courseId: "",
    courseName: "",
    instructorId: "",
    instructorName: "",
    days: ["Monday", "Wednesday", "Friday"],
    startTime: "09:00",
    endTime: "10:30",
    room: "",
    startDate: new Date().toISOString().split("T")[0],
    maxStudents: 20,
    status: "active",
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [studentAssignmentNotice, setStudentAssignmentNotice] = useState<string | null>(null);

  // ==========================================
  // DATA FETCHING
  // ==========================================

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Courses
      try {
        const coursesSnap = await getDocs(collection(db, "courses"));
        const courseList: CourseOption[] = [];
        coursesSnap.forEach((docSnap) => {
          const d = docSnap.data();
          courseList.push({
            id: docSnap.id,
            courseId: d.courseId || docSnap.id,
            name: d.name || d.title || d.courseName || "Untitled Course",
          });
        });
        setCourses(courseList);
      } catch (err: any) {
        console.error("Error loading courses:", err);
      }

      // 2. Fetch Instructors (if collection exists)
      try {
        const instSnap = await getDocs(collection(db, "instructors"));
        const instList: InstructorOption[] = [];
        instSnap.forEach((docSnap) => {
          const d = docSnap.data();
          instList.push({
            id: docSnap.id,
            name: d.name || d.fullName || d.instructorName || "Instructor",
          });
        });
        setInstructors(instList);
      } catch {
        // Instructors collection might not exist yet, ignore
      }

      // 3. Fetch Students to calculate actual enrollment count per batch
      let studentBatchCounts: Record<string, number> = {};
      try {
        const studentSnap = await getDocs(collection(db, "students"));
        studentSnap.forEach((docSnap) => {
          const sd = docSnap.data();
          const bId = sd.batchId || sd.batchID || sd.batch;
          if (bId) {
            studentBatchCounts[bId] = (studentBatchCounts[bId] || 0) + 1;
          }
        });
      } catch {
        // Students collection might not exist yet, ignore
      }

      // 4. Fetch Batches (Client-side sorting fallback for index safety)
      const batchesSnap = await getDocs(collection(db, "batches"));
      const batchList: BatchItem[] = [];

      batchesSnap.forEach((docSnap) => {
        const parsed = parseBatchDoc(docSnap);
        // Calculate enrolled students if match exists in students collection
        if (studentBatchCounts[parsed.batchId] !== undefined) {
          parsed.enrolledStudents = studentBatchCounts[parsed.batchId];
        } else if (studentBatchCounts[parsed.id] !== undefined) {
          parsed.enrolledStudents = studentBatchCounts[parsed.id];
        }
        batchList.push(parsed);
      });

      // Sort client-side by creation/update safely
      batchList.sort((a, b) => {
        if (a.rawCreatedAt?.seconds && b.rawCreatedAt?.seconds) {
          return b.rawCreatedAt.seconds - a.rawCreatedAt.seconds;
        }
        return b.id.localeCompare(a.id);
      });

      setBatches(batchList);
    } catch (err: any) {
      console.error("Firebase Error in Batches Page:", err);
      setError(
        err?.message ||
          "Failed to load batches. Please check your Firebase connection or security permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // ==========================================
  // HANDLERS FOR CREATION & EDITS
  // ==========================================

  const handleOpenCreate = () => {
    setFormError(null);
    setFormData({
      name: "",
      batchCode: "",
      courseId: courses[0]?.courseId || "",
      courseName: courses[0]?.name || "",
      instructorId: "",
      instructorName: "",
      days: ["Monday", "Wednesday", "Friday"],
      startTime: "17:00",
      endTime: "18:30",
      room: "Room 01",
      startDate: new Date().toISOString().split("T")[0],
      maxStudents: 20,
      status: "active",
    });
    setIsCreateModalOpen(true);
  };

  const handleCourseSelect = (courseIdValue: string) => {
    const selected = courses.find((c) => c.courseId === courseIdValue || c.id === courseIdValue);
    setFormData((prev) => ({
      ...prev,
      courseId: selected ? selected.courseId : courseIdValue,
      courseName: selected ? selected.name : "",
    }));
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const exists = prev.days.includes(day);
      if (exists) {
        return { ...prev, days: prev.days.filter((d) => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };

  const generateBatchId = (): string => {
    const timestamp = Date.now().toString().slice(-4);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `VZ-BATCH-${timestamp}${random}`;
  };

  const generateBatchCodeFallback = (courseName: string): string => {
    const prefix = courseName
      ? courseName
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 3)
      : "VZ";
    const num = Math.floor(10 + Math.random() * 90);
    return `${prefix}-${num}-A`;
  };

  const handleSaveNewBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Batch Name is required.");
      return;
    }
    if (!formData.courseId) {
      setFormError("Please select a valid Course.");
      return;
    }
    if (formData.days.length === 0) {
      setFormError("Please select at least one class day.");
      return;
    }

    setFormSubmitting(true);

    try {
      const finalBatchId = generateBatchId();
      const finalBatchCode =
        formData.batchCode.trim() ||
        generateBatchCodeFallback(formData.courseName);

      const payload = {
        batchId: finalBatchId,
        name: formData.name.trim(),
        courseId: formData.courseId,
        courseName: formData.courseName,
        batchCode: finalBatchCode,
        instructorId: formData.instructorId || "",
        instructorName: formData.instructorName || "Unassigned",
        days: formData.days,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room || "Room 01",
        startDate: formData.startDate,
        maxStudents: Number(formData.maxStudents) || 20,
        enrolledStudents: 0,
        status: formData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "batches"), payload);
      setIsCreateModalOpen(false);
      await fetchAllData();
    } catch (err: any) {
      console.error("Error creating batch:", err);
      setFormError("Failed to create batch: " + (err.message || "Unknown error"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOpenEdit = (batch: BatchItem) => {
    setSelectedBatch(batch);
    setFormError(null);
    setFormData({
      name: batch.name,
      batchCode: batch.batchCode,
      courseId: batch.courseId,
      courseName: batch.courseName,
      instructorId: batch.instructorId || "",
      instructorName: batch.instructorName || "",
      days: batch.days,
      startTime: batch.startTime,
      endTime: batch.endTime,
      room: batch.room || "",
      startDate: batch.startDate || new Date().toISOString().split("T")[0],
      maxStudents: batch.maxStudents,
      status: batch.status,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) return;

    setFormError(null);
    if (!formData.name.trim()) {
      setFormError("Batch Name is required.");
      return;
    }

    setFormSubmitting(true);

    try {
      const docRef = doc(db, "batches", selectedBatch.id);
      const payload = {
        name: formData.name.trim(),
        batchCode: formData.batchCode.trim() || selectedBatch.batchCode,
        courseId: formData.courseId,
        courseName: formData.courseName,
        instructorId: formData.instructorId || "",
        instructorName: formData.instructorName || "Unassigned",
        days: formData.days,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room || "N/A",
        startDate: formData.startDate,
        maxStudents: Number(formData.maxStudents) || 20,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, payload);
      setIsEditModalOpen(false);
      setSelectedBatch(null);
      await fetchAllData();
    } catch (err: any) {
      console.error("Error updating batch:", err);
      setFormError("Failed to update batch: " + (err.message || "Unknown error"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (batch: BatchItem) => {
    const newStatus = batch.status === "active" ? "inactive" : "active";
    try {
      const docRef = doc(db, "batches", batch.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      await fetchAllData();
    } catch (err: any) {
      alert("Error toggling status: " + err.message);
    }
  };

  const handleDeleteBatch = async (batch: BatchItem) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${batch.name}"?\n\nWARNING: Deleting a batch may affect student assignments and attendance records.`
    );
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "batches", batch.id));
      await fetchAllData();
    } catch (err: any) {
      alert("Error deleting batch: " + err.message);
    }
  };

  // ==========================================
  // SEARCH & FILTERED LIST
  // ==========================================

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      // Course Filter
      if (selectedCourseFilter !== "ALL" && b.courseId !== selectedCourseFilter) {
        return false;
      }
      // Status Filter
      if (selectedStatusFilter !== "ALL" && b.status !== selectedStatusFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = b.name.toLowerCase().includes(term);
        const matchCode = b.batchCode.toLowerCase().includes(term);
        const matchCourse = b.courseName.toLowerCase().includes(term);
        const matchInstructor = (b.instructorName || "").toLowerCase().includes(term);
        return matchName || matchCode || matchCourse || matchInstructor;
      }
      return true;
    });
  }, [batches, selectedCourseFilter, selectedStatusFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      {/* HEADER & NAVIGATION BAR */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link
                href="/admin"
                className="hover:text-[#0057B8] transition-colors font-medium"
              >
                ← Back to Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Batches</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Batch Management
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Organize courses into scheduled batches, assign instructors, and track enrollments.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center justify-center bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/10 transition-all cursor-pointer"
          >
            <span className="mr-2 text-xl font-bold line-none">+</span> Add New Batch
          </button>
        </div>

        {/* TOP SYSTEM MODULE LINKS */}
        <nav className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/students"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Students
          </Link>
          <Link
            href="/admin/admissions"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Admissions
          </Link>

          <Link
            href="/admin/courses"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Courses
          </Link>
          <Link
            href="/admin/batches"
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold shadow-sm"
          >
            Batches
          </Link>
          <Link
            href="/admin/attendance"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Attendance
          </Link>
          <Link
            href="/admin/fees"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Fees &amp; Payments
          </Link>
        </nav>
      </header>

      {/* FILTER & SEARCH CONTROL BAR */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by batch name, code, course, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 placeholder-slate-400"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-3 text-slate-400"
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

          {/* Filter Course */}
          <div>
            <select
              value={selectedCourseFilter}
              onChange={(e) => setSelectedCourseFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.courseId}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status & Refresh */}
          <div className="flex gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="completed">Completed</option>
            </select>

            <button
              onClick={fetchAllData}
              title="Refresh Data"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchAllData}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Connecting to Firestore &amp; Loading Batches...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            📚
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Batches Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {searchTerm || selectedCourseFilter !== "ALL" || selectedStatusFilter !== "ALL"
              ? "No batches match your current search and filter selections."
              : "No class batches have been created yet. Click 'Add New Batch' to create your first batch."}
          </p>
          {searchTerm || selectedCourseFilter !== "ALL" || selectedStatusFilter !== "ALL" ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCourseFilter("ALL");
                setSelectedStatusFilter("ALL");
              }}
              className="text-xs font-semibold text-[#0057B8] underline"
            >
              Reset Filters
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="bg-[#0057B8] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#004494]"
            >
              + Create First Batch
            </button>
          )}
        </div>
      ) : (
        /* GRID OF BATCH CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const isFull = batch.enrolledStudents >= batch.maxStudents;
            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 mb-1">
                        {batch.batchCode}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 leading-tight">
                        {batch.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                        batch.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : batch.status === "completed"
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-[#0057B8]">
                    Course: <span className="text-slate-800 font-semibold">{batch.courseName}</span>
                  </p>
                </div>

                {/* Card Body Info */}
                <div className="p-5 space-y-3 text-xs text-slate-600 flex-grow">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">📅</span>
                    <span className="font-semibold text-slate-700">
                      {batch.days && batch.days.length > 0 ? batch.days.join(" • ") : "No days set"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">🕒</span>
                    <span>
                      {batch.startTime} - {batch.endTime}
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 mt-2">
                    <div>
                      <span className="text-slate-400 block text-[10px]">INSTRUCTOR</span>
                      <span className="font-semibold text-slate-800">
                        {batch.instructorName || "Unassigned"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">ROOM</span>
                      <span className="font-semibold text-slate-800">{batch.room || "N/A"}</span>
                    </div>
                  </div>

                  {/* Enrollment Progress */}
                  <div className="pt-2">
                    <div className="flex justify-between items-center text-xs font-medium mb-1">
                      <span className="text-slate-500">Students Enrolled</span>
                      <span className={`font-bold ${isFull ? "text-amber-600" : "text-slate-800"}`}>
                        {batch.enrolledStudents} / {batch.maxStudents}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isFull ? "bg-amber-500" : "bg-[#0057B8]"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            (batch.enrolledStudents / (batch.maxStudents || 1)) * 100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="bg-slate-50 p-3 px-5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedBatch(batch);
                        setStudentAssignmentNotice(null);
                        setIsViewModalOpen(true);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-lg transition"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleOpenEdit(batch)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#0057B8] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition"
                    >
                      Edit
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(batch)}
                      className={`px-2.5 py-1.5 text-[11px] font-medium rounded-lg border transition ${
                        batch.status === "active"
                          ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {batch.status === "active" ? "Deactivate" : "Activate"}
                    </button>

                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      title="Delete Batch"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 1: CREATE BATCH                      */}
      {/* ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Create New Class Batch</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveNewBatch} className="space-y-4 text-xs">
              {/* Batch Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Class 9 - Morning A"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batch Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VLS-9-A"
                    value={formData.batchCode}
                    onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>
              </div>

              {/* Course Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Course <span className="text-red-500">*</span>
                </label>
                {courses.length === 0 ? (
                  <p className="text-amber-600 text-[11px]">
                    No courses found in Firestore collection 'courses'. Please add courses first.
                  </p>
                ) : (
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleCourseSelect(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.courseId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Instructor */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Instructor / Teacher
                </label>
                {instructors.length > 0 ? (
                  <select
                    value={formData.instructorName}
                    onChange={(e) => {
                      const selectedInst = instructors.find((i) => i.name === e.target.value);
                      setFormData({
                        ...formData,
                        instructorName: e.target.value,
                        instructorId: selectedInst ? selectedInst.id : "",
                      });
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="">Select Instructor...</option>
                    {instructors.map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter instructor name"
                    value={formData.instructorName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        instructorName: e.target.value,
                        instructorId: "",
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                )}
              </div>

              {/* Weekly Schedule Days */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Class Days <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = formData.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition ${
                          isSelected
                            ? "bg-[#0057B8] text-white border-[#0057B8]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Timings & Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room / Venue</label>
                  <input
                    type="text"
                    placeholder="Room 02"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
              </div>

              {/* Start Date & Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Students</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStudents: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive" | "completed",
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494] shadow-md transition disabled:opacity-50"
                >
                  {formSubmitting ? "Saving..." : "Create Batch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: EDIT BATCH                        */}
      {/* ========================================== */}
      {isEditModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">
                Edit Batch: <span className="text-[#0057B8]">{selectedBatch.batchCode}</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Code</label>
                  <input
                    type="text"
                    value={formData.batchCode}
                    onChange={(e) => setFormData({ ...formData, batchCode: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => handleCourseSelect(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.courseId}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructor</label>
                <input
                  type="text"
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Class Days</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = formData.days.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-lg border font-medium text-xs transition ${
                          isSelected
                            ? "bg-[#0057B8] text-white border-[#0057B8]"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxStudents}
                    onChange={(e) =>
                      setFormData({ ...formData, maxStudents: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "active" | "inactive" | "completed",
                      })
                    }
                    className="w-full p-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494] shadow-md transition disabled:opacity-50"
                >
                  {formSubmitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 3: VIEW BATCH DETAILS                */}
      {/* ========================================== */}
      {isViewModalOpen && selectedBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0057B8]">
                  {selectedBatch.batchCode}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedBatch.name}</h2>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Batch ID</p>
                  <p className="font-mono font-semibold text-slate-800">{selectedBatch.batchId}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Status</p>
                  <p className="capitalize font-semibold text-emerald-700">{selectedBatch.status}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Course</p>
                <p className="font-semibold text-slate-900">{selectedBatch.courseName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Instructor</p>
                  <p className="font-medium">{selectedBatch.instructorName || "Unassigned"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Room</p>
                  <p className="font-medium">{selectedBatch.room || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Schedule</p>
                <p className="font-medium">
                  {selectedBatch.days?.join(", ")} | {selectedBatch.startTime} - {selectedBatch.endTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Start Date</p>
                  <p className="font-medium">{selectedBatch.startDate || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase font-bold">Enrollment Capacity</p>
                  <p className="font-medium">
                    {selectedBatch.enrolledStudents} / {selectedBatch.maxStudents} Students
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <p>Created: {selectedBatch.createdAt}</p>
                <p>Updated: {selectedBatch.updatedAt}</p>
              </div>

              {studentAssignmentNotice && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs">
                  {studentAssignmentNotice}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudentAssignmentNotice(
                    "Student assignment module is active! Assign batch IDs inside your Students collection."
                  );
                }}
                className="px-4 py-2 bg-[#0057B8] hover:bg-[#004494] text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                View Students
              </button>

              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}