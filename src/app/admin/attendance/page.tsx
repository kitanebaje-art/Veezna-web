"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
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
  totalFee?: number | string;
  paidFee?: number | string;
  pendingFee?: number | string;
  fees?: number | string;
  fee?: number | string;
  status?: string;
  createdAt?: string | Timestamp | Date | number;
}

export interface PaymentRecord {
  docId: string;
  paymentId?: string;
  studentId?: string;
  applicationNo?: string;
  studentName?: string;
  amount?: number | string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  course?: string;
  program?: string;
  paymentDate?: string | Timestamp | Date | number;
  createdAt?: string | Timestamp | Date | number;
  updatedAt?: string | Timestamp | Date | number;
  remarks?: string;
}

export interface UnifiedFeeRow {
  id: string; // Internal key
  docId: string; // Firestore document ID
  studentId: string;
  studentName: string;
  mobile: string;
  academicClass: string;
  program: string;
  totalFee: number | null;
  paidFee: number | null;
  pendingFee: number | null;
  paymentStatus: string;
  paymentMethod: string;
  lastPaymentDate: any;
  rawStudent?: StudentRecord;
  rawPayment?: PaymentRecord;
}

export default function AdminFeesPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [methodFilter, setMethodFilter] = useState<string>("All");
  const [programFilter, setProgramFilter] = useState<string>("All");
  const [dateFilter, setDateFilter] = useState<string>("All");

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<UnifiedFeeRow | null>(null);
  const [recordPaymentTarget, setRecordPaymentTarget] = useState<UnifiedFeeRow | null>(null);

  // Record Payment Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    studentId: "",
    studentName: "",
    amount: "",
    paymentMethod: "Cash",
    transactionId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Fetch Data from Firestore
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const studentsRef = collection(db, "students");
      const studentsSnap = await getDocs(studentsRef);
      const studentList: StudentRecord[] = studentsSnap.docs.map((docSnap) => ({
        docId: docSnap.id,
        ...docSnap.data(),
      }));

      // 2. Fetch Payments
      const paymentsRef = collection(db, "payments");
      const paymentsSnap = await getDocs(paymentsRef);
      const paymentList: PaymentRecord[] = paymentsSnap.docs.map((docSnap) => ({
        docId: docSnap.id,
        ...docSnap.data(),
      }));

      setStudents(studentList);
      setPayments(paymentList);
    } catch (err: any) {
      console.error("Error fetching fees/payments:", err);
      setError("Unable to load fee records. Please try again.");
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

  // Safe Helpers
  const parseNumberSafely = (val: any): number | null => {
    if (val === undefined || val === null || val === "" || val === "—") return null;
    const parsed = Number(val);
    return isNaN(parsed) ? null : parsed;
  };

  const formatINR = (val: number | null): string => {
    if (val === null || val === undefined) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

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

  const formatDate = (dateVal: any): string => {
    const millis = parseDateToMillis(dateVal);
    if (!millis) return "—";
    return new Date(millis).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Combine Students & Payments into Unified Fee Rows
  const unifiedRows: UnifiedFeeRow[] = useMemo(() => {
    const studentMap = new Map<string, StudentRecord>();
    students.forEach((s) => {
      if (s.studentId) studentMap.set(s.studentId.trim().toLowerCase(), s);
      studentMap.set(s.docId.trim().toLowerCase(), s);
    });

    const rows: UnifiedFeeRow[] = [];

    // Map existing students first
    students.forEach((st) => {
      const sId = st.studentId || st.docId;
      const sName = st.fullName || st.name || "—";
      const sMobile = st.mobile || "—";
      const sClass = st.academicClass || st.class || "—";
      const sProg = st.program || st.course || "—";

      // Find all payments for this student
      const studentPayments = payments.filter((p) => {
        if (!p.studentId) return false;
        const pSid = p.studentId.trim().toLowerCase();
        return pSid === (st.studentId || "").trim().toLowerCase() || pSid === st.docId.trim().toLowerCase();
      });

      // Calculate paid from payments if student doc total/paid fee is present
      const rawTotal = parseNumberSafely(st.totalFee ?? st.fees ?? st.fee);
      
      let sumPaymentsPaid = 0;
      let lastDate: any = st.createdAt;

      studentPayments.forEach((p) => {
        if ((p.paymentStatus || "").toLowerCase() === "paid") {
          sumPaymentsPaid += parseNumberSafely(p.amount) || 0;
        }
        const pDateMillis = parseDateToMillis(p.paymentDate || p.createdAt);
        if (pDateMillis > parseDateToMillis(lastDate)) {
          lastDate = p.paymentDate || p.createdAt;
        }
      });

      const rawDocPaid = parseNumberSafely(st.paidFee);
      const computedPaid = rawDocPaid !== null ? Math.max(rawDocPaid, sumPaymentsPaid) : (studentPayments.length > 0 ? sumPaymentsPaid : null);

      let computedPending: number | null = null;
      if (rawTotal !== null && computedPaid !== null) {
        computedPending = Math.max(0, rawTotal - computedPaid);
      } else if (parseNumberSafely(st.pendingFee) !== null) {
        computedPending = Math.max(0, parseNumberSafely(st.pendingFee)!);
      }

      // Determine Status
      let pStatus = "pending";
      if (rawTotal !== null && computedPaid !== null && computedPaid >= rawTotal && rawTotal > 0) {
        pStatus = "paid";
      } else if (studentPayments.length > 0) {
        pStatus = studentPayments[0].paymentStatus || "pending";
      }

      rows.push({
        id: `student-${st.docId}`,
        docId: st.docId,
        studentId: sId,
        studentName: sName,
        mobile: sMobile,
        academicClass: sClass,
        program: sProg,
        totalFee: rawTotal,
        paidFee: computedPaid,
        pendingFee: computedPending,
        paymentStatus: pStatus.toLowerCase(),
        paymentMethod: studentPayments[0]?.paymentMethod || "—",
        lastPaymentDate: lastDate,
        rawStudent: st,
      });
    });

    // Also include payments without matching student documents
    payments.forEach((p) => {
      if (!p.studentId) return;
      const existsInStudents = rows.some((r) => r.studentId.toLowerCase() === p.studentId!.toLowerCase());
      if (!existsInStudents) {
        const amt = parseNumberSafely(p.amount);
        rows.push({
          id: `payment-${p.docId}`,
          docId: p.docId,
          studentId: p.studentId || "—",
          studentName: p.studentName || "—",
          mobile: "—",
          academicClass: "—",
          program: p.program || p.course || "—",
          totalFee: amt,
          paidFee: (p.paymentStatus || "").toLowerCase() === "paid" ? amt : 0,
          pendingFee: (p.paymentStatus || "").toLowerCase() === "paid" ? 0 : amt,
          paymentStatus: (p.paymentStatus || "pending").toLowerCase(),
          paymentMethod: p.paymentMethod || "—",
          lastPaymentDate: p.paymentDate || p.createdAt,
          rawPayment: p,
        });
      }
    });

    return rows;
  }, [students, payments]);

  // Overall Statistics Calculations
  const stats = useMemo(() => {
    let totalFees = 0;
    let totalCollected = 0;
    let totalPending = 0;
    const totalTransactions = payments.length;

    unifiedRows.forEach((row) => {
      if (row.totalFee !== null) totalFees += row.totalFee;
      if (row.paidFee !== null) totalCollected += row.paidFee;
      if (row.pendingFee !== null) totalPending += row.pendingFee;
    });

    return {
      totalFees,
      totalCollected,
      totalPending,
      totalTransactions,
    };
  }, [unifiedRows, payments]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return unifiedRows.filter((row) => {
      // Search
      const sTerm = searchTerm.toLowerCase().trim();
      const sName = row.studentName.toLowerCase();
      const sId = row.studentId.toLowerCase();
      const sMobile = row.mobile.toLowerCase();
      const appNo = (row.rawPayment?.applicationNo || "").toLowerCase();
      const txnId = (row.rawPayment?.transactionId || row.rawPayment?.razorpayPaymentId || "").toLowerCase();

      const matchesSearch =
        !sTerm ||
        sName.includes(sTerm) ||
        sId.includes(sTerm) ||
        sMobile.includes(sTerm) ||
        appNo.includes(sTerm) ||
        txnId.includes(sTerm);

      // Status Filter
      const matchesStatus =
        statusFilter === "All" ||
        row.paymentStatus.toLowerCase() === statusFilter.toLowerCase();

      // Method Filter
      const matchesMethod =
        methodFilter === "All" ||
        row.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

      // Program Filter
      const matchesProgram =
        programFilter === "All" ||
        row.program.toLowerCase().includes(programFilter.toLowerCase());

      // Date Filter
      let matchesDate = true;
      if (dateFilter === "Today") {
        const millis = parseDateToMillis(row.lastPaymentDate);
        matchesDate = millis >= startOfToday;
      } else if (dateFilter === "This Month") {
        const millis = parseDateToMillis(row.lastPaymentDate);
        matchesDate = millis >= startOfThisMonth;
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesProgram && matchesDate;
    });
  }, [unifiedRows, searchTerm, statusFilter, methodFilter, programFilter, dateFilter]);

  // Handle Record Payment Modal Open
  const openRecordPaymentModal = (row?: UnifiedFeeRow) => {
    if (row) {
      setRecordPaymentTarget(row);
      setPaymentForm({
        studentId: row.studentId !== "—" ? row.studentId : "",
        studentName: row.studentName !== "—" ? row.studentName : "",
        amount: row.pendingFee && row.pendingFee > 0 ? String(row.pendingFee) : "",
        paymentMethod: "Cash",
        transactionId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        remarks: "",
      });
    } else {
      setRecordPaymentTarget(null);
      setPaymentForm({
        studentId: "",
        studentName: "",
        amount: "",
        paymentMethod: "Cash",
        transactionId: "",
        paymentDate: new Date().toISOString().split("T")[0],
        remarks: "",
      });
    }
  };

  // Submit Payment Record
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(paymentForm.amount);

    if (!paymentForm.studentId.trim()) {
      alert("Please enter a valid Student ID.");
      return;
    }
    if (!paymentForm.amount || isNaN(numAmount) || numAmount <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date();
      const paymentData = {
        studentId: paymentForm.studentId.trim(),
        studentName: paymentForm.studentName.trim() || "—",
        amount: numAmount,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId.trim() || "—",
        paymentStatus: "paid",
        paymentDate: paymentForm.paymentDate ? new Date(paymentForm.paymentDate).toISOString() : now.toISOString(),
        remarks: paymentForm.remarks.trim() || "",
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      await addDoc(collection(db, "payments"), paymentData);

      showToast("Payment recorded successfully.");
      setRecordPaymentTarget(null);
      fetchData();
    } catch (err: any) {
      console.error("Error saving payment record:", err);
      alert("Unable to save payment record. Please check permissions and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Dashboard
            </Link>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <Link href="/admin/students" className="hover:text-slate-600">Students</Link>
              <span>•</span>
              <Link href="/admin/admissions" className="hover:text-slate-600">Admissions</Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>

            <button
              onClick={() => openRecordPaymentModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all"
            >
              <span>+ Record Payment</span>
            </button>
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0057B8] tracking-tight">
            Fees & Payments
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-light">
            Track student fees, payments, pending dues and transactions.
          </p>
        </div>

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Fees
            </span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              {formatINR(stats.totalFees)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">Expected Course Revenue</span>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Total Collected
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {formatINR(stats.totalCollected)}
            </span>
            <span className="text-[11px] text-emerald-600/80 mt-0.5 block">Received Payments</span>
          </div>

          <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">
              Pending Fees
            </span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              {formatINR(stats.totalPending)}
            </span>
            <span className="text-[11px] text-amber-600/80 mt-0.5 block">Outstanding Dues</span>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 shadow-sm">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#0057B8]">
              Total Transactions
            </span>
            <span className="text-2xl font-black text-[#0057B8] mt-1 block">
              {stats.totalTransactions}
            </span>
            <span className="text-[11px] text-blue-600/80 mt-0.5 block">Recorded Payment Logs</span>
          </div>
        </div>

        {/* FILTERS & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="Search name, student ID, mobile, txn ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8] transition-all"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Razorpay">Razorpay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Card</option>
                <option value="Other">Other</option>
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

            {/* Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="This Month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN DATA TABLE / CARDS */}
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-xs text-slate-500 font-medium">
              Loading fees and payment records...
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
        ) : filteredRows.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-700">
              No fee or payment records found.
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              No matching records found. Try modifying your search term or filter options.
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
                      <th className="py-3.5 px-4">Student ID</th>
                      <th className="py-3.5 px-4">Student Name</th>
                      <th className="py-3.5 px-4">Program</th>
                      <th className="py-3.5 px-4">Total Fee</th>
                      <th className="py-3.5 px-4">Paid</th>
                      <th className="py-3.5 px-4">Pending</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Method</th>
                      <th className="py-3.5 px-4">Last Payment</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                          {row.studentId}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {row.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-[140px] truncate">
                          {row.program}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {formatINR(row.totalFee)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-600">
                          {formatINR(row.paidFee)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-amber-600">
                          {formatINR(row.pendingFee)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              row.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : row.paymentStatus === "failed"
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : row.paymentStatus === "refunded"
                                ? "bg-purple-50 text-purple-700 border border-purple-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {row.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 capitalize">
                          {row.paymentMethod}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {formatDate(row.lastPaymentDate)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedRecord(row)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                            >
                              View Details
                            </button>
                            <button
                              onClick={() => openRecordPaymentModal(row)}
                              className="px-2.5 py-1 bg-[#F7931E] hover:bg-amber-600 text-white rounded-lg text-[11px] font-medium transition shadow-sm"
                            >
                              Record Payment
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="block md:hidden space-y-3">
              {filteredRows.map((row) => (
                <div key={row.id} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-slate-500">
                      ID: {row.studentId}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        row.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : row.paymentStatus === "failed"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{row.studentName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{row.program}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Total</span>
                      <span className="text-slate-700 font-semibold">{formatINR(row.totalFee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Paid</span>
                      <span className="text-emerald-600 font-bold">{formatINR(row.paidFee)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] font-bold uppercase">Pending</span>
                      <span className="text-amber-600 font-bold">{formatINR(row.pendingFee)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Method: <strong className="text-slate-700 capitalize">{row.paymentMethod}</strong></span>
                    <span>{formatDate(row.lastPaymentDate)}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => setSelectedRecord(row)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium text-center"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => openRecordPaymentModal(row)}
                      className="flex-1 py-1.5 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold text-center shadow-sm"
                    >
                      Record Payment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* MODAL 1: VIEW DETAILS */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6 relative my-auto">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="border-b border-slate-100 pb-3">
              <span className="px-3 py-1 bg-[#0057B8]/10 text-[#0057B8] font-mono text-xs font-bold rounded-lg">
                Student ID: {selectedRecord.studentId}
              </span>
              <h2 className="text-xl font-bold text-slate-800 mt-2">
                {selectedRecord.studentName}
              </h2>
            </div>

            {/* Student Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-[#0057B8] text-sm border-b border-slate-200/80 pb-1.5">
                Student Information
              </h3>
              <p><strong className="text-slate-500">Mobile:</strong> {selectedRecord.mobile}</p>
              <p><strong className="text-slate-500">Class:</strong> {selectedRecord.academicClass}</p>
              <p><strong className="text-slate-500">Program:</strong> {selectedRecord.program}</p>
            </div>

            {/* Fee Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-[#0057B8] text-sm border-b border-slate-200/80 pb-1.5">
                Fee Summary
              </h3>
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Total Fee</span>
                  <span className="font-bold text-slate-800 text-sm">{formatINR(selectedRecord.totalFee)}</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="block text-[10px] text-emerald-600 font-bold uppercase">Paid</span>
                  <span className="font-bold text-emerald-700 text-sm">{formatINR(selectedRecord.paidFee)}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="block text-[10px] text-amber-600 font-bold uppercase">Pending</span>
                  <span className="font-bold text-amber-700 text-sm">{formatINR(selectedRecord.pendingFee)}</span>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h3 className="font-bold text-[#0057B8] text-sm border-b border-slate-200/80 pb-1.5">
                Last Recorded Payment Details
              </h3>
              <p><strong className="text-slate-500">Last Payment Date:</strong> {formatDate(selectedRecord.lastPaymentDate)}</p>
              <p><strong className="text-slate-500">Payment Method:</strong> <span className="capitalize">{selectedRecord.paymentMethod}</span></p>
              <p><strong className="text-slate-500">Payment Status:</strong> <span className="capitalize font-semibold">{selectedRecord.paymentStatus}</span></p>
              {selectedRecord.rawPayment?.transactionId && (
                <p><strong className="text-slate-500">Transaction ID:</strong> {selectedRecord.rawPayment.transactionId}</p>
              )}
              {selectedRecord.rawPayment?.remarks && (
                <p><strong className="text-slate-500">Remarks:</strong> {selectedRecord.rawPayment.remarks}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT FORM */}
      {recordPaymentTarget !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            <button
              onClick={() => setRecordPaymentTarget(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h2 className="text-xl font-bold text-[#0057B8]">Record Student Payment</h2>
              <p className="text-xs text-slate-500 mt-0.5">Submit payment transaction to update student fee record.</p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student ID *</label>
                <input
                  type="text"
                  required
                  value={paymentForm.studentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                  placeholder="e.g. VZN-2026-001"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Student Name</label>
                <input
                  type="text"
                  value={paymentForm.studentName}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentName: e.target.value })}
                  placeholder="Student Full Name"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Transaction ID / Reference</label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  placeholder="UPI Ref / Cheque No / Txn ID"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={paymentForm.remarks}
                  onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                  placeholder="Optional payment notes..."
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRecordPaymentTarget(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Recording Payment..." : "Submit Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}