"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AdmissionApplication {
  id: string;
  applicationNo?: string;
  name?: string;
  fullName?: string;
  email?: string;
  mobile?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  gender?: string;
  address?: string;
  currentClass?: string;
  previousSchool?: string;
  board?: string;
  percentageGrade?: string;
  passingYear?: string;
  program?: string;
  programName?: string;
  batch?: string;
  selectedBatch?: string;
  duration?: string;
  fee?: string | number;
  status?: string;
  paymentStatus?: string;
  amount?: string | number;
  transactionId?: string;
  createdAt?: string | Timestamp | Date;
  updatedAt?: string | Timestamp | Date;
}

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [paymentFilter, setPaymentFilter] = useState<string>("All");
  const [programFilter, setProgramFilter] = useState<string>("All");

  // Selected Application for Modal View
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(
    null
  );

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      const admissionsRef = collection(db, "admissions");
      let snapshot;
      try {
        const q = query(admissionsRef, orderBy("createdAt", "desc"));
        snapshot = await getDocs(q);
      } catch (err) {
        // Fallback if index for orderBy is missing or createdAt absent
        snapshot = await getDocs(admissionsRef);
      }

      const appsList: AdmissionApplication[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Sort client-side safely just in case fallback was used
      appsList.sort((a, b) => {
        const timeA = parseDateToMillis(a.createdAt);
        const timeB = parseDateToMillis(b.createdAt);
        return timeB - timeA;
      });

      setApplications(appsList);
    } catch (err: any) {
      console.error("Error fetching admission applications:", err);
      setError("Unable to load admission applications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Safe Helpers
  const parseDateToMillis = (dateVal: any): number => {
    if (!dateVal) return 0;
    if (dateVal instanceof Timestamp) return dateVal.toMillis();
    if (typeof dateVal?.toMillis === "function") return dateVal.toMillis();
    if (dateVal instanceof Date) return dateVal.getTime();
    if (typeof dateVal === "string") return new Date(dateVal).getTime() || 0;
    return 0;
  };

  const formatDate = (dateVal: any): string => {
    const millis = parseDateToMillis(dateVal);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const normalizeStatus = (status?: string): "pending" | "approved" | "rejected" => {
    if (!status) return "pending";
    const lower = status.toLowerCase().trim();
    if (lower === "approved") return "approved";
    if (lower === "rejected") return "rejected";
    return "pending";
  };

  const normalizePayment = (pStatus?: string): "paid" | "pending" | "failed" => {
    if (!pStatus) return "pending";
    const lower = pStatus.toLowerCase().trim();
    if (lower === "paid") return "paid";
    if (lower === "failed") return "failed";
    return "pending";
  };

  const getStudentName = (app: AdmissionApplication) =>
    app.fullName || app.name || "—";

  const getProgram = (app: AdmissionApplication) =>
    app.programName || app.program || "—";

  const getBatch = (app: AdmissionApplication) =>
    app.selectedBatch || app.batch || "—";

  // Actions
  const handleApprove = async (docId: string) => {
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
            ? { ...item, status: "approved", updatedAt: isoNow }
            : item
        )
      );

      if (selectedApp && selectedApp.id === docId) {
        setSelectedApp((prev) =>
          prev ? { ...prev, status: "approved", updatedAt: isoNow } : null
        );
      }

      showToast("Application approved successfully.");
    } catch (err) {
      console.error("Error approving application:", err);
      alert("Failed to approve application. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (docId: string) => {
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
            ? { ...item, status: "rejected", updatedAt: isoNow }
            : item
        )
      );

      if (selectedApp && selectedApp.id === docId) {
        setSelectedApp((prev) =>
          prev ? { ...prev, status: "rejected", updatedAt: isoNow } : null
        );
      }

      showToast("Application rejected successfully.");
    } catch (err) {
      console.error("Error rejecting application:", err);
      alert("Failed to reject application. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Calculated Stats
  const stats = useMemo(() => {
    const total = applications.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    applications.forEach((app) => {
      const st = normalizeStatus(app.status);
      if (st === "approved") approved++;
      else if (st === "rejected") rejected++;
      else pending++;
    });

    return { total, pending, approved, rejected };
  }, [applications]);

  // Filtered List
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Search Match
      const sTerm = searchTerm.toLowerCase().trim();
      const name = getStudentName(app).toLowerCase();
      const appNo = (app.applicationNo || "").toLowerCase();
      const mobile = (app.mobile || "").toLowerCase();
      const email = (app.email || "").toLowerCase();

      const matchesSearch =
        !sTerm ||
        name.includes(sTerm) ||
        appNo.includes(sTerm) ||
        mobile.includes(sTerm) ||
        email.includes(sTerm);

      // Status Match
      const st = normalizeStatus(app.status);
      const matchesStatus =
        statusFilter === "All" ||
        st === statusFilter.toLowerCase();

      // Payment Match
      const pay = normalizePayment(app.paymentStatus);
      const matchesPayment =
        paymentFilter === "All" ||
        pay === paymentFilter.toLowerCase();

      // Program Match
      const prog = getProgram(app).toLowerCase();
      const matchesProgram =
        programFilter === "All" ||
        prog.includes(programFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesPayment && matchesProgram;
    });
  }, [applications, searchTerm, statusFilter, paymentFilter, programFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-bounce">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* TOP BAR / NAVIGATION */}
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
              Refresh
            </button>

            <Link
              href="/admin/students/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>+ Add Student</span>
            </Link>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
              Admissions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
              Review and manage student admission applications.
            </p>
          </div>

          {/* STATS SUMMARY */}
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

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="Search by name, app no, mobile, email..."
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

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* Payment Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Payments</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
            </div>

            {/* Program Filter */}
            <div>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Programs</option>
                <option value="Academic Excellence">Academic Excellence</option>
                <option value="Veezna Vox">Veezna Vox</option>
                <option value="Web Development">Web Development</option>
                <option value="Wellness & Care">Wellness & Care</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT TABLE / CARDS */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">
              Loading admission applications...
            </p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 rounded-2xl p-8 text-center border border-rose-200 shadow-sm text-rose-700 space-y-3">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchApplications}
              className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 transition"
            >
              Try Again
            </button>
          </div>
        ) : filteredApplications.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No admission applications found.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Try modifying your search query or filter parameters to locate the desired application records.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4">App No.</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Mobile</th>
                      <th className="py-3.5 px-4">Program</th>
                      <th className="py-3.5 px-4">Batch</th>
                      <th className="py-3.5 px-4">Payment</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Applied Date</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredApplications.map((app) => {
                      const st = normalizeStatus(app.status);
                      const pay = normalizePayment(app.paymentStatus);
                      const isUpdating = updatingId === app.id;

                      return (
                        <tr
                          key={app.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                            {app.applicationNo || "—"}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {getStudentName(app)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {app.mobile || "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 max-w-[150px] truncate">
                            {getProgram(app)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {getBatch(app)}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                                pay === "paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : pay === "failed"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {pay}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                st === "approved"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : st === "rejected"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {st}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {formatDate(app.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedApp(app)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                              >
                                View
                              </button>

                              {st !== "approved" && (
                                <button
                                  onClick={() => handleApprove(app.id)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-medium transition disabled:opacity-50"
                                >
                                  Approve
                                </button>
                              )}

                              {st !== "rejected" && (
                                <button
                                  onClick={() => handleReject(app.id)}
                                  disabled={isUpdating}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg text-[11px] font-medium transition disabled:opacity-50"
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

            {/* MOBILE CARD VIEW */}
            <div className="block md:hidden space-y-3">
              {filteredApplications.map((app) => {
                const st = normalizeStatus(app.status);
                const pay = normalizePayment(app.paymentStatus);
                const isUpdating = updatingId === app.id;

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="font-mono text-xs font-bold text-slate-500">
                        #{app.applicationNo || "N/A"}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          st === "approved"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : st === "rejected"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {st}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-800">
                        {getStudentName(app)}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {getProgram(app)} • {getBatch(app)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Mobile
                        </span>
                        <span className="text-slate-700 font-medium">
                          {app.mobile || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] font-semibold uppercase">
                          Payment
                        </span>
                        <span
                          className={`inline-block font-bold text-[10px] capitalize ${
                            pay === "paid"
                              ? "text-emerald-600"
                              : pay === "failed"
                              ? "text-rose-600"
                              : "text-amber-600"
                          }`}
                        >
                          {pay}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">
                        {formatDate(app.createdAt)}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                        >
                          View
                        </button>

                        {st !== "approved" && (
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={isUpdating}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}

                        {st !== "rejected" && (
                          <button
                            onClick={() => handleReject(app.id)}
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

      {/* DETAILED APPLICATION MODAL PANEL */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative my-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
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

            {/* Modal Header */}
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#0057B8]/10 text-[#0057B8] font-mono text-xs font-bold rounded-lg">
                  App No: {selectedApp.applicationNo || "—"}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    normalizeStatus(selectedApp.status) === "approved"
                      ? "bg-emerald-100 text-emerald-800"
                      : normalizeStatus(selectedApp.status) === "rejected"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {normalizeStatus(selectedApp.status)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mt-2">
                {getStudentName(selectedApp)}
              </h2>
            </div>

            {/* Modal Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
              {/* Personal Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2 mb-2 text-[#0057B8]">
                  Personal Details
                </h3>
                <p>
                  <strong className="text-slate-500">Full Name:</strong>{" "}
                  {getStudentName(selectedApp)}
                </p>
                <p>
                  <strong className="text-slate-500">Email:</strong>{" "}
                  {selectedApp.email || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Mobile:</strong>{" "}
                  {selectedApp.mobile || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Father's Name:</strong>{" "}
                  {selectedApp.fatherName || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Mother's Name:</strong>{" "}
                  {selectedApp.motherName || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">DOB:</strong>{" "}
                  {selectedApp.dob || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Gender:</strong>{" "}
                  {selectedApp.gender || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Address:</strong>{" "}
                  {selectedApp.address || "—"}
                </p>
              </div>

              {/* Academic Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2 mb-2 text-[#0057B8]">
                  Academic Details
                </h3>
                <p>
                  <strong className="text-slate-500">Current Class:</strong>{" "}
                  {selectedApp.currentClass || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Previous School:</strong>{" "}
                  {selectedApp.previousSchool || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Board:</strong>{" "}
                  {selectedApp.board || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Percentage / Grade:</strong>{" "}
                  {selectedApp.percentageGrade || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Passing Year:</strong>{" "}
                  {selectedApp.passingYear || "—"}
                </p>
              </div>

              {/* Program Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2 mb-2 text-[#0057B8]">
                  Program Details
                </h3>
                <p>
                  <strong className="text-slate-500">Program:</strong>{" "}
                  {getProgram(selectedApp)}
                </p>
                <p>
                  <strong className="text-slate-500">Batch:</strong>{" "}
                  {getBatch(selectedApp)}
                </p>
                <p>
                  <strong className="text-slate-500">Duration:</strong>{" "}
                  {selectedApp.duration || "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Program Fee:</strong>{" "}
                  {selectedApp.fee ? `₹${selectedApp.fee}` : "—"}
                </p>
              </div>

              {/* Payment Details */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2 mb-2 text-[#0057B8]">
                  Payment Details
                </h3>
                <p>
                  <strong className="text-slate-500">Payment Status:</strong>{" "}
                  <span className="capitalize font-semibold">
                    {normalizePayment(selectedApp.paymentStatus)}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-500">Amount Paid:</strong>{" "}
                  {selectedApp.amount ? `₹${selectedApp.amount}` : "—"}
                </p>
                <p>
                  <strong className="text-slate-500">Transaction ID:</strong>{" "}
                  {selectedApp.transactionId || "—"}
                </p>
              </div>
            </div>

            {/* Application Meta */}
            <div className="bg-slate-100 p-4 rounded-2xl text-xs space-y-1 text-slate-600">
              <p>
                <strong>Created Date:</strong> {formatDate(selectedApp.createdAt)}
              </p>
              <p>
                <strong>Last Updated:</strong> {formatDate(selectedApp.updatedAt)}
              </p>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>

              {normalizeStatus(selectedApp.status) !== "rejected" && (
                <button
                  onClick={() => handleReject(selectedApp.id)}
                  disabled={updatingId === selectedApp.id}
                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  Reject Application
                </button>
              )}

              {normalizeStatus(selectedApp.status) !== "approved" && (
                <button
                  onClick={() => handleApprove(selectedApp.id)}
                  disabled={updatingId === selectedApp.id}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
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