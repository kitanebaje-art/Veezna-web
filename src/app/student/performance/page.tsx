"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// --- INTERFACES MATCHING EXISTING VEEZNA SYSTEM ---
export interface StudentDoc {
  docId: string;
  studentId?: string;
  uid?: string;
  name?: string;
  fullName?: string;
  email?: string;
  academicClass?: string;
  class?: string;
  program?: string;
  course?: string;
  batch?: string;
}

export interface AssessmentRecordDoc {
  docId: string;
  studentId?: string;
  uid?: string;
  examName?: string;
  testName?: string;
  assessmentName?: string;
  subject?: string;
  course?: string;
  assessmentType?: string; // Test, Exam, Quiz, Assignment, Project
  marks?: number | string;
  marksObtained?: number | string;
  obtainedMarks?: number | string;
  maxMarks?: number | string;
  maximumMarks?: number | string;
  percentage?: number | string;
  grade?: string;
  date?: string | Timestamp | Date | number;
  createdAt?: string | Timestamp | Date | number;
  remarks?: string;
  teacherRemarks?: string;
  status?: string; // published, draft, internal
  isPublished?: boolean;
}

export default function StudentPerformancePage() {
  const router = useRouter();

  // Auth & Student State
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [assessments, setAssessments] = useState<AssessmentRecordDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");

  // Safe Numeric & Date Helpers
  const toNumber = (val: unknown): number => {
    if (val === undefined || val === null || val === "" || val === "—") return 0;
    const num = Number(val);
    return isFinite(num) ? num : 0;
  };

  const parseDateToMillis = (dateVal: unknown): number => {
    if (!dateVal) return 0;
    if (dateVal instanceof Timestamp) return dateVal.toMillis();
    if (typeof (dateVal as { toMillis?: () => number })?.toMillis === "function") {
      return (dateVal as { toMillis: () => number }).toMillis()!;
    }
    if (dateVal instanceof Date) return dateVal.getTime();
    if (typeof dateVal === "number") return dateVal;
    if (typeof dateVal === "string") {
      const parsed = new Date(dateVal).getTime();
      return isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };

  const formatDateDisplay = (dateVal: unknown): string => {
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [year, month, day] = dateVal.split("-");
      const dt = new Date(Number(year), Number(month) - 1, Number(day));
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const millis = parseDateToMillis(dateVal);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // VEEZNA Grading Calculator Fallback
  const calculateGrade = (pct: number, existingGrade?: string): string => {
    if (existingGrade && existingGrade.trim() !== "") {
      return existingGrade.trim();
    }
    if (pct >= 90) return "A+";
    if (pct >= 80) return "A";
    if (pct >= 70) return "B+";
    if (pct >= 60) return "B";
    if (pct >= 50) return "C";
    if (pct >= 40) return "D";
    return "Needs Improvement";
  };

  // Auth Listener & Multi-Collection Fallback Subscription
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/student/login");
        return;
      }

      try {
        // Step 1: Resolve Student Document by UID or Email
        let matchedStudentDoc: StudentDoc | null = null;
        let sDocId = user.uid;

        const docRefDirect = doc(db, "students", user.uid);
        const docSnapDirect = await getDoc(docRefDirect);

        if (docSnapDirect.exists()) {
          matchedStudentDoc = {
            docId: docSnapDirect.id,
            ...docSnapDirect.data(),
          } as StudentDoc;
        } else {
          const studentsRef = collection(db, "students");
          let qStud = query(studentsRef, where("uid", "==", user.uid));
          let studSnap = await getDocs(qStud);

          if (studSnap.empty && user.email) {
            qStud = query(studentsRef, where("email", "==", user.email.toLowerCase()));
            studSnap = await getDocs(qStud);
          }

          if (!studSnap.empty) {
            const firstDoc = studSnap.docs[0];
            matchedStudentDoc = {
              docId: firstDoc.id,
              ...firstDoc.data(),
            } as StudentDoc;
            sDocId = firstDoc.id;
          }
        }

        if (!matchedStudentDoc) {
          setError("No student account record found matching your credentials.");
          setLoading(false);
          return;
        }

        setStudent(matchedStudentDoc);

        // Step 2: Query Student Performance Records with Collection Resolution
        const knownStudentId = matchedStudentDoc.studentId || matchedStudentDoc.docId || sDocId;

        // Candidate collection names used across VEEZNA Admin modules
        const collectionCandidates = ["reports", "results", "assessments", "marks", "performance"];
        let targetCollectionName = "reports";

        for (const collName of collectionCandidates) {
          try {
            const testSnap = await getDocs(
              query(collection(db, collName), where("studentId", "==", knownStudentId))
            );
            if (!testSnap.empty) {
              targetCollectionName = collName;
              break;
            }
          } catch {
            // Proceed to check next candidate collection
          }
        }

        // Subscribe Real-Time to the active assessment collection
        const qAssessments = query(
          collection(db, targetCollectionName),
          where("studentId", "==", knownStudentId)
        );

        const unsubAssessments = onSnapshot(
          qAssessments,
          (snapshot) => {
            const records: AssessmentRecordDoc[] = [];

            snapshot.docs.forEach((docSnap) => {
              const data = docSnap.data();

              // Visibility Rule: Filter for published records only
              const statusStr = (data.status || "").toLowerCase().trim();
              const isPubBool = data.isPublished === true;
              const isPublished = isPubBool || statusStr === "published" || statusStr === "" || !data.status;

              if (isPublished) {
                records.push({
                  docId: docSnap.id,
                  ...data,
                });
              }
            });

            // Sort chronologically ascending for progress trend tracking
            records.sort((a, b) => {
              const tA = parseDateToMillis(a.date || a.createdAt);
              const tB = parseDateToMillis(b.date || b.createdAt);
              return tA - tB;
            });

            setAssessments(records);
            setLoading(false);
          },
          (err) => {
            console.error("Real-Time Assessment Subscription Error:", err);
            setError("Unable to sync live performance records. Please refresh.");
            setLoading(false);
          }
        );

        return () => unsubAttendanceCleanup();
        function unsubAttendanceCleanup() {
          unsubAssessments();
        }
      } catch (err) {
        console.error("Error setting up student performance data:", err);
        setError("Failed to load academic progress records. Please try again.");
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // Normalized Assessment Items with Computed Weighted Scores
  const processedAssessments = useMemo(() => {
    return assessments.map((item) => {
      const marksObtained = toNumber(
        item.marksObtained ?? item.obtainedMarks ?? item.marks
      );
      const maxMarks = toNumber(
        item.maxMarks ?? item.maximumMarks
      );

      const calculatedPct =
        maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 1000) / 10 : toNumber(item.percentage);

      const grade = calculateGrade(calculatedPct, item.grade);

      return {
        ...item,
        marksObtained,
        maxMarks: maxMarks > 0 ? maxMarks : 100,
        percentage: calculatedPct,
        grade,
        title: item.examName || item.testName || item.assessmentName || "Assessment",
        subjectName: item.subject || item.course || "General Academic",
        type: item.assessmentType || "Test",
        dateDisplay: formatDateDisplay(item.date || item.createdAt),
        rawMillis: parseDateToMillis(item.date || item.createdAt),
        remarkText: item.remarks || item.teacherRemarks || "",
      };
    });
  }, [assessments]);

  // Overall Performance Summary Calculations
  const overallSummary = useMemo(() => {
    const totalAssessments = processedAssessments.length;
    if (totalAssessments === 0) {
      return {
        overallPercentage: 0,
        averageScore: 0,
        bestScore: 0,
        totalAssessments: 0,
        grade: "N/A",
      };
    }

    let sumObtained = 0;
    let sumMax = 0;
    let highestPct = 0;

    processedAssessments.forEach((item) => {
      sumObtained += item.marksObtained;
      sumMax += item.maxMarks;
      if (item.percentage > highestPct) {
        highestPct = item.percentage;
      }
    });

    const overallPercentage =
      sumMax > 0 ? Math.round((sumObtained / sumMax) * 1000) / 10 : 0;
    const averageScore =
      Math.round((processedAssessments.reduce((acc, c) => acc + c.percentage, 0) / totalAssessments) * 10) / 10;

    return {
      overallPercentage,
      averageScore,
      bestScore: highestPct,
      totalAssessments,
      grade: calculateGrade(overallPercentage),
    };
  }, [processedAssessments]);

  // Subject-wise Breakdown Metrics
  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { totalObtained: number; totalMax: number; count: number }>();

    processedAssessments.forEach((item) => {
      const subj = item.subjectName;
      const current = map.get(subj) || { totalObtained: 0, totalMax: 0, count: 0 };
      map.set(subj, {
        totalObtained: current.totalObtained + item.marksObtained,
        totalMax: current.totalMax + item.maxMarks,
        count: current.count + 1,
      });
    });

    const list: Array<{
      subject: string;
      obtained: number;
      max: number;
      percentage: number;
      grade: string;
    }> = [];

    map.forEach((val, key) => {
      const pct = val.totalMax > 0 ? Math.round((val.totalObtained / val.totalMax) * 1000) / 10 : 0;
      list.push({
        subject: key,
        obtained: val.totalObtained,
        max: val.totalMax,
        percentage: pct,
        grade: calculateGrade(pct),
      });
    });

    list.sort((a, b) => b.percentage - a.percentage);
    return list;
  }, [processedAssessments]);

  // Strengths & Improvement Observations
  const academicObservations = useMemo(() => {
    if (subjectBreakdown.length === 0) return { strengths: [], improvements: [] };

    const strengths: string[] = [];
    const improvements: string[] = [];

    subjectBreakdown.forEach((item) => {
      if (item.percentage >= 75) {
        strengths.push(`Strong performance in ${item.subject} (${item.percentage}% average).`);
      } else if (item.percentage < 65) {
        improvements.push(`${item.subject} scores indicate scope for enhancement (${item.percentage}% average).`);
      }
    });

    return { strengths, improvements };
  }, [subjectBreakdown]);

  // Distinct Filter Options
  const filterOptions = useMemo(() => {
    const subjects = new Set<string>();
    const types = new Set<string>();
    const years = new Set<string>();

    processedAssessments.forEach((item) => {
      if (item.subjectName) subjects.add(item.subjectName);
      if (item.type) types.add(item.type);
      if (item.rawMillis > 0) {
        years.add(String(new Date(item.rawMillis).getFullYear()));
      }
    });

    return {
      subjects: ["All", ...Array.from(subjects)],
      types: ["All", ...Array.from(types)],
      years: ["All", ...Array.from(years)],
    };
  }, [processedAssessments]);

  // Filtered History Table
  const filteredHistory = useMemo(() => {
    return processedAssessments.filter((item) => {
      const matchesSubject = selectedSubject === "All" || item.subjectName === selectedSubject;
      const matchesType = selectedType === "All" || item.type === selectedType;
      const yearStr = item.rawMillis > 0 ? String(new Date(item.rawMillis).getFullYear()) : "";
      const matchesYear = selectedYear === "All" || yearStr === selectedYear;

      return matchesSubject && matchesType && matchesYear;
    });
  }, [processedAssessments, selectedSubject, selectedType, selectedYear]);

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading academic progress...</p>
        </div>
      </div>
    );
  }

  // Error View
  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-800">Performance Error</h2>
          <p className="text-xs text-slate-500">{error || "Student record not found."}</p>
          <Link
            href="/student/dashboard"
            className="inline-block px-5 py-2 bg-[#0057B8] text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const studentCode = student.studentId || student.docId || "VZ-STU";
  const displayClass = student.academicClass || student.class || "N/A";
  const displayProgram = student.program || student.course || "Standard Academic Program";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* BREADCRUMB */}
        <div className="flex items-center justify-between">
          <Link
            href="/student/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>

          <span className="text-xs font-semibold text-slate-400">
            Student Portal • Performance
          </span>
        </div>

        {/* HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0057B8] tracking-tight">
              Academic Progress & Performance
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-light">
              Track published test scores, subject performance, and assessment trends.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="bg-blue-50 text-[#0057B8] font-mono font-bold px-3 py-1.5 rounded-xl border border-blue-100">
              ID: {studentCode}
            </span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Class: {displayClass}
            </span>
          </div>
        </div>

        {/* EMPTY STATE WHEN NO ASSESSMENTS ARE PUBLISHED */}
        {processedAssessments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto text-xl">
              📊
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No performance records available yet.
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-light">
              Your results and assessment feedback will appear here once published by VEEZNA administration.
            </p>
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              
              {/* Overall Performance */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Overall Weighted Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-[#0057B8] block">
                  {overallSummary.overallPercentage}%
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057B8] border border-blue-200">
                  Grade: {overallSummary.grade}
                </span>
              </div>

              {/* Average Score */}
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                  Average Assessment Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">
                  {overallSummary.averageScore}%
                </span>
                <span className="text-[11px] text-emerald-600/80 block font-medium">
                  Across Published Tests
                </span>
              </div>

              {/* Best Score */}
              <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Best Score
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-700 block">
                  {overallSummary.bestScore}%
                </span>
                <span className="text-[11px] text-amber-600/80 block font-medium">
                  Highest Achievement
                </span>
              </div>

              {/* Total Assessments */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Assessments
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-800 block">
                  {overallSummary.totalAssessments}
                </span>
                <span className="text-[11px] text-slate-400 block font-light">
                  Published Tests & Exams
                </span>
              </div>

            </div>

            {/* 2. PROGRESS TREND VISUALIZATION & OBSERVATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Progress Trend Chart */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                    Assessment Score Trend
                  </h2>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chronological Progress
                  </span>
                </div>

                {/* CSS / SVG Responsive Trend Chart */}
                <div className="pt-2 pb-1 space-y-3">
                  <div className="h-40 w-full flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-200">
                    {processedAssessments.map((item, idx) => {
                      const barHeight = Math.max(10, Math.min(100, item.percentage));
                      return (
                        <div key={item.docId || idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                          <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                            {item.percentage}%
                          </span>
                          <div
                            className="w-full max-w-[28px] bg-gradient-to-t from-[#0057B8] to-[#F7931E] rounded-t-md transition-all duration-300 group-hover:brightness-110"
                            style={{ height: `${barHeight}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-2">
                    <span>Earlier Tests</span>
                    <span>Recent Tests</span>
                  </div>
                </div>
              </div>

              {/* Strengths & Observations */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
                  Observations & Strengths
                </h2>

                <div className="space-y-3 text-xs">
                  {academicObservations.strengths.map((str, idx) => (
                    <div key={`str-${idx}`} className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-800">
                      <span className="font-bold">✓ </span>{str}
                    </div>
                  ))}

                  {academicObservations.improvements.map((imp, idx) => (
                    <div key={`imp-${idx}`} className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-amber-800">
                      <span className="font-bold">💡 </span>{imp}
                    </div>
                  ))}

                  {academicObservations.strengths.length === 0 && academicObservations.improvements.length === 0 && (
                    <p className="text-slate-400 text-xs italic">
                      Sufficient assessment history required to formulate domain observations.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* 3. ACADEMIC SUBJECT BREAKDOWN */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                  Subject-Wise Performance
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {subjectBreakdown.length} Subjects Tracked
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {subjectBreakdown.map((sb) => (
                  <div key={sb.subject} className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{sb.subject}</span>
                      <span className="font-extrabold text-[#0057B8]">{sb.percentage}% ({sb.grade})</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Marks: {sb.obtained} / {sb.max}</span>
                      <span>Target Criteria: 75%</span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-[#0057B8] h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, sb.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. ASSESSMENT HISTORY & FILTERS */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
                  Assessment History & Feedback
                </h2>

                {/* Filters Bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  >
                    {filterOptions.subjects.map((subj) => (
                      <option key={subj} value={subj}>
                        Subject: {subj}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  >
                    {filterOptions.types.map((type) => (
                      <option key={type} value={type}>
                        Type: {type}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
                  >
                    {filterOptions.years.map((yr) => (
                      <option key={yr} value={yr}>
                        Year: {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No matching assessment records found for selected filters.
                </p>
              ) : (
                <>
                  {/* DESKTOP TABLE VIEW */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="py-3 px-4">Test / Exam Name</th>
                          <th className="py-3 px-4">Subject</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Score</th>
                          <th className="py-3 px-4">Percentage</th>
                          <th className="py-3 px-4">Grade</th>
                          <th className="py-3 px-4">Teacher Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredHistory.map((item) => (
                          <tr key={item.docId} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {item.title}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {item.subjectName}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {item.dateDisplay}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                              {item.marksObtained} / {item.maxMarks}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-[#0057B8]">
                              {item.percentage}%
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057B8] border border-blue-200">
                                {item.grade}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 text-[11px] italic max-w-xs truncate">
                              {item.remarkText || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* MOBILE CARD VIEW */}
                  <div className="block md:hidden space-y-3">
                    {filteredHistory.map((item) => (
                      <div
                        key={item.docId}
                        className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                          <span className="font-bold text-slate-800">{item.title}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0057B8] border border-blue-200">
                            {item.grade}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span>{item.subjectName} • {item.dateDisplay}</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {item.marksObtained}/{item.maxMarks} ({item.percentage}%)
                          </span>
                        </div>

                        {item.remarkText && (
                          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200/60">
                            💬 {item.remarkText}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}