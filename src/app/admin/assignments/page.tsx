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

export interface Assignment {
  id: string;
  assignmentId: string;
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  courseName: string;
  subject: string;
  module: string;
  type: "Homework" | "Practice" | "Project" | "Worksheet" | "Test" | "Practical" | "Other";
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  dueDate: string;
  attachmentUrl?: string;
  attachmentName?: string;
  externalUrl?: string;
  submissionType: "File Upload" | "Text Answer" | "Link" | "File + Text";
  status: "published" | "draft";
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<CourseRef[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [courseFilter, setCourseFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dueFilter, setDueFilter] = useState<string>("All");

  // Modals & Active Selections
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);

  // Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    courseId: "",
    courseName: "",
    subject: "",
    module: "",
    type: "Homework" as Assignment["type"],
    totalMarks: "100",
    passingMarks: "40",
    startDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    externalUrl: "",
    submissionType: "File + Text" as Assignment["submissionType"],
    status: "published" as Assignment["status"],
  });

  // Fetch Courses, Assignments, and Submissions counts
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Courses
      const courseSnap = await getDocs(collection(db, "courses"));
      const courseList: CourseRef[] = courseSnap.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          courseId: d.courseId || dSnap.id,
          name: d.name || d.title || "Untitled Course",
        };
      });
      setCourses(courseList);

      // 2. Fetch Assignments
      const assignSnap = await getDocs(collection(db, "assignments"));
      const assignList: Assignment[] = assignSnap.docs.map((dSnap) => {
        const d = dSnap.data();
        return {
          id: dSnap.id,
          assignmentId: d.assignmentId || dSnap.id,
          title: d.title || "Untitled Assignment",
          description: d.description || "",
          instructions: d.instructions || "",
          courseId: d.courseId || "",
          courseName: d.courseName || "General",
          subject: d.subject || "General",
          module: d.module || "General",
          type: d.type || "Homework",
          totalMarks: Number(d.totalMarks) || 100,
          passingMarks: Number(d.passingMarks) || 40,
          startDate: parseDateString(d.startDate),
          dueDate: parseDateString(d.dueDate),
          attachmentUrl: d.attachmentUrl || "",
          attachmentName: d.attachmentName || "",
          externalUrl: d.externalUrl || "",
          submissionType: d.submissionType || "File + Text",
          status: d.status || "published",
          createdBy: d.createdBy || "admin",
          createdByName: d.createdByName || "Veezna Admin",
          createdAt: parseDateString(d.createdAt),
          updatedAt: parseDateString(d.updatedAt),
          publishedAt: d.publishedAt ? parseDateString(d.publishedAt) : undefined,
        };
      });

      assignList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAssignments(assignList);

      // 3. Fetch Submission Counts for metrics
      const subSnap = await getDocs(collection(db, "assignmentSubmissions"));
      const counts: Record<string, number> = {};
      subSnap.docs.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.assignmentId) {
          counts[d.assignmentId] = (counts[d.assignmentId] || 0) + 1;
        }
      });
      setSubmissionCounts(counts);

    } catch (err) {
      console.error("Error fetching assignments data:", err);
      setError("Unable to load assignments. Please check network connection and permissions.");
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

  function getDueStatus(dueDateIso: string): "Upcoming" | "Due Soon" | "Overdue" {
    if (!dueDateIso) return "Upcoming";
    const dueTime = new Date(dueDateIso).getTime();
    const now = Date.now();
    const twoDaysMs = 48 * 60 * 60 * 1000;

    if (dueTime < now) return "Overdue";
    if (dueTime - now <= twoDaysMs) return "Due Soon";
    return "Upcoming";
  }

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const sTerm = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !sTerm ||
        a.title.toLowerCase().includes(sTerm) ||
        a.assignmentId.toLowerCase().includes(sTerm) ||
        a.subject.toLowerCase().includes(sTerm) ||
        a.courseName.toLowerCase().includes(sTerm);

      const matchesCourse = courseFilter === "All" || a.courseId === courseFilter;
      const matchesStatus = statusFilter === "All" || a.status === statusFilter.toLowerCase();
      
      const dueStat = getDueStatus(a.dueDate);
      const matchesDue = dueFilter === "All" || dueStat === dueFilter;

      return matchesSearch && matchesCourse && matchesStatus && matchesDue;
    });
  }, [assignments, searchTerm, courseFilter, statusFilter, dueFilter]);

  // Form Reset & Open Modals
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      instructions: "",
      courseId: courses.length > 0 ? courses[0].courseId : "",
      courseName: courses.length > 0 ? courses[0].name : "",
      subject: "",
      module: "",
      type: "Homework",
      totalMarks: "100",
      passingMarks: "40",
      startDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      externalUrl: "",
      submissionType: "File + Text",
      status: "published",
    });
    setSelectedFile(null);
    setUploadProgress(null);
  };

  const openAddModal = () => {
    resetForm();
    setEditingAssignment(null);
    setIsModalOpen(true);
  };

  const openEditModal = (a: Assignment) => {
    setEditingAssignment(a);
    setFormData({
      title: a.title,
      description: a.description,
      instructions: a.instructions,
      courseId: a.courseId,
      courseName: a.courseName,
      subject: a.subject,
      module: a.module,
      type: a.type,
      totalMarks: String(a.totalMarks),
      passingMarks: String(a.passingMarks),
      startDate: a.startDate ? a.startDate.split("T")[0] : "",
      dueDate: a.dueDate ? a.dueDate.split("T")[0] : "",
      externalUrl: a.externalUrl || "",
      submissionType: a.submissionType,
      status: a.status,
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
      alert("Please enter an Assignment Title.");
      return;
    }
    if (!formData.courseId) {
      alert("Please select a Course.");
      return;
    }
    if (!formData.dueDate) {
      alert("Please select a Due Date.");
      return;
    }

    const tMarks = Number(formData.totalMarks) || 0;
    const pMarks = Number(formData.passingMarks) || 0;

    if (tMarks <= 0) {
      alert("Total Marks must be greater than 0.");
      return;
    }
    if (pMarks > tMarks) {
      alert("Passing Marks cannot be greater than Total Marks.");
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    try {
      let attachmentUrl = editingAssignment?.attachmentUrl || "";
      let attachmentName = editingAssignment?.attachmentName || "";

      // File Upload Handler
      if (selectedFile) {
        if (selectedFile.size > 25 * 1024 * 1024) {
          alert("File size exceeds 25MB limit. Please compress or provide an External Link.");
          setIsSubmitting(false);
          return;
        }

        if (storage) {
          const fileRef = ref(
            storage,
            `assignment-files/${formData.courseId}/${Date.now()}_${selectedFile.name}`
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
                attachmentUrl = await getDownloadURL(uploadTask.snapshot.ref);
                attachmentName = selectedFile.name;
                resolve();
              }
            );
          });
        }
      }

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
        courseId: formData.courseId,
        courseName: formData.courseName,
        subject: formData.subject.trim() || "General",
        module: formData.module.trim() || "General",
        type: formData.type,
        totalMarks: tMarks,
        passingMarks: pMarks,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : now,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : now,
        attachmentUrl,
        attachmentName,
        externalUrl: formData.externalUrl.trim(),
        submissionType: formData.submissionType,
        status: formData.status,
        updatedAt: now,
      };

      if (editingAssignment) {
        const docRef = doc(db, "assignments", editingAssignment.id);
        await updateDoc(docRef, payload);

        setAssignments((prev) =>
          prev.map((a) => (a.id === editingAssignment.id ? { ...a, ...payload } : a))
        );
        showToast("Assignment updated successfully.");
      } else {
        const autoId = `ASN-${Math.floor(1000 + Math.random() * 9000)}`;
        const createPayload = {
          ...payload,
          assignmentId: autoId,
          createdBy: "admin",
          createdByName: "Veezna Admin",
          createdAt: now,
          publishedAt: formData.status === "published" ? now : "",
        };

        const docRef = await addDoc(collection(db, "assignments"), createPayload);
        setAssignments((prev) => [{ id: docRef.id, ...createPayload }, ...prev]);

        // Push System Notification for new assignment
        if (formData.status === "published") {
          try {
            await addDoc(collection(db, "notifications"), {
              title: `New Assignment Published: ${formData.title.trim()}`,
              message: `A new assignment (${formData.type}) has been published for ${formData.courseName}. Due date: ${formatDateDisplay(formData.dueDate)}.`,
              courseId: formData.courseId,
              type: "Assignment",
              createdAt: now,
            });
          } catch (e) {
            console.warn("Notification trigger warning:", e);
          }
        }

        showToast("Assignment created successfully.");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert("Failed to save assignment. Please check permissions and try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  // Toggle Publish Status
  const handleTogglePublish = async (a: Assignment) => {
    const newStatus = a.status === "published" ? "draft" : "published";
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const docRef = doc(db, "assignments", a.id);
      await updateDoc(docRef, {
        status: newStatus,
        publishedAt: newStatus === "published" ? now : a.publishedAt || "",
        updatedAt: now,
      });

      setAssignments((prev) =>
        prev.map((item) => (item.id === a.id ? { ...item, status: newStatus, updatedAt: now } : item))
      );
      showToast(`Assignment status changed to ${newStatus}.`);
    } catch (err) {
      console.error("Error toggling publish status:", err);
      alert("Failed to update publish status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Assignment
  const handleDelete = async (a: Assignment) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${a.title}"?`);
    if (!confirmDelete) return;

    setDeletingId(a.id);
    try {
      if (storage && a.attachmentUrl && a.attachmentUrl.includes("firebasestorage")) {
        try {
          const fileRef = ref(storage, a.attachmentUrl);
          await deleteObject(fileRef);
        } catch (e) {
          console.warn("Storage deletion warning:", e);
        }
      }

      await deleteDoc(doc(db, "assignments", a.id));
      setAssignments((prev) => prev.filter((item) => item.id !== a.id));
      showToast("Assignment deleted successfully.");
    } catch (err) {
      console.error("Error deleting assignment:", err);
      alert("Failed to delete assignment. Check permissions.");
    } finally {
      setDeletingId(null);
    }
  };

  // Metrics
  const metrics = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status === "published").length;
    const draft = total - published;
    let totalSubmissions = 0;

    Object.values(submissionCounts).forEach((cnt) => {
      totalSubmissions += cnt;
    });

    return { total, published, draft, totalSubmissions };
  }, [assignments, submissionCounts]);

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
              <span>+ Create Assignment</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Assignments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Create, publish, manage and evaluate course assignments for Veezna students.
          </p>
        </div>

        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Assignments</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{metrics.total}</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">Published</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{metrics.published}</span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">Draft</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{metrics.draft}</span>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">Total Submissions</span>
            <span className="text-2xl font-black text-[#0057B8] mt-1 block">{metrics.totalSubmissions}</span>
          </div>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search title, ID, subject..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div>
              <select
                value={dueFilter}
                onChange={(e) => setDueFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Due States</option>
                <option value="Upcoming">Upcoming</option>
                <option value="Due Soon">Due Soon</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* ASSIGNMENT LIST */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading assignments...</p>
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
        ) : filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              📝
            </div>
            <h3 className="text-sm font-bold text-slate-700">No assignments found.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Click "+ Create Assignment" to set homework, worksheets, or practice tests.
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
                      <th className="py-3.5 px-4">Assignment</th>
                      <th className="py-3.5 px-4">Course</th>
                      <th className="py-3.5 px-4">Subject / Type</th>
                      <th className="py-3.5 px-4">Due Date</th>
                      <th className="py-3.5 px-4">Submissions</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAssignments.map((a) => {
                      const isPub = a.status === "published";
                      const dueStat = getDueStatus(a.dueDate);
                      const subCnt = submissionCounts[a.assignmentId] || submissionCounts[a.id] || 0;
                      const isDeleting = deletingId === a.id;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block truncate max-w-xs">{a.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {a.assignmentId}</span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-semibold">{a.courseName}</td>
                          <td className="py-3.5 px-4">
                            <span className="bg-blue-50 text-[#0057B8] font-semibold px-2 py-0.5 rounded text-[10px] block w-max mb-0.5">
                              {a.type}
                            </span>
                            <span className="text-slate-500 text-[11px]">{a.subject}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-700 block">{formatDateDisplay(a.dueDate)}</span>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                dueStat === "Overdue"
                                  ? "bg-rose-100 text-rose-800"
                                  : dueStat === "Due Soon"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {dueStat}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/assignments/${a.id}/submissions`}
                              className="inline-flex items-center gap-1 font-bold text-[#0057B8] hover:underline"
                            >
                              <span>{subCnt} Submitted</span>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                isPub ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingAssignment(a)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                              >
                                View
                              </button>
                              <Link
                                href={`/admin/assignments/${a.id}/submissions`}
                                className="px-2.5 py-1 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-[11px] font-medium"
                              >
                                Evaluate
                              </Link>
                              <button
                                onClick={() => openEditModal(a)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleTogglePublish(a)}
                                disabled={isSubmitting}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${
                                  isPub ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                }`}
                              >
                                {isPub ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                onClick={() => handleDelete(a)}
                                disabled={isDeleting}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg"
                                title="Delete Assignment"
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
              {filteredAssignments.map((a) => {
                const isPub = a.status === "published";
                const dueStat = getDueStatus(a.dueDate);
                const subCnt = submissionCounts[a.assignmentId] || submissionCounts[a.id] || 0;

                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="bg-blue-50 text-[#0057B8] font-bold px-2 py-0.5 rounded text-[10px] inline-block mb-1">
                          {a.type}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 leading-snug">{a.title}</h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 ${
                          isPub ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p>Course: <strong className="text-slate-700">{a.courseName}</strong></p>
                      <p>Subject: <span className="text-slate-700">{a.subject}</span> • Due: <strong className="text-slate-800">{formatDateDisplay(a.dueDate)}</strong> ({dueStat})</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/assignments/${a.id}/submissions`}
                        className="text-xs font-bold text-[#0057B8] underline"
                      >
                        {subCnt} Submissions
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingAssignment(a)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openEditModal(a)}
                          className="px-2.5 py-1 bg-blue-50 text-[#0057B8] rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleTogglePublish(a)}
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

      {/* VIEW DETAILS MODAL */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setViewingAssignment(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
            >
              ✕
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="bg-blue-50 text-[#0057B8] font-bold text-xs px-2.5 py-0.5 rounded">
                {viewingAssignment.type}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">{viewingAssignment.title}</h2>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <p><strong className="text-slate-500">Course:</strong> {viewingAssignment.courseName}</p>
              <p><strong className="text-slate-500">Subject:</strong> {viewingAssignment.subject}</p>
              <p><strong className="text-slate-500">Module:</strong> {viewingAssignment.module || "—"}</p>
              <p><strong className="text-slate-500">Marks:</strong> {viewingAssignment.passingMarks} / {viewingAssignment.totalMarks} (Passing/Total)</p>
              <p><strong className="text-slate-500">Due Date:</strong> {formatDateDisplay(viewingAssignment.dueDate)}</p>
              <p><strong className="text-slate-500">Submission Type:</strong> {viewingAssignment.submissionType}</p>
              <p><strong className="text-slate-500">Instructions:</strong> {viewingAssignment.instructions || "No custom instructions provided."}</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Link
                href={`/admin/assignments/${viewingAssignment.id}/submissions`}
                className="px-4 py-2 bg-[#0057B8] text-white text-xs font-semibold rounded-xl"
              >
                View Submissions
              </Link>
              <button
                onClick={() => setViewingAssignment(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
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
                {editingAssignment ? "Edit Assignment" : "Create New Assignment"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Set assignment details, due date, submission format, and attach reference files.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. JavaScript Functions Practice"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short summary of the task..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Detailed Instructions</label>
                <textarea
                  rows={2}
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Step-by-step submission instructions for students..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Course *</label>
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
                  <label className="block text-slate-600 font-semibold mb-1">Assignment Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Assignment["type"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="Homework">Homework</option>
                    <option value="Practice">Practice</option>
                    <option value="Project">Project</option>
                    <option value="Worksheet">Worksheet</option>
                    <option value="Test">Test</option>
                    <option value="Practical">Practical</option>
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
                    placeholder="e.g. Module 2"
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Total Marks *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Passing Marks</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.passingMarks}
                    onChange={(e) => setFormData({ ...formData, passingMarks: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
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
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Submission Format *</label>
                  <select
                    value={formData.submissionType}
                    onChange={(e) => setFormData({ ...formData, submissionType: e.target.value as Assignment["submissionType"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="File Upload">File Upload</option>
                    <option value="Text Answer">Text Answer</option>
                    <option value="Link">External Link</option>
                    <option value="File + Text">File + Text Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Publish Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Assignment["status"] })}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* ATTACHMENT & EXTERNAL RESOURCE */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Attach File / Worksheet (PDF / Doc)</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.zip"
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
                  <label className="block text-slate-600 font-semibold mb-1">OR External Reference Link</label>
                  <input
                    type="url"
                    value={formData.externalUrl}
                    onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className="w-full px-3 py-2 border border-slate-200 bg-white text-slate-800 rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
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
                  {isSubmitting ? "Saving Assignment..." : editingAssignment ? "Update Assignment" : "Create & Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}