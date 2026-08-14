"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentProgress, VLSModule, VLSLesson } from "@/types/vls";

export interface StudentProgressRow {
  studentId: string;
  name: string;
  mobile: string;
  courseId: string;
  completedCount: number;
  totalCount: number;
  percentage: number;
  lastAccessedLessonId?: string;
  updatedAt?: string;
}

export default function AdminVLSProgressPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [students, setStudents] = useState<any[]>([]);
  const [progressRecords, setProgressRecords] = useState<StudentProgress[]>([]);
  const [lessons, setLessons] = useState<VLSLesson[]>([]);
  const [modules, setModules] = useState<VLSModule[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgressData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Courses
      const courseSnap = await getDocs(collection(db, "courses"));
      const courseList: any[] = [];
      courseSnap.forEach((d) => {
        const data = d.data();
        courseList.push({
          id: d.id,
          courseId: data.courseId || d.id,
          title: data.title || data.name || "Untitled Course",
        });
      });
      setCourses(courseList);

      // 2. Fetch Students
      let studentSnap;
      try {
        studentSnap = await getDocs(collection(db, "students"));
      } catch {
        studentSnap = await getDocs(collection(db, "users"));
      }
      const studentList: any[] = [];
      studentSnap.forEach((d) => {
        const data = d.data();
        studentList.push({
          id: d.id,
          studentId: data.studentId || data.regNo || d.id,
          name: data.fullName || data.name || "Unnamed Student",
          mobile: data.mobile || data.phone || "N/A",
        });
      });
      setStudents(studentList);

     // 3. Fetch Lessons
      const lessonSnap = await getDocs(collection(db, "lessons"));
      const lessonList: VLSLesson[] = [];
      lessonSnap.forEach((d) => {
        const data = d.data();
        lessonList.push({
          id: d.id,
          lessonId: data.lessonId || d.id,
          courseId: data.courseId,
          moduleId: data.moduleId,
          title: data.title || "Untitled Lesson",
          description: data.description || "",
          type: data.type || "video", // ✅ Added required 'type' property
          textContent: data.textContent || "",
          videoUrl: data.videoUrl || "",
          resourceUrl: data.resourceUrl || "",
          duration: data.duration || "",
          order: Number(data.order || 1),
          status: data.status || "published",
        });
      });
      setLessons(lessonList);
      // 4. Fetch Modules
      const moduleSnap = await getDocs(collection(db, "modules"));
      const moduleList: VLSModule[] = [];
      moduleSnap.forEach((d) => {
        const data = d.data();
        moduleList.push({
          id: d.id,
          moduleId: data.moduleId || d.id,
          courseId: data.courseId,
          title: data.title || "Untitled Module",
          order: Number(data.order || 1),
          status: data.status || "published",
        });
      });
      setModules(moduleList);

      // 5. Fetch Progress Collection
      const progressSnap = await getDocs(collection(db, "progress"));
      const progressList: StudentProgress[] = [];
      progressSnap.forEach((d) => {
        const data = d.data();
        progressList.push({
          id: d.id,
          progressId: data.progressId || d.id,
          studentId: data.studentId,
          courseId: data.courseId,
          completedLessonIds: Array.isArray(data.completedLessonIds)
            ? data.completedLessonIds
            : [],
          completionPercentage: Number(data.completionPercentage || 0),
          lastAccessedLessonId: data.lastAccessedLessonId || "",
          updatedAt: data.updatedAt,
        });
      });
      setProgressRecords(progressList);
    } catch (err: any) {
      console.error("Error loading VLS progress analytics:", err);
      setError("Unable to load student progress. " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  // Map and calculate real progress per student & course
  const progressRows = useMemo(() => {
    const rows: StudentProgressRow[] = [];

    progressRecords.forEach((pr) => {
      if (selectedCourseFilter !== "ALL" && pr.courseId !== selectedCourseFilter) return;

      const studentMatch = students.find(
        (s) =>
          s.studentId.toLowerCase() === pr.studentId.toLowerCase() ||
          s.id.toLowerCase() === pr.studentId.toLowerCase()
      );

      const courseLessons = lessons.filter((l) => l.courseId === pr.courseId);
      const totalCount = courseLessons.length || 1;
      const completedCount = pr.completedLessonIds.length;
      const percentage = Math.round((completedCount / totalCount) * 100);

      rows.push({
        studentId: pr.studentId,
        name: studentMatch ? studentMatch.name : pr.studentId,
        mobile: studentMatch ? studentMatch.mobile : "N/A",
        courseId: pr.courseId,
        completedCount,
        totalCount,
        percentage,
        lastAccessedLessonId: pr.lastAccessedLessonId,
      });
    });

    return rows.filter((r) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(term) ||
        r.studentId.toLowerCase().includes(term) ||
        r.courseId.toLowerCase().includes(term)
      );
    });
  }, [progressRecords, students, lessons, selectedCourseFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      {/* HEADER */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-[#0057B8] transition font-medium">
                ← Admin Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">VLS Student Progress</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Student Progress Analytics
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Track course completion percentages, completed lessons, and recent learning activity across enrolled students.
            </p>
          </div>
        </div>

        {/* SUBNAV */}
        <nav className="flex gap-2 border-b border-slate-200 pb-3 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/vls/curriculum"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
          >
            Curriculum Builder
          </Link>
          <Link
            href="/admin/vls/modules"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition"
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
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold"
          >
            Student Progress
          </Link>
        </nav>
      </header>

      {/* FILTER BAR */}
      <section className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by student name, student ID, or course ID..."
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
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* PROGRESS TABLE */}
      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : progressRows.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <p className="text-slate-500 text-sm font-medium">No student progress recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Course ID</th>
                  <th className="p-4">Completed Lessons</th>
                  <th className="p-4">Completion %</th>
                  <th className="p-4">Progress Visual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {progressRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{row.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{row.studentId}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">{row.courseId}</td>
                    <td className="p-4 font-medium text-slate-800">
                      {row.completedCount} / {row.totalCount} Lessons
                    </td>
                    <td className="p-4 font-extrabold text-[#0057B8]">{row.percentage}%</td>
                    <td className="p-4 w-48">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0057B8] h-full transition-all duration-500"
                          style={{ width: `${row.percentage}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}