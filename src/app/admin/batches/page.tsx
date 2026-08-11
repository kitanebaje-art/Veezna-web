"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StudentRecord {
  docId: string;
  studentId?: string;
  name?: string;
  fullName?: string;
  mobile?: string;
  academicClass?: string;
  class?: string;
  program?: string;
  course?: string;
  batch?: string;
  batchName?: string;
  status?: string;
  createdAt?: string | Timestamp | Date | number;
}

export interface AttendanceRecord {
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

export default function AdminAttendancePage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [batchFilter, setBatchFilter] = useState<string>("All Batches");
  const [classFilter, setClassFilter] = useState<string>("All Classes");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Local Operations & UI
  const [updatingStudentId, setUpdatingStudentId] = useState<string | null>(null);
  const [isBulkMarking, setIsBulkMarking] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [remarkModalStudent, setRemarkModalStudent] = useState<{
    studentId: string;
    studentName: string;
    currentRemark: string;
  } | null>(null);
  const [tempRemark, setTempRemark] = useState<string>("");

  // Fetch Data from Firestore
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const studentsRef = collection(db, "students");
      const studentsSnap = await getDocs(studentsRef);
      const studentData: StudentRecord[] = studentsSnap.docs.map((docSnap) => ({
        docId: docSnap.id,
        ...docSnap.data(),
      }));

      // 2. Fetch Attendance
      const attendanceRef = collection(db, "attendance");
      const attendanceSnap = await getDocs(attendanceRef);
      const attendanceData: AttendanceRecord[] = attendanceSnap.docs.map(
        (docSnap) => ({
          docId: docSnap.id,
          ...docSnap.data(),
        })
      );

      setStudents(studentData);
      setAttendanceList(attendanceData);
    } catch (err: any) {
      console.error("Error fetching attendance data:", err);
      setError("Unable to load attendance records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Date Parsing Helpers
  const parseDateToMillis = (dateVal: any): number => {
    if (!dateVal) return 0;
    if (dateVal instanceof Timestamp) return dateVal.toMillis();
    if (typeof dateVal?.toMillis === "function") return dateVal.toMillis();
    if (dateVal instanceof Date) return dateVal.getTime();
    if (typeof dateVal === "number") return dateVal;
    if (typeof dateVal === "string") {
      const parsed = new Date(dateVal).getTime();
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const formatDateDisplay = (dateVal: any): string => {
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

  // Filter Active Students
  const activeStudents = useMemo(() => {
    return students.filter((s) => {
      if (!s.status) return true; // Keep safely if missing
      const st = s.status.toLowerCase().trim();
      return st === "active" || st === "enrolled";
    });
  }, [students]);

  // Filtered Students for Display based on Class, Batch & Search
  const filteredStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const name = (student.fullName || student.name || "").toLowerCase();
      const sId = (student.studentId || student.docId || "").toLowerCase();
      const mobile = (student.mobile || "").toLowerCase();
      const sTerm = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !sTerm ||
        name.includes(sTerm) ||
        sId.includes(sTerm) ||
        mobile.includes(sTerm);

      const sClass = (
        student.academicClass ||
        student.class ||
        ""
      ).toLowerCase();
      const matchesClass =
        classFilter === "All Classes" ||
        sClass === classFilter.toLowerCase() ||
        sClass.includes(classFilter.toLowerCase());

      const sBatch = (student.batchName || student.batch || "").toLowerCase();
      const matchesBatch =
        batchFilter === "All Batches" ||
        sBatch === batchFilter.toLowerCase() ||
        sBatch.includes(batchFilter.toLowerCase());

      return matchesSearch && matchesClass && matchesBatch;
    });
  }, [activeStudents, searchTerm, classFilter, batchFilter]);

  // Map of Attendance Records for the Selected Date keyed by Student ID
  const attendanceForSelectedDateMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceList.forEach((record) => {
      if (record.date === selectedDate && record.studentId) {
        map.set(record.studentId.trim().toLowerCase(), record);
      }
    });
    return map;
  }, [attendanceList, selectedDate]);

  // Daily Statistics
  const stats = useMemo(() => {
    let totalActiveFiltered = filteredStudents.length;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let leaveCount = 0;
    let notMarkedCount = 0;

    filteredStudents.forEach((st) => {
      const key = (st.studentId || st.docId).trim().toLowerCase();
      const att = attendanceForSelectedDateMap.get(key);
      const stStatus = att ? (att.status || "").toLowerCase() : "not_marked";

      if (stStatus === "present") presentCount++;
      else if (stStatus === "absent") absentCount++;
      else if (stStatus === "late") lateCount++;
      else if (stStatus === "leave") leaveCount++;
      else notMarkedCount++;
    });

    const attendancePercentage =
      totalActiveFiltered > 0
        ? Math.round((presentCount / totalActiveFiltered) * 100)
        : 0;

    return {
      total: totalActiveFiltered,
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      leave: leaveCount,
      notMarked: notMarkedCount,
      percentage: attendancePercentage,
    };
  }, [filteredStudents, attendanceForSelectedDateMap]);

  // Single Student Attendance Marking
  const handleMarkAttendance = async (
    student: StudentRecord,
    status: "present" | "absent" | "late" | "leave",
    customRemark?: string
  ) => {
    const sId = student.studentId || student.docId;
    const key = sId.trim().toLowerCase();
    const existingRecord = attendanceForSelectedDateMap.get(key);

    setUpdatingStudentId(sId);
    try {
      const now = new Date().toISOString();
      const sName = student.fullName || student.name || "—";
      const sClass = student.academicClass || student.class || "—";
      const sBatch = student.batchName || student.batch || "—";
      const remarkVal =
        customRemark !== undefined
          ? customRemark
          : existingRecord?.remarks || "";

      if (existingRecord && existingRecord.docId) {
        // Update existing record
        const docRef = doc(db, "attendance", existingRecord.docId);
        await updateDoc(docRef, {
          status,
          remarks: remarkVal,
          updatedAt: now,
        });

        setAttendanceList((prev) =>
          prev.map((item) =>
            item.docId === existingRecord.docId
              ? { ...item, status, remarks: remarkVal, updatedAt: now }
              : item
          )
        );
      } else {
        // Create new record
        const newRecordData = {
          studentId: sId,
          studentName: sName,
          academicClass: sClass,
          batch: sBatch,
          date: selectedDate,
          status,
          remarks: remarkVal,
          markedBy: "Admin",
          createdAt: now,
          updatedAt: now,
        };

        const docRef = await addDoc(
          collection(db, "attendance"),
          newRecordData
        );

        setAttendanceList((prev) => [
          ...prev,
          { docId: docRef.id, ...newRecordData },
        ]);
      }
    } catch (err) {
      console.error("Error marking attendance:", err);
      alert("Failed to mark attendance. Please try again.");
    } finally {
      setUpdatingStudentId(null);
    }
  };

  // Bulk Action: Mark All Filtered Active Students Present
  const handleMarkAllPresent = async () => {
    if (filteredStudents.length === 0) {
      alert("No students match the current filter to mark present.");
      return;
    }

    const confirmMark = window.confirm(
      `Are you sure you want to mark all ${filteredStudents.length} filtered students as PRESENT for ${formatDateDisplay(
        selectedDate
      )}?`
    );
    if (!confirmMark) return;

    setIsBulkMarking(true);
    try {
      const now = new Date().toISOString();
      const updatedList = [...attendanceList];

      for (const student of filteredStudents) {
        const sId = student.studentId || student.docId;
        const key = sId.trim().toLowerCase();
        const existingRecord = attendanceForSelectedDateMap.get(key);
        const sName = student.fullName || student.name || "—";
        const sClass = student.academicClass || student.class || "—";
        const sBatch = student.batchName || student.batch || "—";

        if (existingRecord && existingRecord.docId) {
          if (existingRecord.status !== "present") {
            const docRef = doc(db, "attendance", existingRecord.docId);
            await updateDoc(docRef, {
              status: "present",
              updatedAt: now,
            });

            const index = updatedList.findIndex(
              (r) => r.docId === existingRecord.docId
            );
            if (index !== -1) {
              updatedList[index] = {
                ...updatedList[index],
                status: "present",
                updatedAt: now,
              };
            }
          }
        } else {
          const newRecordData = {
            studentId: sId,
            studentName: sName,
            academicClass: sClass,
            batch: sBatch,
            date: selectedDate,
            status: "present",
            remarks: "",
            markedBy: "Admin",
            createdAt: now,
            updatedAt: now,
          };

          const docRef = await addDoc(
            collection(db, "attendance"),
            newRecordData
          );
          updatedList.push({ docId: docRef.id, ...newRecordData });
        }
      }

      setAttendanceList(updatedList);
      showToast("All filtered students marked as Present successfully.");
    } catch (err) {
      console.error("Error bulk marking attendance:", err);
      alert("An error occurred while marking all present. Please try again.");
    } finally {
      setIsBulkMarking(false);
    }
  };

  // Remark Modal Save
  const handleSaveRemark = async () => {
    if (!remarkModalStudent) return;
    const targetStudent = students.find(
      (s) => (s.studentId || s.docId) === remarkModalStudent.studentId
    );
    if (!targetStudent) return;

    const key = remarkModalStudent.studentId.trim().toLowerCase();
    const existing = attendanceForSelectedDateMap.get(key);
    const currentStatus = (existing?.status as any) || "present";

    await handleMarkAttendance(targetStudent, currentStatus, tempRemark);
    setRemarkModalStudent(null);
    showToast("Attendance remark updated.");
  };

  // Recent Attendance History (Last 8 marked records overall)
  const recentAttendanceLogs = useMemo(() => {
    const sorted = [...attendanceList].sort((a, b) => {
      const tA = parseDateToMillis(a.updatedAt || a.createdAt);
      const tB = parseDateToMillis(b.updatedAt || b.createdAt);
      return tB - tA;
    });
    return sorted.slice(0, 8);
  }, [attendanceList]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOAST ALERT */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* TOP BAR / NAVIGATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
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
              Back to Dashboard
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link href="/admin/students" className="hover:text-slate-600">
                Students
              </Link>
              <span>•</span>
              <Link href="/admin/admissions" className="hover:text-slate-600">
                Admissions
              </Link>
              <span>•</span>
              <Link href="/admin/fees" className="hover:text-slate-600">
                Fees
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition disabled:opacity-50"
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
              Refresh Data
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
              Attendance
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
              Manage daily student attendance and attendance records.
            </p>
          </div>

          {/* DATE SELECTOR & QUICK ACTIONS */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Selected Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
            </div>

            <div className="pt-4 sm:pt-0">
              <button
                onClick={handleMarkAllPresent}
                disabled={isBulkMarking || loading || filteredStudents.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {isBulkMarking ? "Marking All..." : "Mark All Present"}
              </button>
            </div>
          </div>
        </div>

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Active
            </span>
            <span className="text-xl font-black text-slate-800 mt-1 block">
              {stats.total}
            </span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Present
            </span>
            <span className="text-xl font-black text-emerald-700 mt-1 block">
              {stats.present}
            </span>
          </div>

          <div className="bg-rose-50/60 border border-rose-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
              Absent
            </span>
            <span className="text-xl font-black text-rose-700 mt-1 block">
              {stats.absent}
            </span>
          </div>

          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Late
            </span>
            <span className="text-xl font-black text-amber-700 mt-1 block">
              {stats.late}
            </span>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">
              Leave
            </span>
            <span className="text-xl font-black text-[#0057B8] mt-1 block">
              {stats.leave}
            </span>
          </div>

          <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Attendance %
            </span>
            <span className="text-xl font-black text-[#F7931E] mt-1 block">
              {stats.percentage}%
            </span>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search student name, ID, mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8] transition-all"
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

            {/* Class Filter */}
            <div>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All Classes">All Classes</option>
                <option value="Class 6">Class 6</option>
                <option value="Class 7">Class 7</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
              </select>
            </div>

            {/* Batch Filter */}
            <div>
              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All Batches">All Batches</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN ATTENDANCE TABLE */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">
              Loading attendance records...
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
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No active students found.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No active student records match the current filters or query.
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
                      <th className="py-3.5 px-4">Student ID</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Class</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4 text-center">Status Action</th>
                      <th className="py-3.5 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((student) => {
                      const sId = student.studentId || student.docId;
                      const key = sId.trim().toLowerCase();
                      const att = attendanceForSelectedDateMap.get(key);
                      const currentStatus = att?.status
                        ? att.status.toLowerCase()
                        : "not_marked";
                      const currentRemark = att?.remarks || "";
                      const isUpdating = updatingStudentId === sId;

                      return (
                        <tr
                          key={student.docId}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {sId}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {student.fullName || student.name || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {student.academicClass || student.class || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {student.batchName || student.batch || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Present */}
                              <button
                                onClick={() =>
                                  handleMarkAttendance(student, "present")
                                }
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "present"
                                    ? "bg-emerald-600 text-white shadow-md scale-105"
                                    : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700"
                                }`}
                              >
                                Present
                              </button>

                              {/* Absent */}
                              <button
                                onClick={() =>
                                  handleMarkAttendance(student, "absent")
                                }
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "absent"
                                    ? "bg-rose-600 text-white shadow-md scale-105"
                                    : "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700"
                                }`}
                              >
                                Absent
                              </button>

                              {/* Late */}
                              <button
                                onClick={() =>
                                  handleMarkAttendance(student, "late")
                                }
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "late"
                                    ? "bg-amber-500 text-white shadow-md scale-105"
                                    : "bg-slate-100 hover:bg-amber-50 text-slate-600 hover:text-amber-700"
                                }`}
                              >
                                Late
                              </button>

                              {/* Leave */}
                              <button
                                onClick={() =>
                                  handleMarkAttendance(student, "leave")
                                }
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  currentStatus === "leave"
                                    ? "bg-[#0057B8] text-white shadow-md scale-105"
                                    : "bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-[#0057B8]"
                                }`}
                              >
                                Leave
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500 truncate max-w-[140px] text-[11px]">
                                {currentRemark || "—"}
                              </span>
                              <button
                                onClick={() => {
                                  setRemarkModalStudent({
                                    studentId: sId,
                                    studentName:
                                      student.fullName ||
                                      student.name ||
                                      "—",
                                    currentRemark,
                                  });
                                  setTempRemark(currentRemark);
                                }}
                                className="p-1 text-slate-400 hover:text-[#0057B8] rounded hover:bg-slate-100 transition"
                                title="Edit Remark"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
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

            {/* MOBILE & TABLET CARD VIEW */}
            <div className="block lg:hidden space-y-3">
              {filteredStudents.map((student) => {
                const sId = student.studentId || student.docId;
                const key = sId.trim().toLowerCase();
                const att = attendanceForSelectedDateMap.get(key);
                const currentStatus = att?.status
                  ? att.status.toLowerCase()
                  : "not_marked";
                const currentRemark = att?.remarks || "";
                const isUpdating = updatingStudentId === sId;

                return (
                  <div
                    key={student.docId}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        ID: {sId}
                      </span>
                      <span className="text-xs text-slate-400">
                        {student.academicClass || student.class || "—"} •{" "}
                        {student.batchName || student.batch || "—"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-800">
                        {student.fullName || student.name || "—"}
                      </h4>
                      {currentRemark && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full truncate max-w-[120px]">
                          💬 {currentRemark}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <button
                        onClick={() =>
                          handleMarkAttendance(student, "present")
                        }
                        disabled={isUpdating}
                        className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                          currentStatus === "present"
                            ? "bg-emerald-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student, "absent")}
                        disabled={isUpdating}
                        className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                          currentStatus === "absent"
                            ? "bg-rose-600 text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student, "late")}
                        disabled={isUpdating}
                        className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                          currentStatus === "late"
                            ? "bg-amber-500 text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Late
                      </button>

                      <button
                        onClick={() => handleMarkAttendance(student, "leave")}
                        disabled={isUpdating}
                        className={`py-2 rounded-xl text-xs font-bold text-center transition-all ${
                          currentStatus === "leave"
                            ? "bg-[#0057B8] text-white shadow-md"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        Leave
                      </button>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          setRemarkModalStudent({
                            studentId: sId,
                            studentName:
                              student.fullName || student.name || "—",
                            currentRemark,
                          });
                          setTempRemark(currentRemark);
                        }}
                        className="text-[11px] font-semibold text-[#0057B8] hover:underline"
                      >
                        {currentRemark ? "Edit Remark" : "+ Add Remark"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* RECENT ATTENDANCE ACTIVITY LOGS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
            Recent Attendance Activity
          </h3>

          {recentAttendanceLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No recent attendance entries recorded.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentAttendanceLogs.map((log) => {
                const stLower = (log.status || "").toLowerCase();
                return (
                  <div
                    key={log.docId}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">
                        {log.studentName || log.studentId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                          stLower === "present"
                            ? "bg-emerald-100 text-emerald-800"
                            : stLower === "absent"
                            ? "bg-rose-100 text-rose-800"
                            : stLower === "late"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Date: {formatDateDisplay(log.date)}</span>
                      {log.batch && <span>{log.batch}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD / EDIT REMARK */}
      {remarkModalStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 relative my-auto">
            <button
              onClick={() => setRemarkModalStudent(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div>
              <h3 className="text-base font-bold text-[#0057B8]">
                Attendance Remark
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                For {remarkModalStudent.studentName} ({remarkModalStudent.studentId})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Remark / Note
              </label>
              <input
                type="text"
                value={tempRemark}
                onChange={(e) => setTempRemark(e.target.value)}
                placeholder="e.g. Medical leave, Arrived late, Parent informed..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setRemarkModalStudent(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRemark}
                className="px-5 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                Save Remark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}