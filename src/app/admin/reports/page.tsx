"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================
// TYPES
// ============================================================

export interface StudentRecord {
  id: string;
  docId?: string;
  studentId?: string;
  name?: string;
  fullName?: string;
  studentName?: string;
  status?: string;
  program?: string;
  course?: string;
  createdAt?: unknown;
}

export interface AdmissionRecord {
  id: string;
  docId?: string;
  applicationNo?: string;
  status?: string;
  program?: string;
  createdAt?: unknown;
  admissionDate?: unknown;
  date?: unknown;
}

export interface CourseRecord {
  id: string;
  docId?: string;
  courseId?: string;
  name?: string;
  title?: string;
  fee?: unknown;
  tuitionFee?: unknown;
  registrationFee?: unknown;
  totalFee?: unknown;
  seats?: unknown;
  totalSeats?: unknown;
  availableSeats?: unknown;
  status?: string;
  createdAt?: unknown;
}

export interface FeeRecord {
  id: string;
  docId?: string;

  studentId?: string;
  studentName?: string;
  name?: string;

  courseId?: string;
  course?: string;
  program?: string;

  amount?: unknown;
  fee?: unknown;
  totalFee?: unknown;

  paid?: unknown;
  paidAmount?: unknown;
  amountPaid?: unknown;

  pending?: unknown;
  pendingAmount?: unknown;
  dueAmount?: unknown;

  registrationFee?: unknown;
  discount?: unknown;
  finalFee?: unknown;

  paymentStatus?: string;
  status?: string;

  dueDate?: unknown;
  createdAt?: unknown;
  paymentDate?: unknown;
}

export interface AttendanceRecord {
  id: string;
  docId?: string;
  studentId?: string;
  status?: string;
  attendance?: string;
  present?: unknown;
  date?: unknown;
  createdAt?: unknown;
}

// ============================================================
// PAGE
// ============================================================

export default function AdminReportsPage() {
  // ----------------------------------------------------------
  // STATE
  // ----------------------------------------------------------

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [periodFilter, setPeriodFilter] = useState<string>("All Time");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  const toNumber = (value: unknown): number => {
    if (value === undefined || value === null || value === "") {
      return 0;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      const cleaned = value.replace(/[₹,\s]/g, "");
      const num = Number(cleaned);
      return Number.isFinite(num) ? num : 0;
    }

    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const parseDateToMillis = (dateVal: unknown): number => {
    if (!dateVal) return 0;

    if (dateVal instanceof Timestamp) {
      return dateVal.toMillis();
    }

    if (
      typeof (dateVal as { toMillis?: () => number })?.toMillis ===
      "function"
    ) {
      return (dateVal as { toMillis: () => number }).toMillis();
    }

    if (dateVal instanceof Date) {
      return dateVal.getTime();
    }

    if (typeof dateVal === "number") {
      return dateVal;
    }

    if (typeof dateVal === "string") {
      const parsed = new Date(dateVal).getTime();
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  // ----------------------------------------------------------
  // GET REAL FEE VALUES
  // ----------------------------------------------------------

  const getExpectedFee = (fee: FeeRecord): number => {
    return toNumber(
      fee.finalFee ??
        fee.totalFee ??
        fee.fee ??
        fee.amount
    );
  };

  const getPaidFee = (fee: FeeRecord): number => {
    return toNumber(
      fee.paidAmount ??
        fee.paid ??
        fee.amountPaid
    );
  };

  const getPendingFee = (fee: FeeRecord): number => {
    const explicitlySavedPending = toNumber(
      fee.pendingAmount ??
        fee.pending ??
        fee.dueAmount
    );

    if (explicitlySavedPending > 0) {
      return explicitlySavedPending;
    }

    const expected = getExpectedFee(fee);
    const paid = getPaidFee(fee);

    return Math.max(0, expected - paid);
  };

  // ----------------------------------------------------------
  // FETCH FIRESTORE DATA
  // ----------------------------------------------------------

  const fetchAllCollections = async () => {
    setLoading(true);
    setError(null);

    try {
      const safeFetch = async <T,>(
        collectionName: string
      ): Promise<T[]> => {
        try {
          const snap = await getDocs(
            collection(db, collectionName)
          );

          return snap.docs.map((docSnap) => ({
            id: docSnap.id,
            docId: docSnap.id,
            ...docSnap.data(),
          })) as T[];
        } catch (err) {
          console.warn(
            `Collection [${collectionName}] could not be loaded:`,
            err
          );

          return [];
        }
      };

      const [
        studentsData,
        admissionsData,
        coursesData,
        feesData,
        attendanceData,
      ] = await Promise.all([
        safeFetch<StudentRecord>("students"),
        safeFetch<AdmissionRecord>("admissions"),
        safeFetch<CourseRecord>("courses"),
        safeFetch<FeeRecord>("fees"),
        safeFetch<AttendanceRecord>("attendance"),
      ]);

      setStudents(studentsData);
      setAdmissions(admissionsData);
      setCourses(coursesData);
      setFees(feesData);
      setAttendance(attendanceData);
    } catch (err) {
      console.error(
        "Critical error fetching report data:",
        err
      );

      setError(
        "Unable to load report data from database. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCollections();
  }, []);

  // ----------------------------------------------------------
  // PERIOD FILTER
  // ----------------------------------------------------------

  const isWithinPeriod = (rawDate: unknown): boolean => {
    if (periodFilter === "All Time") {
      return true;
    }

    const millis = parseDateToMillis(rawDate);

    // Keep legacy records without dates visible.
    if (!millis) {
      return true;
    }

    const targetDate = new Date(millis);
    const now = new Date();

    if (periodFilter === "This Month") {
      return (
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
      );
    }

    if (periodFilter === "Last Month") {
      const lastMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );

      return (
        targetDate.getMonth() === lastMonth.getMonth() &&
        targetDate.getFullYear() ===
          lastMonth.getFullYear()
      );
    }

    if (periodFilter === "This Year") {
      return (
        targetDate.getFullYear() === now.getFullYear()
      );
    }

    if (periodFilter === "Custom") {
      const startMillis = customStartDate
        ? new Date(customStartDate).getTime()
        : 0;

      const endMillis = customEndDate
        ? new Date(customEndDate).setHours(
            23,
            59,
            59,
            999
          )
        : Infinity;

      return (
        millis >= startMillis &&
        millis <= endMillis
      );
    }

    return true;
  };

  // ----------------------------------------------------------
  // FILTERED DATA
  // ----------------------------------------------------------

  const filteredStudents = useMemo(
    () =>
      students.filter((student) =>
        isWithinPeriod(student.createdAt)
      ),
    [
      students,
      periodFilter,
      customStartDate,
      customEndDate,
    ]
  );

  const filteredAdmissions = useMemo(
    () =>
      admissions.filter((admission) =>
        isWithinPeriod(
          admission.createdAt ||
            admission.admissionDate ||
            admission.date
        )
      ),
    [
      admissions,
      periodFilter,
      customStartDate,
      customEndDate,
    ]
  );

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const search = searchTerm
          .toLowerCase()
          .trim();

        if (!search) return true;

        const name =
          course.name ||
          course.title ||
          "";

        const courseId =
          course.courseId ||
          course.id ||
          "";

        return (
          name.toLowerCase().includes(search) ||
          courseId.toLowerCase().includes(search)
        );
      }),
    [courses, searchTerm]
  );

  const filteredFees = useMemo(
    () =>
      fees.filter((fee) =>
        isWithinPeriod(
          fee.paymentDate || fee.createdAt
        )
      ),
    [
      fees,
      periodFilter,
      customStartDate,
      customEndDate,
    ]
  );

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((att) =>
        isWithinPeriod(
          att.createdAt || att.date
        )
      ),
    [
      attendance,
      periodFilter,
      customStartDate,
      customEndDate,
    ]
  );

  // ----------------------------------------------------------
  // STUDENT STATS
  // ----------------------------------------------------------

  const studentStats = useMemo(() => {
    const total = filteredStudents.length;

    let active = 0;
    let inactive = 0;

    filteredStudents.forEach((student) => {
      const status = (
        student.status || "active"
      )
        .toLowerCase()
        .trim();

      if (
        status === "active" ||
        status === "enrolled"
      ) {
        active++;
      } else if (
        status === "inactive" ||
        status === "disabled"
      ) {
        inactive++;
      } else {
        active++;
      }
    });

    return {
      total,
      active,
      inactive,
    };
  }, [filteredStudents]);

  // ----------------------------------------------------------
  // ADMISSION STATS
  // ----------------------------------------------------------

  const admissionStats = useMemo(() => {
    const total = filteredAdmissions.length;

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let cancelled = 0;

    filteredAdmissions.forEach((admission) => {
      const status = (
        admission.status || "pending"
      )
        .toLowerCase()
        .trim();

      if (status === "approved") {
        approved++;
      } else if (status === "rejected") {
        rejected++;
      } else if (status === "cancelled") {
        cancelled++;
      } else {
        pending++;
      }
    });

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
    };
  }, [filteredAdmissions]);

  // ==========================================================
  // REAL FEE STATS
  // ==========================================================

  const feeStats = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;

    filteredFees.forEach((fee) => {
      const expected = getExpectedFee(fee);
      const paid = getPaidFee(fee);
      const pending = getPendingFee(fee);

      totalExpected += expected;
      totalCollected += paid;
      totalPending += pending;
    });

    const percentage =
      totalExpected > 0
        ? Math.min(
            100,
            Math.round(
              (totalCollected /
                totalExpected) *
                1000
            ) / 10
          )
        : 0;

    return {
      totalExpected,
      totalCollected,
      totalPending,
      percentage,
      totalFeeRecords: filteredFees.length,
    };
  }, [filteredFees]);

  // ----------------------------------------------------------
  // PAYMENT STATUS STATS
  // ----------------------------------------------------------

  const paymentStatusStats = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;

    filteredFees.forEach((fee) => {
      const expected = getExpectedFee(fee);
      const collected = getPaidFee(fee);
      const due = getPendingFee(fee);

      const status = (
        fee.paymentStatus ||
        fee.status ||
        ""
      )
        .toLowerCase()
        .trim();

      if (
        status === "paid" ||
        (expected > 0 && due === 0)
      ) {
        paid++;
      } else if (
        status === "partial" ||
        status === "partially paid" ||
        (collected > 0 && due > 0)
      ) {
        partial++;
      } else {
        pending++;
      }
    });

    return {
      paid,
      partial,
      pending,
    };
  }, [filteredFees]);

  // ----------------------------------------------------------
  // ATTENDANCE
  // ----------------------------------------------------------

  const attendanceStats = useMemo(() => {
    const totalRecords =
      filteredAttendance.length;

    let present = 0;
    let absent = 0;
    let late = 0;

    filteredAttendance.forEach((att) => {
      const status = (
        att.status ||
        att.attendance ||
        ""
      )
        .toLowerCase()
        .trim();

      if (
        status === "present" ||
        att.present === true ||
        att.present === 1
      ) {
        present++;
      } else if (
        status === "absent" ||
        att.present === false ||
        att.present === 0
      ) {
        absent++;
      } else if (status === "late") {
        late++;
      } else if (status) {
        absent++;
      }
    });

    const avgPercentage =
      totalRecords > 0
        ? Math.round(
            (present / totalRecords) * 100
          )
        : 0;

    return {
      totalRecords,
      present,
      absent,
      late,
      avgPercentage,
    };
  }, [filteredAttendance]);

  // ----------------------------------------------------------
  // COURSE PERFORMANCE
  // ----------------------------------------------------------

  const coursePerformanceList = useMemo(() => {
    return filteredCourses.map((course) => {
      const totalSeats = toNumber(
        course.totalSeats ||
          course.seats
      );

      const availableSeats = toNumber(
        course.availableSeats
      );

      const occupiedSeats = Math.max(
        0,
        totalSeats - availableSeats
      );

      const courseFee = toNumber(
        course.totalFee ||
          course.fee ||
          course.tuitionFee
      );

      return {
        id: course.id,
        courseId:
          course.courseId ||
          course.id,
        name:
          course.name ||
          course.title ||
          "Untitled Course",
        totalSeats,
        availableSeats,
        occupiedSeats,
        courseFee,
        status: (
          course.status || "active"
        ).toLowerCase(),
      };
    });
  }, [filteredCourses]);

  // ----------------------------------------------------------
  // INSIGHTS
  // ----------------------------------------------------------

  const insights = useMemo(() => {
    const list: string[] = [];

    if (coursePerformanceList.length > 0) {
      const sortedByOccupied = [
        ...coursePerformanceList,
      ].sort(
        (a, b) =>
          b.occupiedSeats -
          a.occupiedSeats
      );

      if (
        sortedByOccupied[0] &&
        sortedByOccupied[0].occupiedSeats > 0
      ) {
        list.push(
          `Highest enrollment is in "${sortedByOccupied[0].name}" with ${sortedByOccupied[0].occupiedSeats} occupied seats.`
        );
      }

      const sortedByAvailable = [
        ...coursePerformanceList,
      ].sort(
        (a, b) =>
          b.availableSeats -
          a.availableSeats
      );

      if (
        sortedByAvailable[0] &&
        sortedByAvailable[0].availableSeats > 0
      ) {
        list.push(
          `Highest seat availability is in "${sortedByAvailable[0].name}" with ${sortedByAvailable[0].availableSeats} seats open.`
        );
      }
    }

    // REAL FEE INSIGHT
    if (feeStats.totalExpected > 0) {
      list.push(
        `Real fee collection is ${feeStats.percentage}% — ${formatCurrency(
          feeStats.totalCollected
        )} collected from ${formatCurrency(
          feeStats.totalExpected
        )} expected.`
      );
    } else {
      list.push(
        "No real fee records with payable amounts were found for the selected period."
      );
    }

    if (feeStats.totalPending > 0) {
      list.push(
        `${formatCurrency(
          feeStats.totalPending
        )} remains outstanding across the loaded fee records.`
      );
    }

    if (admissionStats.total > 0) {
      const approvalRate = Math.round(
        (admissionStats.approved /
          admissionStats.total) *
          100
      );

      list.push(
        `Admission approval rate is ${approvalRate}% (${admissionStats.approved} approved, ${admissionStats.pending} pending).`
      );
    }

    if (attendanceStats.totalRecords > 0) {
      list.push(
        `Overall average student attendance is ${attendanceStats.avgPercentage}%.`
      );
    }

    return list;
  }, [
    coursePerformanceList,
    feeStats,
    admissionStats,
    attendanceStats,
  ]);

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const handleExportCSV = () => {
    const csvRows = [
      ["VEEZNA ADMIN SYSTEM REPORT & ANALYTICS"],
      ["Report Period", periodFilter],
      [
        "Generated On",
        new Date().toLocaleString("en-IN"),
      ],
      [""],

      ["FEE SUMMARY"],
      [
        "Total Expected Fees (₹)",
        feeStats.totalExpected,
      ],
      [
        "Total Collected Fees (₹)",
        feeStats.totalCollected,
      ],
      [
        "Total Pending Fees (₹)",
        feeStats.totalPending,
      ],
      [
        "Collection Rate (%)",
        `${feeStats.percentage}%`,
      ],
      [
        "Fee Records",
        feeStats.totalFeeRecords,
      ],
      ["Paid Records", paymentStatusStats.paid],
      [
        "Partial Records",
        paymentStatusStats.partial,
      ],
      [
        "Pending Records",
        paymentStatusStats.pending,
      ],

      [""],

      ["STUDENT SUMMARY"],
      ["Total Students", studentStats.total],
      ["Active Students", studentStats.active],
      [
        "Inactive Students",
        studentStats.inactive,
      ],

      [""],

      ["ADMISSION SUMMARY"],
      [
        "Total Admissions",
        admissionStats.total,
      ],
      [
        "Approved Admissions",
        admissionStats.approved,
      ],
      [
        "Pending Admissions",
        admissionStats.pending,
      ],
      [
        "Rejected Admissions",
        admissionStats.rejected,
      ],

      [""],

      ["ATTENDANCE SUMMARY"],
      [
        "Average Attendance (%)",
        `${attendanceStats.avgPercentage}%`,
      ],
      [
        "Total Attendance Records",
        attendanceStats.totalRecords,
      ],
      [
        "Present",
        attendanceStats.present,
      ],
      [
        "Absent",
        attendanceStats.absent,
      ],
      ["Late", attendanceStats.late],

      [""],

      ["COURSE PERFORMANCE"],
      [
        "Course ID",
        "Course Name",
        "Total Seats",
        "Available Seats",
        "Occupied Seats",
        "Course Fee (₹)",
        "Status",
      ],

      ...coursePerformanceList.map(
        (course) => [
          `"${course.courseId}"`,
          `"${course.name.replace(
            /"/g,
            '""'
          )}"`,
          course.totalSeats,
          course.availableSeats,
          course.occupiedSeats,
          course.courseFee,
          course.status,
        ]
      ),

      [""],

      ["REAL FEE RECORDS"],
      [
        "Student",
        "Student ID",
        "Course",
        "Expected Fee (₹)",
        "Paid (₹)",
        "Pending (₹)",
        "Payment Status",
      ],

      ...filteredFees.map((fee) => [
        `"${(
          fee.studentName ||
          fee.name ||
          ""
        ).replace(/"/g, '""')}"`,

        `"${fee.studentId || ""}"`,

        `"${(
          fee.course ||
          fee.program ||
          ""
        ).replace(/"/g, '""')}"`,

        getExpectedFee(fee),

        getPaidFee(fee),

        getPendingFee(fee),

        fee.paymentStatus ||
          fee.status ||
          "Pending",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      csvRows
        .map((row) =>
          row.join(",")
        )
        .join("\n");

    const encodedUri =
      encodeURI(csvContent);

    const link =
      document.createElement("a");

    link.setAttribute(
      "href",
      encodedUri
    );

    link.setAttribute(
      "download",
      `Veezna_Admin_Report_${
        new Date()
          .toISOString()
          .split("T")[0]
      }.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOP BAR */}
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

              <Link
                href="/admin/students"
                className="hover:text-slate-600"
              >
                Students
              </Link>

              <span>•</span>

              <Link
                href="/admin/admissions"
                className="hover:text-slate-600"
              >
                Admissions
              </Link>

              <span>•</span>

              <Link
                href="/admin/fees"
                className="hover:text-slate-600"
              >
                Fees
              </Link>

              <span>•</span>

              <Link
                href="/admin/attendance"
                className="hover:text-slate-600"
              >
                Attendance
              </Link>

              <span>•</span>

              <Link
                href="/admin/courses"
                className="hover:text-slate-600"
              >
                Courses
              </Link>

            </div>
          </div>

          <div className="flex items-center gap-3">

            <button
              onClick={fetchAllCollections}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${
                  loading
                    ? "animate-spin"
                    : ""
                }`}
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
              onClick={handleExportCSV}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all disabled:opacity-50"
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
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>

              Export CSV Report
            </button>

          </div>
        </div>

        {/* HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
              Reports & Analytics
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
              Real-time overview of Veezna students,
              admissions, fees, attendance and courses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Report Period
              </label>

              <select
                value={periodFilter}
                onChange={(e) =>
                  setPeriodFilter(
                    e.target.value
                  )
                }
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All Time">
                  All Time
                </option>

                <option value="This Month">
                  This Month
                </option>

                <option value="Last Month">
                  Last Month
                </option>

                <option value="This Year">
                  This Year
                </option>

                <option value="Custom">
                  Custom Date Range
                </option>
              </select>
            </div>

            {periodFilter === "Custom" && (
              <div className="flex items-center gap-2 pt-4 md:pt-0">

                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) =>
                    setCustomStartDate(
                      e.target.value
                    )
                  }
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />

                <span className="text-slate-400 text-xs">
                  to
                </span>

                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) =>
                    setCustomEndDate(
                      e.target.value
                    )
                  }
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />

              </div>
            )}

          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">

            <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />

            <p className="text-xs text-slate-500 font-medium">
              Loading reports...
            </p>

          </div>
        ) : error ? (

          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-200 shadow-sm text-rose-700 space-y-3">

            <p className="text-sm font-medium">
              {error}
            </p>

            <button
              onClick={fetchAllCollections}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>

          </div>

        ) : (
          <>
            {/* ==================================================
                SUMMARY CARDS
            ================================================== */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

              {/* STUDENTS */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Students
                </span>

                <div className="flex items-baseline justify-between">

                  <span className="text-2xl font-black text-slate-800">
                    {studentStats.total}
                  </span>

                  <span className="text-xs font-semibold text-emerald-600">
                    {studentStats.active} Active
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">

                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${
                        studentStats.total > 0
                          ? (studentStats.active /
                              studentStats.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

                <span className="text-[11px] text-slate-400 block">
                  {studentStats.inactive} Inactive
                </span>

              </div>

              {/* ADMISSIONS */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Admissions
                </span>

                <div className="flex items-baseline justify-between">

                  <span className="text-2xl font-black text-[#0057B8]">
                    {admissionStats.total}
                  </span>

                  <span className="text-xs font-semibold text-amber-600">
                    {admissionStats.pending} Pending
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">

                  <div
                    className="bg-[#0057B8] h-full rounded-full"
                    style={{
                      width: `${
                        admissionStats.total > 0
                          ? (admissionStats.approved /
                              admissionStats.total) *
                            100
                          : 0
                      }%`,
                    }}
                  />

                </div>

                <span className="text-[11px] text-emerald-600 font-medium block">
                  {admissionStats.approved} Approved
                </span>

              </div>

              {/* REAL FEES */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Real Fee Collection
                </span>

                <div className="flex items-baseline justify-between">

                  <span className="text-2xl font-black text-emerald-700">
                    {feeStats.percentage}%
                  </span>

                  <span className="text-xs font-bold text-slate-600">
                    {formatCurrency(
                      feeStats.totalCollected
                    )}
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">

                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{
                      width: `${feeStats.percentage}%`,
                    }}
                  />

                </div>

                <span className="text-[11px] text-amber-600 block font-medium">
                  {formatCurrency(
                    feeStats.totalPending
                  )}{" "}
                  Pending
                </span>

              </div>

              {/* ATTENDANCE */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Average Attendance
                </span>

                <div className="flex items-baseline justify-between">

                  <span className="text-2xl font-black text-[#F7931E]">
                    {attendanceStats.avgPercentage}%
                  </span>

                  <span className="text-xs font-semibold text-slate-500">
                    {attendanceStats.totalRecords} Logs
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">

                  <div
                    className="bg-[#F7931E] h-full rounded-full"
                    style={{
                      width: `${attendanceStats.avgPercentage}%`,
                    }}
                  />

                </div>

                <span className="text-[11px] text-slate-400 block">
                  {attendanceStats.present} Present /{" "}
                  {attendanceStats.absent} Absent
                </span>

              </div>

              {/* COURSES */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-2">

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Courses & Availability
                </span>

                <div className="flex items-baseline justify-between">

                  <span className="text-2xl font-black text-slate-800">
                    {courses.length}
                  </span>

                  <span className="text-xs font-semibold text-blue-600">
                    {
                      courses.filter(
                        (course) =>
                          (
                            course.status ||
                            "active"
                          ).toLowerCase() ===
                          "active"
                      ).length
                    }{" "}
                    Active
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">

                  <div className="bg-blue-500 h-full rounded-full w-full" />

                </div>

                <span className="text-[11px] text-slate-400 block">
                  {coursePerformanceList.reduce(
                    (total, course) =>
                      total +
                      course.availableSeats,
                    0
                  )}{" "}
                  Open Seats
                </span>

              </div>

            </div>

            {/* ==================================================
                REAL FEE OVERVIEW
            ================================================== */}

            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">

              <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                <div>

                  <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2">

                    <span className="w-2 h-2 rounded-full bg-[#0057B8]" />

                    Real Fee Collection Overview

                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Based only on actual records stored in the
                    Firestore fees collection.
                  </p>

                </div>

                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                  {feeStats.totalFeeRecords} Records
                </span>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">

                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Total Expected
                  </span>

                  <span className="text-xl font-extrabold text-slate-800 mt-1 block">
                    {formatCurrency(
                      feeStats.totalExpected
                    )}
                  </span>

                </div>

                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">

                  <span className="text-[10px] font-bold uppercase text-emerald-600 block">
                    Total Collected
                  </span>

                  <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
                    {formatCurrency(
                      feeStats.totalCollected
                    )}
                  </span>

                </div>

                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">

                  <span className="text-[10px] font-bold uppercase text-amber-600 block">
                    Pending Dues
                  </span>

                  <span className="text-xl font-extrabold text-amber-700 mt-1 block">
                    {formatCurrency(
                      feeStats.totalPending
                    )}
                  </span>

                </div>

              </div>

              {/* PROGRESS */}

              <div className="space-y-1.5 pt-2">

                <div className="flex justify-between text-xs font-semibold">

                  <span className="text-slate-600">
                    Collection Progress
                  </span>

                  <span className="text-[#0057B8]">
                    {feeStats.percentage}%
                  </span>

                </div>

                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">

                  <div
                    className="bg-gradient-to-r from-[#0057B8] to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${feeStats.percentage}%`,
                    }}
                  />

                </div>

              </div>

              {/* PAYMENT STATUS */}

              <div className="grid grid-cols-3 gap-3 pt-2">

                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">

                  <span className="text-lg font-black text-emerald-700 block">
                    {paymentStatusStats.paid}
                  </span>

                  <span className="text-[10px] font-bold uppercase text-emerald-600">
                    Paid
                  </span>

                </div>

                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">

                  <span className="text-lg font-black text-blue-700 block">
                    {paymentStatusStats.partial}
                  </span>

                  <span className="text-[10px] font-bold uppercase text-blue-600">
                    Partial
                  </span>

                </div>

                <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">

                  <span className="text-lg font-black text-amber-700 block">
                    {paymentStatusStats.pending}
                  </span>

                  <span className="text-[10px] font-bold uppercase text-amber-600">
                    Pending
                  </span>

                </div>

              </div>

            </div>

            {/* ==================================================
                ADMISSION + ATTENDANCE
            ================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">

                <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2 border-b border-slate-100 pb-3">

                  <span className="w-2 h-2 rounded-full bg-[#0057B8]" />

                  Admission Overview

                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Total
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {admissionStats.total}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <span className="text-[9px] font-bold uppercase text-amber-600 block">
                      Pending
                    </span>
                    <span className="text-lg font-bold text-amber-700">
                      {admissionStats.pending}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[9px] font-bold uppercase text-emerald-600 block">
                      Approved
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {admissionStats.approved}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                    <span className="text-[9px] font-bold uppercase text-rose-600 block">
                      Rejected
                    </span>
                    <span className="text-lg font-bold text-rose-700">
                      {admissionStats.rejected}
                    </span>
                  </div>

                </div>

              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">

                <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2 border-b border-slate-100 pb-3">

                  <span className="w-2 h-2 rounded-full bg-[#0057B8]" />

                  Attendance Overview

                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Total Logs
                    </span>
                    <span className="text-lg font-bold text-slate-800">
                      {attendanceStats.totalRecords}
                    </span>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <span className="text-[9px] font-bold uppercase text-emerald-600 block">
                      Present
                    </span>
                    <span className="text-lg font-bold text-emerald-700">
                      {attendanceStats.present}
                    </span>
                  </div>

                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                    <span className="text-[9px] font-bold uppercase text-rose-600 block">
                      Absent
                    </span>
                    <span className="text-lg font-bold text-rose-700">
                      {attendanceStats.absent}
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <span className="text-[9px] font-bold uppercase text-amber-600 block">
                      Late
                    </span>
                    <span className="text-lg font-bold text-amber-700">
                      {attendanceStats.late}
                    </span>
                  </div>

                </div>

              </div>

            </div>

            {/* ==================================================
                COURSE PERFORMANCE
            ================================================== */}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">

                <div>

                  <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2">

                    <span className="w-2 h-2 rounded-full bg-[#0057B8]" />

                    Course Performance & Occupancy

                  </h3>

                  <p className="text-xs text-slate-500 mt-0.5">
                    Track individual course capacity and enrollment.
                  </p>

                </div>

                <input
                  type="text"
                  placeholder="Search course..."
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(
                      e.target.value
                    )
                  }
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 max-w-xs"
                />

              </div>

              {coursePerformanceList.length ===
              0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  No course performance data available.
                </p>
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full text-left border-collapse text-xs">

                    <thead>

                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">

                        <th className="py-3 px-4">
                          Course ID
                        </th>

                        <th className="py-3 px-4">
                          Course Name
                        </th>

                        <th className="py-3 px-4">
                          Course Fee
                        </th>

                        <th className="py-3 px-4 text-center">
                          Total Seats
                        </th>

                        <th className="py-3 px-4 text-center">
                          Available
                        </th>

                        <th className="py-3 px-4 text-center">
                          Occupied
                        </th>

                        <th className="py-3 px-4 text-right">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {coursePerformanceList.map(
                        (course) => (
                          <tr
                            key={course.id}
                            className="hover:bg-slate-50/80 transition-colors"
                          >

                            <td className="py-3 px-4 font-mono font-bold text-slate-600">
                              {course.courseId}
                            </td>

                            <td className="py-3 px-4 font-bold text-slate-800">
                              {course.name}
                            </td>

                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {formatCurrency(
                                course.courseFee
                              )}
                            </td>

                            <td className="py-3 px-4 text-center font-medium">
                              {course.totalSeats}
                            </td>

                            <td className="py-3 px-4 text-center font-medium text-emerald-600">
                              {course.availableSeats}
                            </td>

                            <td className="py-3 px-4 text-center font-bold text-[#0057B8]">
                              {course.occupiedSeats}
                            </td>

                            <td className="py-3 px-4 text-right">

                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                  course.status ===
                                  "active"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {course.status}
                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* ==================================================
                REAL FEE RECORDS
            ================================================== */}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">

              <div className="border-b border-slate-100 pb-4">

                <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2">

                  <span className="w-2 h-2 rounded-full bg-emerald-500" />

                  Real Fee Records

                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Actual student-wise fees stored in Firestore.
                </p>

              </div>

              {filteredFees.length === 0 ? (

                <div className="py-8 text-center">

                  <p className="text-sm font-semibold text-slate-600">
                    No fee records found.
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Add actual student fees from the Fees module.
                  </p>

                </div>

              ) : (

                <div className="overflow-x-auto">

                  <table className="w-full text-left border-collapse text-xs">

                    <thead>

                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">

                        <th className="py-3 px-4">
                          Student
                        </th>

                        <th className="py-3 px-4">
                          Course
                        </th>

                        <th className="py-3 px-4 text-right">
                          Expected
                        </th>

                        <th className="py-3 px-4 text-right">
                          Paid
                        </th>

                        <th className="py-3 px-4 text-right">
                          Pending
                        </th>

                        <th className="py-3 px-4 text-right">
                          Status
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredFees.map(
                        (fee) => {

                          const expected =
                            getExpectedFee(
                              fee
                            );

                          const paid =
                            getPaidFee(
                              fee
                            );

                          const pending =
                            getPendingFee(
                              fee
                            );

                          const status =
                            (
                              fee.paymentStatus ||
                              fee.status ||
                              ""
                            )
                              .toLowerCase()
                              .trim();

                          const displayStatus =
                            status ||
                            (pending === 0
                              ? "paid"
                              : paid > 0
                              ? "partial"
                              : "pending");

                          return (
                            <tr
                              key={fee.id}
                              className="hover:bg-slate-50/80 transition-colors"
                            >

                              <td className="py-3 px-4">

                                <div className="font-bold text-slate-800">
                                  {fee.studentName ||
                                    fee.name ||
                                    "Unknown Student"}
                                </div>

                                {fee.studentId && (
                                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                    {fee.studentId}
                                  </div>
                                )}

                              </td>

                              <td className="py-3 px-4 font-medium text-slate-600">
                                {fee.course ||
                                  fee.program ||
                                  "—"}
                              </td>

                              <td className="py-3 px-4 text-right font-semibold text-slate-700">
                                {formatCurrency(
                                  expected
                                )}
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-emerald-700">
                                {formatCurrency(
                                  paid
                                )}
                              </td>

                              <td className="py-3 px-4 text-right font-bold text-amber-700">
                                {formatCurrency(
                                  pending
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">

                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                                    displayStatus ===
                                    "paid"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : displayStatus ===
                                        "partial"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                                >
                                  {displayStatus}
                                </span>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

            {/* ==================================================
                INSIGHTS
            ================================================== */}

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">

              <h3 className="text-base font-bold text-[#0057B8] flex items-center gap-2 border-b border-slate-100 pb-3">

                <span className="w-2 h-2 rounded-full bg-[#F7931E]" />

                Key System Observations

              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                {insights.map(
                  (insight, index) => (
                    <div
                      key={index}
                      className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex items-start gap-2.5"
                    >

                      <span className="text-[#F7931E] font-bold text-base leading-none">
                        ▪
                      </span>

                      <span className="text-slate-700 font-medium leading-relaxed">
                        {insight}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

          </>
        )}

      </div>
    </div>
  );
}