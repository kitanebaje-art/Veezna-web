"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase"; // Assumes standard firebase initialization
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp,
  orderBy,
} from "firebase/firestore";

// --- TYPES & INTERFACES ---
interface StudentData {
  uid: string;
  name?: string;
  courseId?: string;
  programId?: string;
  batchId?: string;
  email?: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions?: string;
  courseId?: string;
  programId?: string;
  batchId?: string;
  assignedDate?: any;
  dueDate: any; // Firestore Timestamp or Date string
  maxMarks: number;
  status: "published" | "draft" | "active";
  attachmentUrl?: string;
  attachmentName?: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentUid: string;
  submittedAt: any;
  status: "submitted" | "late" | "graded";
  textResponse?: string;
  fileUrl?: string;
  fileName?: string;
  marks?: number;
  feedback?: string;
}

type FilterType = "All" | "Pending" | "Submitted" | "Graded" | "Overdue";

export default function StudentAssignmentsPage() {
  const router = useRouter();

  // Auth & Student states
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});

  // UI Filter & Search states
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [textResponse, setTextResponse] = useState<string>("");
  const [fileUrlInput, setFileUrlInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Hydrated state to prevent hydration mismatches
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Auth & Data Fetching Effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/student/login");
        return;
      }
      setUser(currentUser);

      try {
        setLoading(true);
        setError(null);

        // Fetch Student Profile
        const studentDocRef = doc(db, "students", currentUser.uid);
        const studentSnap = await getDoc(studentDocRef);

        let studentRecord: StudentData = { uid: currentUser.uid };
        if (studentSnap.exists()) {
          studentRecord = { uid: currentUser.uid, ...studentSnap.data() } as StudentData;
        }
        setStudent(studentRecord);

        const courseId = studentRecord.courseId || studentRecord.programId;
        const batchId = studentRecord.batchId;

        // Fetch Published Assignments
        const assignmentsRef = collection(db, "assignments");
        const assignmentsSnap = await getDocs(query(assignmentsRef, where("status", "==", "published")));
        
        const fetchedAssignments: Assignment[] = [];
        assignmentsSnap.forEach((doc) => {
          const data = doc.data() as Omit<Assignment, "id">;
          
          // Target assignment by course/batch or general targeting
          const matchesCourse = !data.courseId && !data.programId || (data.courseId === courseId || data.programId === courseId);
          const matchesBatch = !data.batchId || data.batchId === batchId;

          if (matchesCourse && matchesBatch) {
            fetchedAssignments.push({ id: doc.id, ...data });
          }
        });

        // Fetch Student's Submissions
        const submissionsRef = collection(db, "submissions");
        const submissionsSnap = await getDocs(query(submissionsRef, where("studentUid", "==", currentUser.uid)));
        
        const submissionMap: Record<string, Submission> = {};
        submissionsSnap.forEach((doc) => {
          const subData = doc.data() as Omit<Submission, "id">;
          submissionMap[subData.assignmentId] = { id: doc.id, ...subData };
        });

        setAssignments(fetchedAssignments);
        setSubmissions(submissionMap);
      } catch (err: any) {
        console.error("Error loading student assignments:", err);
        setError("Failed to load assignments. Please refresh or try again later.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper functions for status calculation
  const getAssignmentStatus = (assignment: Assignment) => {
    const sub = submissions[assignment.id];
    if (sub) {
      if (sub.status === "graded" || sub.marks !== undefined) return "Graded";
      if (sub.status === "late") return "Late";
      return "Submitted";
    }

    const dueDate = assignment.dueDate?.toDate ? assignment.dueDate.toDate() : new Date(assignment.dueDate);
    if (new Date() > dueDate) {
      return "Overdue";
    }
    return "Pending";
  };

  // Summary counts
  const summary = useMemo(() => {
    let pending = 0;
    let submitted = 0;
    let overdue = 0;

    assignments.forEach((a) => {
      const status = getAssignmentStatus(a);
      if (status === "Pending") pending++;
      else if (status === "Submitted" || status === "Late" || status === "Graded") submitted++;
      else if (status === "Overdue") overdue++;
    });

    return { total: assignments.length, pending, submitted, overdue };
  }, [assignments, submissions]);

  // Filtered & Searched Assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const status = getAssignmentStatus(a);

      let matchesFilter = true;
      if (activeFilter === "Pending") matchesFilter = status === "Pending";
      else if (activeFilter === "Submitted") matchesFilter = status === "Submitted" || status === "Late";
      else if (activeFilter === "Graded") matchesFilter = status === "Graded";
      else if (activeFilter === "Overdue") matchesFilter = status === "Overdue";

      const matchesSearch =
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesFilter && matchesSearch;
    });
  }, [assignments, submissions, activeFilter, searchQuery]);

  // Handle Submission Action
  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !user) return;

    try {
      setSubmitting(true);
      setSubmissionSuccess(null);

      const dueDate = selectedAssignment.dueDate?.toDate 
        ? selectedAssignment.dueDate.toDate() 
        : new Date(selectedAssignment.dueDate);
      
      const isLate = new Date() > dueDate;
      const submissionStatus = isLate ? "late" : "submitted";

      const submissionDocId = `${selectedAssignment.id}_${user.uid}`;
      const submissionRef = doc(db, "submissions", submissionDocId);

      const payload: Partial<Submission> = {
        assignmentId: selectedAssignment.id,
        studentUid: user.uid,
        submittedAt: Timestamp.now(),
        status: submissionStatus,
        textResponse: textResponse.trim() || undefined,
        fileUrl: fileUrlInput.trim() || undefined,
      };

      await setDoc(submissionRef, payload, { merge: true });

      setSubmissions((prev) => ({
        ...prev,
        [selectedAssignment.id]: { id: submissionDocId, ...payload } as Submission,
      }));

      setSubmissionSuccess("Assignment submitted successfully!");
      setTimeout(() => {
        setSelectedAssignment(null);
        setSubmissionSuccess(null);
        setTextResponse("");
        setFileUrlInput("");
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting assignment:", err);
      alert("Failed to submit assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const existingSub = submissions[assignment.id];
    setTextResponse(existingSub?.textResponse || "");
    setFileUrlInput(existingSub?.fileUrl || "");
    setSubmissionSuccess(null);
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Assignments</h1>
          <p className="text-slate-600 text-sm md:text-base">
            View, complete and track your course assignments.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-r-md text-sm">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-500">Total Assignments</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold uppercase text-amber-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold uppercase text-emerald-600">Submitted</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{summary.submitted}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs font-semibold uppercase text-red-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{summary.overdue}</p>
          </div>
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {(["All", "Pending", "Submitted", "Graded", "Overdue"] as FilterType[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-[#0057B8] text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
            />
          </div>
        </div>

        {/* ASSIGNMENTS GRID */}
        {filteredAssignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <svg
              className="w-12 h-12 text-slate-300 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-slate-800">No assignments yet</h3>
            <p className="text-slate-500 text-sm mt-1">
              New assignments will appear here when assigned by the VEEZNA team.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => {
              const status = getAssignmentStatus(assignment);
              const submission = submissions[assignment.id];
              const dueDateObj = assignment.dueDate?.toDate
                ? assignment.dueDate.toDate()
                : new Date(assignment.dueDate);

              return (
                <div
                  key={assignment.id}
                  onClick={() => openDetails(assignment)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-[#0057B8] transition-all p-5 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h2 className="font-semibold text-slate-900 group-hover:text-[#0057B8] transition-colors line-clamp-2">
                        {assignment.title}
                      </h2>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                          status === "Graded"
                            ? "bg-purple-100 text-purple-700"
                            : status === "Submitted"
                            ? "bg-emerald-100 text-emerald-700"
                            : status === "Late"
                            ? "bg-orange-100 text-orange-700"
                            : status === "Overdue"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-3 mb-4">
                      {assignment.description || "No description provided."}
                    </p>
                  </div>

                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="font-medium text-slate-700">
                        {dueDateObj.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Marks:</span>
                      <span className="font-medium text-slate-700">{assignment.maxMarks || "N/A"}</span>
                    </div>
                    {submission && submission.marks !== undefined && (
                      <div className="flex justify-between text-purple-700 font-semibold pt-1 border-t border-dashed">
                        <span>Obtained Marks:</span>
                        <span>
                          {submission.marks} / {assignment.maxMarks}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* DETAILS & SUBMISSION MODAL */}
        {selectedAssignment && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedAssignment.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Max Marks: {selectedAssignment.maxMarks || "N/A"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssignment(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* DETAILS */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase">Description</h4>
                  <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                    {selectedAssignment.description || "No detailed description."}
                  </p>
                </div>

                {selectedAssignment.instructions && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Instructions</h4>
                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">
                      {selectedAssignment.instructions}
                    </p>
                  </div>
                )}

                {selectedAssignment.attachmentUrl && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resource</h4>
                    <a
                      href={selectedAssignment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[#0057B8] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      📎 {selectedAssignment.attachmentName || "Open Resource Attachment"}
                    </a>
                  </div>
                )}
              </div>

              {/* GRADED FEEDBACK DISPLAY */}
              {submissions[selectedAssignment.id]?.feedback && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl">
                  <h4 className="text-xs font-semibold text-purple-800 uppercase">Teacher Feedback</h4>
                  <p className="text-sm text-purple-900 mt-1">
                    {submissions[selectedAssignment.id].feedback}
                  </p>
                </div>
              )}

              {/* SUBMISSION FORM */}
              <form onSubmit={handleSubmitWork} className="border-t pt-4 space-y-4">
                <h3 className="text-base font-semibold text-slate-900">Your Submission</h3>

                {submissionSuccess && (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm">
                    {submissionSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Text Answer / Notes
                  </label>
                  <textarea
                    rows={4}
                    value={textResponse}
                    onChange={(e) => setTextResponse(e.target.value)}
                    placeholder="Type your response or assignment text here..."
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Submission Document Link / Storage URL
                  </label>
                  <input
                    type="url"
                    value={fileUrlInput}
                    onChange={(e) => setFileUrlInput(e.target.value)}
                    placeholder="https://drive.google.com/... or submission link"
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-[#0057B8] focus:outline-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Paste a link to your Google Drive, Github repository, or uploaded file.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAssignment(null)}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}