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

// --- INTERFACES MATCHING EXISTING ADMIN MODULES ---
export interface StudentDoc {
  docId: string;
  studentId?: string;
  uid?: string;
  name?: string;
  fullName?: string;
  email?: string;
  academicClass?: string;
  class?: string;
  batch?: string;
  batchName?: string;
  status?: string;
}

export interface AttendanceRecordDoc {
  docId: string;
  studentId?: string;
  studentName?: string;
  academicClass?: string;
  batch?: string;
  date?: string; // YYYY-MM-DD
  status?: "present" | "absent" | "late" | "leave" | string;
  remarks?: string;
  markedBy?: string;
  createdAt?: string | Timestamp | Date | number;
  updatedAt?: string | Timestamp | Date | number;
}

export default function StudentAttendancePage() {
  const router = useRouter();

  // Auth & State
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceRecordDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Calendar States
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth()); // 0 - 11
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Safe Helpers
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

  const formatDateDisplay = (dateStr?: string): string => {
    if (!dateStr) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      const dt = new Date(Number(year), Number(month) - 1, Number(day));
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    const millis = parseDateToMillis(dateStr);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDayName = (dateStr?: string): string => {
    if (!dateStr) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split("-");
      const dt = new Date(Number(year), Number(month) - 1, Number(day));
      return dt.toLocaleDateString("en-IN", { weekday: "long" });
    }
    const millis = parseDateToMillis(dateStr);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", { weekday: "long" });
  };

  // Auth Listener & Real-Time Student + Attendance Subscription
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

        // Step 2: Set up Real-Time Attendance Subscription
        const knownStudentId = matchedStudentDoc.studentId || matchedStudentDoc.docId || sDocId;

        const attendanceRef = collection(db, "attendance");
        const qAtt = query(attendanceRef, where("studentId", "==", knownStudentId));

        const unsubAttendance = onSnapshot(
          qAtt,
          (attSnap) => {
            const logsList: AttendanceRecordDoc[] = attSnap.docs.map((dSnap) => ({
              docId: dSnap.id,
              ...dSnap.data(),
            }));

            // Sort newest attendance date first
            logsList.sort((a, b) => {
              const tA = parseDateToMillis(a.date || a.createdAt);
              const tB = parseDateToMillis(b.date || b.createdAt);
              return tB - tA;
            });

            setAttendanceLogs(logsList);
            setLoading(false);
          },
          (err) => {
            console.error("Real-time Attendance Subscription Error:", err);
            setError("Unable to sync live attendance records. Please refresh.");
            setLoading(false);
          }
        );

        return () => unsubAttendance();
      } catch (err) {
        console.error("Error setting up student attendance data:", err);
        setError("Failed to load attendance information. Please try again.");
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // Overall Attendance Summary Calculations
  const overallSummary = useMemo(() => {
    const totalClasses = attendanceLogs.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;

    attendanceLogs.forEach((log) => {
      const st = (log.status || "").toLowerCase().trim();
      if (st === "present") presentCount++;
      else if (st === "absent") absentCount++;
      else if (st === "late") lateCount++;
      else if (st === "leave") leaveCount++;
    });

    const percentage =
      totalClasses > 0
        ? Math.round((presentCount / totalClasses) * 1000) / 10
        : 0;

    // Configurable Attendance Status Indicator
    let statusLabel: "Excellent" | "Good" | "Needs Attention" | "Critical" = "Good";
    let statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";

    if (percentage >= 90) {
      statusLabel = "Excellent";
      statusColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (percentage >= 75) {
      statusLabel = "Good";
      statusColor = "bg-blue-50 text-[#0057B8] border-blue-200";
    } else if (percentage >= 60) {
      statusLabel = "Needs Attention";
      statusColor = "bg-amber-50 text-amber-800 border-amber-200";
    } else {
      statusLabel = "Critical";
      statusColor = "bg-rose-50 text-rose-700 border-rose-200";
    }

    return {
      totalClasses,
      presentCount,
      absentCount,
      lateCount,
      leaveCount,
      percentage,
      statusLabel,
      statusColor,
    };
  }, [attendanceLogs]);

  // Monthly Filtered Attendance & Calendar Map
  const monthlyData = useMemo(() => {
    const logsInMonth = attendanceLogs.filter((log) => {
      if (!log.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
        const millis = parseDateToMillis(log.createdAt || log.date);
        if (!millis) return false;
        const dt = new Date(millis);
        return dt.getMonth() === selectedMonth && dt.getFullYear() === selectedYear;
      }
      const [yearStr, monthStr] = log.date.split("-");
      return Number(monthStr) - 1 === selectedMonth && Number(yearStr) === selectedYear;
    });

    let mPresent = 0;
    let mAbsent = 0;
    let mLate = 0;
    let mLeave = 0;

    const calendarMap = new Map<number, AttendanceRecordDoc>();

    logsInMonth.forEach((log) => {
      const st = (log.status || "").toLowerCase().trim();
      if (st === "present") mPresent++;
      else if (st === "absent") mAbsent++;
      else if (st === "late") mLate++;
      else if (st === "leave") mLeave++;

      if (log.date && /^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
        const dayNum = Number(log.date.split("-")[2]);
        calendarMap.set(dayNum, log);
      }
    });

    const mTotal = logsInMonth.length;
    const mPercentage = mTotal > 0 ? Math.round((mPresent / mTotal) * 100) : 0;

    return {
      logsInMonth,
      mTotal,
      mPresent,
      mAbsent,
      mLate,
      mLeave,
      mPercentage,
      calendarMap,
    };
  }, [attendanceLogs, selectedMonth, selectedYear]);

  // Calendar Grid Builder (Days of Selected Month)
  const calendarDaysGrid = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay(); // 0 = Sun

    const grid = [];
    // Padding for previous month blank days
    for (let i = 0; i < firstDayIndex; i++) {
      grid.push(null);
    }
    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      grid.push(day);
    }
    return grid;
  }, [selectedMonth, selectedYear]);

  // Filtered History Table List
  const filteredHistoryLogs = useMemo(() => {
    return attendanceLogs.filter((log) => {
      const st = (log.status || "").toLowerCase().trim();
      const matchesStatus =
        statusFilter === "All" || st === statusFilter.toLowerCase().trim();

      const sTerm = searchTerm.toLowerCase().trim();
      const dateDisplay = formatDateDisplay(log.date).toLowerCase();
      const remarks = (log.remarks || "").toLowerCase();
      const matchesSearch =
        !sTerm || dateDisplay.includes(sTerm) || remarks.includes(sTerm);

      return matchesStatus && matchesSearch;
    });
  }, [attendanceLogs, statusFilter, searchTerm]);

  // Loading View
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading attendance records...</p>
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
          <h2 className="text-lg font-bold text-slate-800">Attendance Error</h2>
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
  const displayBatch = student.batchName || student.batch || "N/A";

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOP NAVIGATION BREADCRUMB */}
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
            Student Portal • Attendance
          </span>
        </div>

        {/* PAGE HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0057B8] tracking-tight">
              My Attendance
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-light">
              Track daily class attendance, review monthly presence logs, and monitor attendance criteria.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="bg-blue-50 text-[#0057B8] font-mono font-bold px-3 py-1.5 rounded-xl border border-blue-100">
              ID: {studentCode}
            </span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Class: {displayClass}
            </span>
            <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Batch: {displayBatch}
            </span>
          </div>
        </div>

        {/* 1. OVERVIEW SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Overall Percentage */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Overall Attendance
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#0057B8] block">
              {overallSummary.percentage}%
            </span>
            <span
              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${overallSummary.statusColor}`}
            >
              {overallSummary.statusLabel}
            </span>
          </div>

          {/* Present Classes */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Present Classes
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 block">
              {overallSummary.presentCount}
            </span>
            <span className="text-[11px] text-emerald-600/80 block font-medium">
              Attended Classes
            </span>
          </div>

          {/* Absent Classes */}
          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
              Absent Classes
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-700 block">
              {overallSummary.absentCount}
            </span>
            <span className="text-[11px] text-rose-600/80 block font-medium">
              Missed Sessions
            </span>
          </div>

          {/* Total Classes */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Classes
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-800 block">
              {overallSummary.totalClasses}
            </span>
            <span className="text-[11px] text-slate-400 block font-light">
              Total Marked Sessions
            </span>
          </div>

        </div>

        {/* 2. MONTHLY CALENDAR & SELECTOR SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          
          {/* Month & Year Controls Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
                Monthly Attendance View
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your day-by-day attendance status for {monthNames[selectedMonth]} {selectedYear}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
              >
                {monthNames.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
              >
                {[2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Monthly Stats Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Monthly Total</span>
              <span className="font-extrabold text-slate-800 text-sm">{monthlyData.mTotal} Classes</span>
            </div>
            <div>
              <span className="text-emerald-600 font-bold uppercase text-[9px] block">Present</span>
              <span className="font-extrabold text-emerald-700 text-sm">{monthlyData.mPresent}</span>
            </div>
            <div>
              <span className="text-rose-600 font-bold uppercase text-[9px] block">Absent</span>
              <span className="font-extrabold text-rose-700 text-sm">{monthlyData.mAbsent}</span>
            </div>
            <div>
              <span className="text-[#0057B8] font-bold uppercase text-[9px] block">Monthly %</span>
              <span className="font-extrabold text-[#0057B8] text-sm">{monthlyData.mPercentage}%</span>
            </div>
          </div>

          {/* Attendance Calendar Grid */}
          <div className="space-y-3">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {calendarDaysGrid.map((day, idx) => {
                if (day === null) {
                  return <div key={`blank-${idx}`} className="h-11 rounded-xl bg-slate-50/40" />;
                }

                const dayRecord = monthlyData.calendarMap.get(day);
                const st = dayRecord?.status ? dayRecord.status.toLowerCase() : null;

                let tileBg = "bg-slate-50 text-slate-600 hover:bg-slate-100";
                let statusBadge = "—";

                if (st === "present") {
                  tileBg = "bg-emerald-500 text-white font-bold shadow-sm";
                  statusBadge = "✓";
                } else if (st === "absent") {
                  tileBg = "bg-rose-500 text-white font-bold shadow-sm";
                  statusBadge = "✕";
                } else if (st === "late") {
                  tileBg = "bg-amber-500 text-white font-bold shadow-sm";
                  statusBadge = "L";
                } else if (st === "leave") {
                  tileBg = "bg-[#0057B8] text-white font-bold shadow-sm";
                  statusBadge = "Lv";
                }

                return (
                  <div
                    key={`day-${day}`}
                    className={`h-12 rounded-xl p-1.5 flex flex-col justify-between items-center transition-all ${tileBg}`}
                    title={dayRecord ? `${dayRecord.date}: ${dayRecord.status}` : `Day ${day}`}
                  >
                    <span className="text-[10px] opacity-80 leading-none">{day}</span>
                    <span className="text-xs leading-none">{statusBadge}</span>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] pt-2 text-slate-600 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Present (✓)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-500 inline-block" /> Absent (✕)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500 inline-block" /> Late (L)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#0057B8] inline-block" /> Leave (Lv)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" /> No Class / Unmarked
              </span>
            </div>
          </div>

        </div>

        {/* 3. ATTENDANCE HISTORY LIST & FILTERS */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
              Detailed Attendance History
            </h2>

            {/* Filters Bar */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search date or remarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0057B8]"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          </div>

          {filteredHistoryLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-2">
              <div className="w-10 h-10 bg-slate-200/70 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                📋
              </div>
              <p className="text-xs font-semibold">No attendance records available yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-light">
                Your class attendance will appear here automatically once marked by VEEZNA administration.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Day</th>
                      <th className="py-3 px-4">Class & Batch</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredHistoryLogs.map((log) => {
                      const st = (log.status || "present").toLowerCase();

                      return (
                        <tr key={log.docId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800">
                            {formatDateDisplay(log.date)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {getDayName(log.date)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {log.academicClass || displayClass} • {log.batch || displayBatch}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                st === "present"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : st === "absent"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : st === "late"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-[#0057B8] border border-blue-200"
                              }`}
                            >
                              {st}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {log.remarks || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="block md:hidden space-y-3">
                {filteredHistoryLogs.map((log) => {
                  const st = (log.status || "present").toLowerCase();

                  return (
                    <div
                      key={log.docId}
                      className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                        <span className="font-bold text-slate-800">
                          {formatDateDisplay(log.date)} ({getDayName(log.date)})
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            st === "present"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : st === "absent"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : st === "late"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-[#0057B8] border border-blue-200"
                          }`}
                        >
                          {st}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>Batch: {log.batch || displayBatch}</span>
                        {log.remarks && <span className="italic text-slate-500">💬 {log.remarks}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}