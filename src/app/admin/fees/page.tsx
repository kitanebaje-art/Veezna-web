"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface StudentFeeRecord {
  id: string; // Document ID in Firestore
  studentId: string;
  name: string;
  mobile: string;
  academicClass: string;
  program: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
  status: "paid" | "pending" | "partial" | "overdue";
  rawStudentDoc?: any;
}

export interface PaymentTransaction {
  id: string; // Document ID
  paymentId?: string;
  studentId: string;
  studentName?: string;
  applicationNo?: string;
  amount: number;
  paymentMethod: "cash" | "upi" | "bank_transfer" | "card" | "razorpay" | "other" | string;
  paymentStatus: "paid" | "success" | "successful" | "captured" | "pending" | "failed" | "cancelled" | "refunded" | string;
  transactionId: string;
  razorpayPaymentId?: string;
  course?: string;
  program?: string;
  paymentDate: string;
  createdAt?: any;
  updatedAt?: any;
  remarks?: string;
}

export interface RecordPaymentFormData {
  studentId: string;
  amount: string;
  paymentMethod: "cash" | "upi" | "bank_transfer" | "card" | "other";
  transactionId: string;
  remarks: string;
  paymentDate: string;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Checks if a status string represents a valid, successful payment.
 */
export function isPaymentSuccessful(statusStr: string | undefined): boolean {
  if (!statusStr) return false;
  const s = statusStr.toLowerCase().trim();
  return ["paid", "success", "successful", "captured"].includes(s);
}

/**
 * Formats mixed Firestore date/timestamp/string into a safe localized date string.
 */
export function normalizeDateString(val: any): string {
  if (!val) return "N/A";
  try {
    if (typeof val === "object" && typeof val.toDate === "function") {
      return val.toDate().toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (val instanceof Date) {
      return val.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    if (typeof val === "string") {
      const parsed = new Date(val);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      }
      return val;
    }
    if (typeof val === "number") {
      return new Date(val).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    return "N/A";
  }
  return "N/A";
}

/**
 * Formats a numeric value into INR currency display.
 */
export function formatINR(val: number): string {
  if (isNaN(val) || val === null || val === undefined) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

export default function FeesAndPaymentsPage() {
  // Primary state
  const [students, setStudents] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");
  const [programFilter, setProgramFilter] = useState<string>("ALL");

  // Record Payment Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [paymentFormData, setPaymentFormData] = useState<RecordPaymentFormData>({
    studentId: "",
    amount: "",
    paymentMethod: "cash",
    transactionId: "",
    remarks: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });

  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<StudentFeeRecord | null>(null);
  const [studentLookupError, setStudentLookupError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // View Details Modal State
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<StudentFeeRecord | null>(null);

  // ==========================================
  // DATA FETCHING & SYNCHRONIZATION
  // ==========================================

  const fetchFeeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Payments Collection (Source of Truth for Transactions)
      const paymentsSnap = await getDocs(collection(db, "payments"));
      const paymentList: PaymentTransaction[] = [];

      paymentsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const pId = d.paymentId || d.transactionId || docSnap.id;
        const sId = d.studentId || d.studentID || d.userId || d.regNo || "";
        const sName = d.studentName || d.name || d.fullName || "N/A";
        const amt = Number(d.amount || d.totalAmount || d.paidAmount || 0);

        paymentList.push({
          id: docSnap.id,
          paymentId: pId,
          studentId: sId,
          studentName: sName,
          applicationNo: d.applicationNo || d.appNo || "",
          amount: isNaN(amt) ? 0 : amt,
          paymentMethod: d.paymentMethod || d.method || "other",
          paymentStatus: d.paymentStatus || d.status || "paid",
          transactionId: d.transactionId || d.txnId || d.razorpayPaymentId || pId,
          razorpayPaymentId: d.razorpayPaymentId || d.razorpay_payment_id || "",
          course: d.course || d.program || "",
          program: d.program || d.course || "",
          paymentDate: normalizeDateString(d.paymentDate || d.createdAt || d.date),
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          remarks: d.remarks || d.note || "",
        });
      });

      // Sort payments newest first
      paymentList.sort((a, b) => {
        const timeA = a.createdAt?.seconds ? a.createdAt.seconds : 0;
        const timeB = b.createdAt?.seconds ? b.createdAt.seconds : 0;
        return timeB - timeA;
      });

      setPayments(paymentList);

      // Map payments per student to eliminate double-counting
      const paymentsPerStudent: Record<string, number> = {};
      paymentList.forEach((p) => {
        if (p.studentId && isPaymentSuccessful(p.paymentStatus)) {
          const key = p.studentId.trim().toLowerCase();
          paymentsPerStudent[key] = (paymentsPerStudent[key] || 0) + p.amount;
        }
      });

      // 2. Fetch Students Collection
      let studentsSnap;
      try {
        studentsSnap = await getDocs(collection(db, "students"));
      } catch (stErr) {
        // Fallback check if collection is 'users'
        studentsSnap = await getDocs(collection(db, "users"));
      }

      const studentList: StudentFeeRecord[] = [];

      studentsSnap.forEach((docSnap) => {
        const d = docSnap.data();
        const sId = d.studentId || d.studentID || d.regNo || d.id || docSnap.id;
        const sName = d.fullName || d.name || d.studentName || "Unnamed Student";
        const mobile = d.mobile || d.phone || d.phoneNumber || "N/A";
        const academicClass = d.academicClass || d.class || d.grade || "N/A";
        const program = d.program || d.course || d.department || "N/A";

        const totalFee = Number(d.totalFee || d.totalFees || d.courseFee || 0);
        
        // Compute collected fee using payments collection as source of truth
        const key = String(sId).trim().toLowerCase();
        const trackedTransactionsTotal = paymentsPerStudent[key] || 0;
        
        // If student document has baseline fee paid prior to system transaction records
        const docPaid = Number(d.paidFee || d.feePaid || d.paidAmount || 0);
        const finalPaidFee = Math.max(docPaid, trackedTransactionsTotal);
        
        const pendingFee = Math.max(0, totalFee - finalPaidFee);

        let calculatedStatus: "paid" | "pending" | "partial" | "overdue" = "pending";
        if (totalFee > 0 && finalPaidFee >= totalFee) {
          calculatedStatus = "paid";
        } else if (finalPaidFee > 0 && finalPaidFee < totalFee) {
          calculatedStatus = "partial";
        } else {
          calculatedStatus = "pending";
        }

        studentList.push({
          id: docSnap.id,
          studentId: sId,
          name: sName,
          mobile,
          academicClass,
          program,
          totalFee,
          paidFee: finalPaidFee,
          pendingFee,
          status: calculatedStatus,
          rawStudentDoc: d,
        });
      });

      setStudents(studentList);
    } catch (err: any) {
      console.error("Firestore error loading fee details:", err);
      setError(
        err?.message ||
          "Failed to load fee & payment records. Please verify network or security permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeData();
  }, [fetchFeeData]);

  // ==========================================
  // STUDENT LOOKUP & FORM HANDLERS
  // ==========================================

  const handleStudentIdChange = (idInput: string) => {
    const trimmed = idInput.trim();
    setPaymentFormData((prev) => ({ ...prev, studentId: idInput }));
    setStudentLookupError(null);

    if (!trimmed) {
      setSelectedStudentForPayment(null);
      return;
    }

    const matched = students.find(
      (s) =>
        s.studentId.toLowerCase() === trimmed.toLowerCase() ||
        s.id.toLowerCase() === trimmed.toLowerCase()
    );

    if (matched) {
      setSelectedStudentForPayment(matched);
      setStudentLookupError(null);
    } else {
      setSelectedStudentForPayment(null);
      setStudentLookupError("Student ID not found in database.");
    }
  };

  const handleOpenRecordModal = (student?: StudentFeeRecord) => {
    setFormError(null);
    setStudentLookupError(null);

    // Auto-generate transaction ID
    const autoTxnId = `TXN-OFF-${Date.now().toString().slice(-6)}`;

    if (student) {
      setSelectedStudentForPayment(student);
      setPaymentFormData({
        studentId: student.studentId,
        amount: student.pendingFee > 0 ? String(student.pendingFee) : "",
        paymentMethod: "cash",
        transactionId: autoTxnId,
        remarks: "Offline fee payment",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    } else {
      setSelectedStudentForPayment(null);
      setPaymentFormData({
        studentId: "",
        amount: "",
        paymentMethod: "cash",
        transactionId: autoTxnId,
        remarks: "Offline fee payment",
        paymentDate: new Date().toISOString().split("T")[0],
      });
    }

    setIsRecordModalOpen(true);
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isSubmitting) return; // Prevent double clicks

    const amountNum = parseFloat(paymentFormData.amount);

    // 1. Validations
    if (!selectedStudentForPayment) {
      setFormError("Please enter a valid, existing Student ID.");
      return;
    }

    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (amountNum > selectedStudentForPayment.pendingFee) {
      setFormError(
        `Amount ₹${amountNum.toLocaleString()} exceeds pending balance of ₹${selectedStudentForPayment.pendingFee.toLocaleString()}. Advance payments require custom authorization.`
      );
      return;
    }

    if (!paymentFormData.transactionId.trim()) {
      setFormError("Transaction ID / Receipt reference is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 2. Try recording via API route for server-side validation
      let success = false;
      try {
        const res = await fetch("/api/admin/fees/record-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: selectedStudentForPayment.studentId,
            studentDocId: selectedStudentForPayment.id,
            studentName: selectedStudentForPayment.name,
            amount: amountNum,
            paymentMethod: paymentFormData.paymentMethod,
            transactionId: paymentFormData.transactionId.trim(),
            paymentDate: paymentFormData.paymentDate,
            remarks: paymentFormData.remarks.trim(),
            program: selectedStudentForPayment.program,
          }),
        });

        if (res.ok) {
          success = true;
        }
      } catch (apiErr) {
        console.warn("API Route unavailable, writing directly to Firestore client SDK...", apiErr);
      }

      // 3. Fallback direct Firestore transaction
      if (!success) {
        const newPaymentDoc = {
          studentId: selectedStudentForPayment.studentId,
          studentName: selectedStudentForPayment.name,
          amount: amountNum,
          paymentMethod: paymentFormData.paymentMethod,
          paymentStatus: "paid",
          transactionId: paymentFormData.transactionId.trim(),
          paymentDate: paymentFormData.paymentDate,
          program: selectedStudentForPayment.program,
          remarks: paymentFormData.remarks.trim() || "Admin recorded payment",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, "payments"), newPaymentDoc);

        // Update Student Record in Firestore
        const newPaid = selectedStudentForPayment.paidFee + amountNum;
        const newPending = Math.max(0, selectedStudentForPayment.totalFee - newPaid);
        const newStatus = newPending === 0 ? "paid" : "partial";

        const studentRef = doc(db, "students", selectedStudentForPayment.id);
        await updateDoc(studentRef, {
          paidFee: newPaid,
          pendingFee: newPending,
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      }

      setIsRecordModalOpen(false);
      await fetchFeeData(); // Refresh UI
    } catch (err: any) {
      console.error("Error saving payment:", err);
      setFormError("Failed to record payment: " + (err.message || "Unknown error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CALCULATED STATISTICS
  // ==========================================

  const stats = useMemo(() => {
    let totalFees = 0;
    let totalCollected = 0;

    students.forEach((s) => {
      totalFees += s.totalFee;
      totalCollected += s.paidFee;
    });

    const totalPending = Math.max(0, totalFees - totalCollected);
    const totalTransactions = payments.length;

    return {
      totalFees,
      totalCollected,
      totalPending,
      totalTransactions,
    };
  }, [students, payments]);

  // Unique program options for filter
  const programOptions = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.program && s.program !== "N/A") set.add(s.program);
    });
    return Array.from(set);
  }, [students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Program Filter
      if (programFilter !== "ALL" && s.program !== programFilter) return false;

      // Status Filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "paid" && s.status !== "paid") return false;
        if (statusFilter === "pending" && s.status !== "pending" && s.status !== "partial") return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchId = s.studentId.toLowerCase().includes(term);
        const matchName = s.name.toLowerCase().includes(term);
        const matchMobile = s.mobile.toLowerCase().includes(term);

        // Check matching payment transactions for this student
        const matchTxn = payments.some(
          (p) =>
            p.studentId === s.studentId &&
            (p.transactionId.toLowerCase().includes(term) ||
              (p.razorpayPaymentId && p.razorpayPaymentId.toLowerCase().includes(term)) ||
              (p.applicationNo && p.applicationNo.toLowerCase().includes(term)))
        );

        return matchId || matchName || matchMobile || matchTxn;
      }

      return true;
    });
  }, [students, payments, searchTerm, statusFilter, programFilter]);

  // Filtered Payment History for View Details
  const selectedStudentPayments = useMemo(() => {
    if (!selectedStudentDetails) return [];
    return payments.filter(
      (p) => p.studentId.toLowerCase() === selectedStudentDetails.studentId.toLowerCase()
    );
  }, [payments, selectedStudentDetails]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">
      {/* HEADER & TOP NAV */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/admin" className="hover:text-[#0057B8] transition font-medium">
                ← Back to Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Fees &amp; Payments</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Fees &amp; Payments Management
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Monitor student fee collection, review online Razorpay transactions, and record manual offline receipts.
            </p>
          </div>

          <button
            onClick={() => handleOpenRecordModal()}
            className="inline-flex items-center justify-center bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/10 transition cursor-pointer text-sm"
          >
            <span className="mr-2 text-lg font-bold">+</span> Record Payment
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80 text-xs sm:text-sm font-medium">
          <Link
            href="/admin/students"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Students
          </Link>
          <Link
            href="/admin/admissions"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Admissions
          </Link>
          <Link
            href="/admin/courses"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Courses
          </Link>
          <Link
            href="/admin/batches"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Batches
          </Link>
          <Link
            href="/admin/attendance"
            className="px-3 py-1.5 rounded-lg text-slate-600 hover:text-[#0057B8] hover:bg-slate-100 transition"
          >
            Attendance
          </Link>
          <Link
            href="/admin/fees"
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold shadow-sm"
          >
            Fees &amp; Payments
          </Link>
        </nav>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={fetchFeeData}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Fees Billed</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{formatINR(stats.totalFees)}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Expected revenue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Collected</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatINR(stats.totalCollected)}</p>
          <span className="text-[11px] text-emerald-700/80 font-medium mt-1 block">Verified successful receipts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pending</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{formatINR(stats.totalPending)}</p>
          <span className="text-[11px] text-amber-700/80 font-medium mt-1 block">Outstanding balances</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-[#0057B8]">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transactions</p>
          <p className="text-2xl font-extrabold text-[#0057B8] mt-1">{stats.totalTransactions}</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Online &amp; offline records</span>
        </div>
      </section>

      {/* FILTER & SEARCH BAR */}
      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Search Box */}
          <div className="md:col-span-2 relative">
            <input
              type="text"
              placeholder="Search by Student ID, Name, Mobile, Txn ID, or Razorpay ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 placeholder-slate-400"
            />
            <svg
              className="w-5 h-5 absolute left-3 top-3 text-slate-400"
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

          {/* Program Filter */}
          <div>
            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">All Programs / Courses</option>
              {programOptions.map((prog) => (
                <option key={prog} value={prog}>
                  {prog}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter & Refresh */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">All Fee Status</option>
              <option value="paid">Fully Paid</option>
              <option value="pending">Pending / Partial</option>
            </select>

            <button
              onClick={fetchFeeData}
              title="Refresh Data"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* MAIN DATA TABLE */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-10 h-10 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 text-sm font-medium">Synchronizing Fee Records &amp; Payment Transactions...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            💳
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Fee Records Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
            {searchTerm || statusFilter !== "ALL" || programFilter !== "ALL"
              ? "No student records match your active search and filter criteria."
              : "No student records are currently available in Firestore."}
          </p>
          {(searchTerm || statusFilter !== "ALL" || programFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("ALL");
                setProgramFilter("ALL");
              }}
              className="text-xs font-semibold text-[#0057B8] underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="p-4">Student Info</th>
                  <th className="p-4">Program / Course</th>
                  <th className="p-4">Total Fee</th>
                  <th className="p-4">Paid Fee</th>
                  <th className="p-4">Pending Fee</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => {
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      {/* Student Info */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px]">
                            {st.studentId}
                          </span>
                          <span>• {st.mobile}</span>
                        </div>
                      </td>

                      {/* Program */}
                      <td className="p-4 text-slate-700 font-medium">
                        {st.program}
                        <div className="text-[11px] text-slate-400 font-normal">{st.academicClass}</div>
                      </td>

                      {/* Total Fee */}
                      <td className="p-4 font-semibold text-slate-900">{formatINR(st.totalFee)}</td>

                      {/* Paid Fee */}
                      <td className="p-4 font-semibold text-emerald-600">{formatINR(st.paidFee)}</td>

                      {/* Pending Fee */}
                      <td className="p-4 font-semibold text-amber-600">
                        {formatINR(st.pendingFee)}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            st.status === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : st.status === "partial"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {st.status === "paid"
                            ? "Paid"
                            : st.status === "partial"
                            ? "Partial"
                            : "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedStudentDetails(st);
                              setIsDetailsModalOpen(true);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            View Details
                          </button>

                          {st.pendingFee > 0 && (
                            <button
                              onClick={() => handleOpenRecordModal(st)}
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0057B8] hover:bg-[#004494] rounded-lg transition"
                            >
                              Collect Fee
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
      )}

      {/* ========================================== */}
      {/* MODAL 1: RECORD PAYMENT FORM               */}
      {/* ========================================== */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Record Offline Payment</h2>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              {/* Student ID Lookup */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter exact Student ID (e.g. STU-1001)"
                  value={paymentFormData.studentId}
                  onChange={(e) => handleStudentIdChange(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                />

                {studentLookupError && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">{studentLookupError}</p>
                )}

                {selectedStudentForPayment && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{selectedStudentForPayment.name}</p>
                      <p className="text-[11px] text-blue-700">
                        {selectedStudentForPayment.program} • Mobile: {selectedStudentForPayment.mobile}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-blue-600 block uppercase font-bold">Pending</span>
                      <span className="font-extrabold text-sm text-amber-700">
                        {formatINR(selectedStudentForPayment.pendingFee)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={paymentFormData.amount}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, amount: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) =>
                      setPaymentFormData({
                        ...paymentFormData,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="bank_transfer">Bank Transfer / NEFT / IMPS</option>
                    <option value="card">Debit / Credit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Transaction ID & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction ID / Receipt No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentFormData.transactionId}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, transactionId: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentFormData.paymentDate}
                    onChange={(e) =>
                      setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional payment notes..."
                  value={paymentFormData.remarks}
                  onChange={(e) =>
                    setPaymentFormData({ ...paymentFormData, remarks: e.target.value })
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedStudentForPayment}
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494] shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL 2: VIEW DETAILS & PAYMENT HISTORY    */}
      {/* ========================================== */}
      {isDetailsModalOpen && selectedStudentDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0057B8] font-mono">
                  {selectedStudentDetails.studentId}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {selectedStudentDetails.name}
                </h2>
              </div>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Fee Summary Cards */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-center text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Billed</p>
                <p className="text-base font-extrabold text-slate-900 mt-0.5">
                  {formatINR(selectedStudentDetails.totalFee)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Total Paid</p>
                <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                  {formatINR(selectedStudentDetails.paidFee)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px]">Pending Balance</p>
                <p className="text-base font-extrabold text-amber-600 mt-0.5">
                  {formatINR(selectedStudentDetails.pendingFee)}
                </p>
              </div>
            </div>

            {/* Transaction History List */}
            <h3 className="font-bold text-slate-800 text-sm mb-3">Transaction History</h3>

            {selectedStudentPayments.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-500 font-medium">No recorded transactions found for this student.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                {selectedStudentPayments.map((p) => {
                  const isSuccess = isPaymentSuccessful(p.paymentStatus);
                  return (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">{p.transactionId}</span>
                          <span className="uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {p.paymentMethod}
                          </span>
                        </div>

                        <p className="text-slate-500 text-[11px] mt-1">
                          Date: {p.paymentDate} {p.remarks && `• ${p.remarks}`}
                        </p>

                        {p.razorpayPaymentId && (
                          <p className="text-[10px] font-mono text-blue-600 mt-0.5">
                            Razorpay ID: {p.razorpayPaymentId}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-sm text-slate-900 block">
                          {formatINR(p.amount)}
                        </span>
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded capitalize mt-0.5 ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {p.paymentStatus}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}