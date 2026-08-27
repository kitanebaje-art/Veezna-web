"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  onAuthStateChanged,
  type User,
} from "firebase/auth";

import { db, auth } from "@/lib/firebase";

/* =========================================================
   TYPES
========================================================= */

export interface AdmissionApplication {
  id: string;

  applicationNo?: unknown;
  name?: unknown;
  fullName?: unknown;

  email?: unknown;
  mobile?: unknown;

  fatherName?: unknown;
  motherName?: unknown;
  dob?: unknown;
  gender?: unknown;
  address?: unknown;

  currentClass?: unknown;
  previousSchool?: unknown;
  board?: unknown;
  percentageGrade?: unknown;
  passingYear?: unknown;

  program?: unknown;
  programName?: unknown;

  batch?: unknown;
  selectedBatch?: unknown;

  duration?: unknown;

  fee?: unknown;
  status?: unknown;
  paymentStatus?: unknown;
  amount?: unknown;
  transactionId?: unknown;

  createdAt?: unknown;
  updatedAt?: unknown;
}

/* =========================================================
   SAFE HELPERS
========================================================= */

/**
 * Converts any Firestore value into a safe string.
 * Prevents errors such as:
 *
 * getProgram(...).toLowerCase is not a function
 */
const safeString = (value: unknown, fallback = ""): string => {
  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Handle common Firestore/object structures.
    const possibleValues = [
      obj.name,
      obj.title,
      obj.label,
      obj.programName,
      obj.value,
    ];

    for (const item of possibleValues) {
      if (
        typeof item === "string" ||
        typeof item === "number" ||
        typeof item === "boolean"
      ) {
        return String(item).trim();
      }
    }

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

/**
 * Converts values safely to lowercase.
 */
const safeLower = (value: unknown): string => {
  return safeString(value).toLowerCase();
};

/**
 * Safely parses dates from Firestore.
 */
const parseDateToMillis = (dateVal: unknown): number => {
  if (!dateVal) return 0;

  if (dateVal instanceof Timestamp) {
    return dateVal.toMillis();
  }

  if (dateVal instanceof Date) {
    return dateVal.getTime();
  }

  if (
    typeof dateVal === "object" &&
    dateVal !== null &&
    "toMillis" in dateVal &&
    typeof (dateVal as { toMillis?: unknown }).toMillis === "function"
  ) {
    try {
      return (dateVal as { toMillis: () => number }).toMillis();
    } catch {
      return 0;
    }
  }

  if (typeof dateVal === "string") {
    const parsed = new Date(dateVal).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof dateVal === "number") {
    return dateVal;
  }

  return 0;
};

/**
 * Formats a date safely.
 */
const formatDate = (dateVal: unknown): string => {
  const millis = parseDateToMillis(dateVal);

  if (!millis) return "—";

  return new Date(millis).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Normalizes admission status.
 */
const normalizeStatus = (
  status: unknown
): "pending" | "approved" | "rejected" => {
  const lower = safeLower(status);

  if (lower === "approved") return "approved";
  if (lower === "rejected") return "rejected";

  return "pending";
};

/**
 * Normalizes payment status.
 */
const normalizePayment = (
  status: unknown
): "paid" | "pending" | "failed" => {
  const lower = safeLower(status);

  if (lower === "paid") return "paid";
  if (lower === "failed") return "failed";

  return "pending";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AdminAdmissionsPage() {
  const router = useRouter();

  /* -------------------------------------------------------
     AUTH STATE
  ------------------------------------------------------- */

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  /* -------------------------------------------------------
     APPLICATION STATE
  ------------------------------------------------------- */

  const [applications, setApplications] = useState<
    AdmissionApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  /* -------------------------------------------------------
     FILTERS
  ------------------------------------------------------- */

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [programFilter, setProgramFilter] = useState("All");

  /* -------------------------------------------------------
     SELECTED APPLICATION
  ------------------------------------------------------- */

  const [selectedApp, setSelectedApp] =
    useState<AdmissionApplication | null>(null);

  /* =======================================================
     AUTHENTICATION GUARD
  ======================================================= */

  useEffect(() => {
    setAuthLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        setApplications([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /* =======================================================
     FETCH APPLICATIONS
  ======================================================= */

  const fetchApplications = async () => {
    /**
     * VERY IMPORTANT:
     * Never query Firestore before authentication.
     */
    if (!user) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const admissionsRef = collection(db, "admissions");

      let snapshot;

      try {
        const q = query(
          admissionsRef,
          orderBy("createdAt", "desc")
        );

        snapshot = await getDocs(q);
      } catch (orderError) {
        console.warn(
          "Ordered admissions query failed. Using fallback query.",
          orderError
        );

        snapshot = await getDocs(admissionsRef);
      }

      const appsList: AdmissionApplication[] = snapshot.docs.map(
        (docSnap) => {
          const data = docSnap.data();

          return {
            id: docSnap.id,
            ...data,
          } as AdmissionApplication;
        }
      );

      /**
       * Client-side safe sorting.
       */
      appsList.sort((a, b) => {
        const timeA = parseDateToMillis(a.createdAt);
        const timeB = parseDateToMillis(b.createdAt);

        return timeB - timeA;
      });

      setApplications(appsList);
    } catch (err: unknown) {
      console.error(
        "Error fetching admission applications:",
        err
      );

      const message =
        err instanceof Error ? err.message : "";

      if (
        message.toLowerCase().includes("permission") ||
        message.toLowerCase().includes("unauthenticated")
      ) {
        setError(
          "You are not authorized to view admission applications."
        );
      } else {
        setError(
          "Unable to load admission applications. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     FETCH AFTER AUTH IS CONFIRMED
  ======================================================= */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    fetchApplications();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast = (message: string) => {
    setToastMessage(message);

    window.setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  /* =======================================================
     SAFE FIELD GETTERS
  ======================================================= */

  const getStudentName = (
    app: AdmissionApplication
  ): string => {
    return (
      safeString(app.fullName) ||
      safeString(app.name) ||
      "—"
    );
  };

  const getProgram = (
    app: AdmissionApplication
  ): string => {
    /**
     * FIX FOR YOUR ERROR:
     *
     * Previously:
     * getProgram(app).toLowerCase()
     *
     * could fail when programName/program was an object.
     *
     * Now getProgram ALWAYS returns a string.
     */
    return (
      safeString(app.programName) ||
      safeString(app.program) ||
      "—"
    );
  };

  const getBatch = (
    app: AdmissionApplication
  ): string => {
    return (
      safeString(app.selectedBatch) ||
      safeString(app.batch) ||
      "—"
    );
  };

  /* =======================================================
     APPROVE
  ======================================================= */

  const handleApprove = async (docId: string) => {
    if (!user) {
      router.replace("/login");
      return;
    }

    setUpdatingId(docId);

    try {
      const docRef = doc(db, "admissions", docId);

      const isoNow = new Date().toISOString();

      await updateDoc(docRef, {
        status: "approved",
        updatedAt: isoNow,
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === docId
            ? {
                ...item,
                status: "approved",
                updatedAt: isoNow,
              }
            : item
        )
      );

      setSelectedApp((prev) =>
        prev && prev.id === docId
          ? {
              ...prev,
              status: "approved",
              updatedAt: isoNow,
            }
          : prev
      );

      showToast("Application approved successfully.");
    } catch (err) {
      console.error(
        "Error approving application:",
        err
      );

      alert(
        "Failed to approve application. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* =======================================================
     REJECT
  ======================================================= */

  const handleReject = async (docId: string) => {
    if (!user) {
      router.replace("/login");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to reject this admission application?"
    );

    if (!confirmed) return;

    setUpdatingId(docId);

    try {
      const docRef = doc(db, "admissions", docId);

      const isoNow = new Date().toISOString();

      await updateDoc(docRef, {
        status: "rejected",
        updatedAt: isoNow,
      });

      setApplications((prev) =>
        prev.map((item) =>
          item.id === docId
            ? {
                ...item,
                status: "rejected",
                updatedAt: isoNow,
              }
            : item
        )
      );

      setSelectedApp((prev) =>
        prev && prev.id === docId
          ? {
              ...prev,
              status: "rejected",
              updatedAt: isoNow,
            }
          : prev
      );

      showToast("Application rejected successfully.");
    } catch (err) {
      console.error(
        "Error rejecting application:",
        err
      );

      alert(
        "Failed to reject application. Please try again."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  /* =======================================================
     STATS
  ======================================================= */

  const stats = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    applications.forEach((app) => {
      const status = normalizeStatus(app.status);

      if (status === "approved") {
        approved++;
      } else if (status === "rejected") {
        rejected++;
      } else {
        pending++;
      }
    });

    return {
      total: applications.length,
      pending,
      approved,
      rejected,
    };
  }, [applications]);

  /* =======================================================
     FILTERED APPLICATIONS
  ======================================================= */

  const filteredApplications = useMemo(() => {
    const sTerm = searchTerm.toLowerCase().trim();

    const selectedProgram =
      programFilter.toLowerCase().trim();

    return applications.filter((app) => {
      /* Search */
      const name = safeLower(getStudentName(app));
      const appNo = safeLower(app.applicationNo);
      const mobile = safeLower(app.mobile);
      const email = safeLower(app.email);

      const matchesSearch =
        !sTerm ||
        name.includes(sTerm) ||
        appNo.includes(sTerm) ||
        mobile.includes(sTerm) ||
        email.includes(sTerm);

      /* Status */
      const status = normalizeStatus(app.status);

      const matchesStatus =
        statusFilter === "All" ||
        status === statusFilter.toLowerCase();

      /* Payment */
      const payment = normalizePayment(
        app.paymentStatus
      );

      const matchesPayment =
        paymentFilter === "All" ||
        payment === paymentFilter.toLowerCase();

      /* Program */
      const program = safeLower(getProgram(app));

      const matchesProgram =
        programFilter === "All" ||
        program.includes(selectedProgram);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPayment &&
        matchesProgram
      );
    });
  }, [
    applications,
    searchTerm,
    statusFilter,
    paymentFilter,
    programFilter,
  ]);

  /* =======================================================
     AUTH LOADING SCREEN
  ======================================================= */

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm font-semibold text-slate-700">
            Checking authentication...
          </p>

          <p className="text-xs text-slate-400 mt-1">
            Please wait
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     NOT AUTHENTICATED
  ======================================================= */

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <h2 className="text-lg font-bold text-slate-800">
            Login Required
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            Please login to access the admin admissions panel.
          </p>

          <button
            onClick={() => router.replace("/login")}
            className="mt-5 px-5 py-2.5 bg-[#0057B8] hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* TOAST */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-[100] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />

            <span className="text-sm font-medium">
              {toastMessage}
            </span>
          </div>
        )}

        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#0057B8] transition-colors"
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

          <div className="flex items-center gap-3">

            <button
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
            >
              <svg
                className={`w-3.5 h-3.5 ${
                  loading ? "animate-spin" : ""
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

            <Link
              href="/admin/students/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              + Add Student
            </Link>

          </div>
        </div>

        {/* HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
              Admissions
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review and manage student admission applications.
            </p>

            <p className="text-[11px] text-slate-400 mt-2">
              Logged in as: {safeString(user.email, "Admin")}
            </p>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total
              </span>

              <span className="text-lg font-bold text-slate-800">
                {stats.total}
              </span>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Pending
              </span>

              <span className="text-lg font-bold text-amber-700">
                {stats.pending}
              </span>
            </div>

            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Approved
              </span>

              <span className="text-lg font-bold text-emerald-700">
                {stats.approved}
              </span>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center min-w-[90px]">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-600">
                Rejected
              </span>

              <span className="text-lg font-bold text-rose-700">
                {stats.rejected}
              </span>
            </div>

          </div>
        </div>

        {/* FILTERS */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

            {/* SEARCH */}
            <div className="lg:col-span-2 relative">

              <input
                type="text"
                placeholder="Search by name, app no, mobile, email..."
                value={searchTerm}
                onChange={(e) =>
                  setSearchTerm(e.target.value)
                }
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
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

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* PAYMENT */}
            <select
              value={paymentFilter}
              onChange={(e) =>
                setPaymentFilter(e.target.value)
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20"
            >
              <option value="All">All Payments</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>

            {/* PROGRAM */}
            <select
              value={programFilter}
              onChange={(e) =>
                setProgramFilter(e.target.value)
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20"
            >
              <option value="All">All Programs</option>
              <option value="Academic Excellence">
                Academic Excellence
              </option>
              <option value="Veezna Vox">
                Veezna Vox
              </option>
              <option value="Web Development">
                Web Development
              </option>
              <option value="Wellness & Care">
                Wellness & Care
              </option>
            </select>

          </div>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">

            <div className="w-8 h-8 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mx-auto mb-3" />

            <p className="text-xs text-slate-500 font-medium">
              Loading admission applications...
            </p>

          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-200 text-rose-700 space-y-3">

            <p className="text-sm font-medium">
              {error}
            </p>

            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700"
            >
              Try Again
            </button>

          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">

            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            <h3 className="text-sm font-bold text-slate-700">
              No admission applications found.
            </h3>

            <p className="text-xs text-slate-400 mt-1">
              Try modifying your search or filter parameters.
            </p>

          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}

            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

              <div className="overflow-x-auto">

                <table className="w-full text-left border-collapse text-xs">

                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">

                      <th className="py-3.5 px-4">
                        App No.
                      </th>

                      <th className="py-3.5 px-4">
                        Student Name
                      </th>

                      <th className="py-3.5 px-4">
                        Mobile
                      </th>

                      <th className="py-3.5 px-4">
                        Program
                      </th>

                      <th className="py-3.5 px-4">
                        Batch
                      </th>

                      <th className="py-3.5 px-4">
                        Payment
                      </th>

                      <th className="py-3.5 px-4">
                        Status
                      </th>

                      <th className="py-3.5 px-4">
                        Applied Date
                      </th>

                      <th className="py-3.5 px-4 text-right">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredApplications.map((app) => {
                      const status =
                        normalizeStatus(app.status);

                      const payment =
                        normalizePayment(
                          app.paymentStatus
                        );

                      const isUpdating =
                        updatingId === app.id;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >

                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {safeString(
                              app.applicationNo,
                              "—"
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {getStudentName(app)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {safeString(
                              app.mobile,
                              "—"
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">
                            {getProgram(app)}
                          </td>

                          <td className="py-3.5 px-4 text-slate-600">
                            {getBatch(app)}
                          </td>

                          <td className="py-3.5 px-4">

                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                                payment === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : payment === "failed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {payment}
                            </span>

                          </td>

                          <td className="py-3.5 px-4">

                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                status === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : status === "rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {status}
                            </span>

                          </td>

                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {formatDate(
                              app.createdAt
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">

                            <div className="flex items-center justify-end gap-1.5">

                              <button
                                onClick={() =>
                                  setSelectedApp(app)
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium"
                              >
                                View
                              </button>

                              {status !== "approved" && (
                                <button
                                  onClick={() =>
                                    handleApprove(app.id)
                                  }
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}

                              {status !== "rejected" && (
                                <button
                                  onClick={() =>
                                    handleReject(app.id)
                                  }
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-medium disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              )}

                            </div>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>
                </table>

              </div>
            </div>

            {/* MOBILE */}

            <div className="block md:hidden space-y-3">

              {filteredApplications.map((app) => {
                const status =
                  normalizeStatus(app.status);

                const payment =
                  normalizePayment(
                    app.paymentStatus
                  );

                const isUpdating =
                  updatingId === app.id;

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
                  >

                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">

                      <span className="font-mono text-xs font-bold text-slate-500">
                        #
                        {safeString(
                          app.applicationNo,
                          "N/A"
                        )}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : status === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {status}
                      </span>

                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800">
                        {getStudentName(app)}
                      </h4>

                      <p className="text-xs text-slate-500 mt-0.5">
                        {getProgram(app)} •{" "}
                        {getBatch(app)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">

                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Mobile
                        </span>

                        <span className="text-slate-700 font-medium">
                          {safeString(
                            app.mobile,
                            "—"
                          )}
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Payment
                        </span>

                        <span
                          className={`font-bold text-[10px] capitalize ${
                            payment === "paid"
                              ? "text-emerald-600"
                              : payment === "failed"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {payment}
                        </span>
                      </div>

                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">

                      <span className="text-[10px] text-slate-400">
                        {formatDate(
                          app.createdAt
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">

                        <button
                          onClick={() =>
                            setSelectedApp(app)
                          }
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          View
                        </button>

                        {status !== "approved" && (
                          <button
                            onClick={() =>
                              handleApprove(app.id)
                            }
                            disabled={isUpdating}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        {status !== "rejected" && (
                          <button
                            onClick={() =>
                              handleReject(app.id)
                            }
                            disabled={isUpdating}
                            className="px-2.5 py-1 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            Reject
                          </button>
                        )}

                      </div>
                    </div>

                  </div>
                );
              })}

            </div>
          </>
        )}
      </div>

      {/* =================================================
          MODAL
      ================================================= */}

      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 relative my-auto">

            {/* CLOSE */}
            <button
              onClick={() =>
                setSelectedApp(null)
              }
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full"
            >
              <svg
                className="w-5 h-5"
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

            {/* HEADER */}
            <div className="border-b border-slate-100 pb-4">

              <div className="flex items-center gap-3">

                <span className="px-3 py-1 bg-[#0057B8]/10 text-[#0057B8] font-mono text-xs font-bold rounded-lg">
                  App No:{" "}
                  {safeString(
                    selectedApp.applicationNo,
                    "—"
                  )}
                </span>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    normalizeStatus(
                      selectedApp.status
                    ) === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : normalizeStatus(
                          selectedApp.status
                        ) === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {normalizeStatus(
                    selectedApp.status
                  )}
                </span>

              </div>

              <h2 className="text-xl font-bold text-slate-800 mt-2">
                {getStudentName(selectedApp)}
              </h2>

            </div>

            {/* DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">

              {/* PERSONAL */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">

                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-2 text-[#0057B8]">
                  Personal Details
                </h3>

                <p>
                  <strong>Full Name:</strong>{" "}
                  {getStudentName(selectedApp)}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {safeString(
                    selectedApp.email,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Mobile:</strong>{" "}
                  {safeString(
                    selectedApp.mobile,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Father's Name:</strong>{" "}
                  {safeString(
                    selectedApp.fatherName,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Mother's Name:</strong>{" "}
                  {safeString(
                    selectedApp.motherName,
                    "—"
                  )}
                </p>

                <p>
                  <strong>DOB:</strong>{" "}
                  {safeString(
                    selectedApp.dob,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Gender:</strong>{" "}
                  {safeString(
                    selectedApp.gender,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Address:</strong>{" "}
                  {safeString(
                    selectedApp.address,
                    "—"
                  )}
                </p>

              </div>

              {/* ACADEMIC */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">

                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-2 text-[#0057B8]">
                  Academic Details
                </h3>

                <p>
                  <strong>Current Class:</strong>{" "}
                  {safeString(
                    selectedApp.currentClass,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Previous School:</strong>{" "}
                  {safeString(
                    selectedApp.previousSchool,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Board:</strong>{" "}
                  {safeString(
                    selectedApp.board,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Percentage / Grade:</strong>{" "}
                  {safeString(
                    selectedApp.percentageGrade,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Passing Year:</strong>{" "}
                  {safeString(
                    selectedApp.passingYear,
                    "—"
                  )}
                </p>

              </div>

              {/* PROGRAM */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">

                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-2 text-[#0057B8]">
                  Program Details
                </h3>

                <p>
                  <strong>Program:</strong>{" "}
                  {getProgram(selectedApp)}
                </p>

                <p>
                  <strong>Batch:</strong>{" "}
                  {getBatch(selectedApp)}
                </p>

                <p>
                  <strong>Duration:</strong>{" "}
                  {safeString(
                    selectedApp.duration,
                    "—"
                  )}
                </p>

                <p>
                  <strong>Program Fee:</strong>{" "}
                  {selectedApp.fee !== undefined &&
                  selectedApp.fee !== null &&
                  safeString(selectedApp.fee) !== ""
                    ? `₹${safeString(
                        selectedApp.fee
                      )}`
                    : "—"}
                </p>

              </div>

              {/* PAYMENT */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">

                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 mb-2 text-[#0057B8]">
                  Payment Details
                </h3>

                <p>
                  <strong>Payment Status:</strong>{" "}
                  <span className="capitalize font-semibold">
                    {normalizePayment(
                      selectedApp.paymentStatus
                    )}
                  </span>
                </p>

                <p>
                  <strong>Amount Paid:</strong>{" "}
                  {selectedApp.amount !== undefined &&
                  selectedApp.amount !== null &&
                  safeString(selectedApp.amount) !== ""
                    ? `₹${safeString(
                        selectedApp.amount
                      )}`
                    : "—"}
                </p>

                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {safeString(
                    selectedApp.transactionId,
                    "—"
                  )}
                </p>

              </div>

            </div>

            {/* META */}
            <div className="bg-slate-100 p-4 rounded-2xl text-xs space-y-1 text-slate-600">

              <p>
                <strong>Created Date:</strong>{" "}
                {formatDate(
                  selectedApp.createdAt
                )}
              </p>

              <p>
                <strong>Last Updated:</strong>{" "}
                {formatDate(
                  selectedApp.updatedAt
                )}
              </p>

            </div>

            {/* ACTIONS */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-wrap">

              <button
                onClick={() =>
                  setSelectedApp(null)
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>

              {normalizeStatus(
                selectedApp.status
              ) !== "rejected" && (
                <button
                  onClick={() =>
                    handleReject(
                      selectedApp.id
                    )
                  }
                  disabled={
                    updatingId ===
                    selectedApp.id
                  }
                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  Reject Application
                </button>
              )}

              {normalizeStatus(
                selectedApp.status
              ) !== "approved" && (
                <button
                  onClick={() =>
                    handleApprove(
                      selectedApp.id
                    )
                  }
                  disabled={
                    updatingId ===
                    selectedApp.id
                  }
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
                >
                  Approve Application
                </button>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}