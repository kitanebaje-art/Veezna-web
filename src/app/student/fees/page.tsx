"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
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
  mobile?: string;
  academicClass?: string;
  class?: string;
  program?: string;
  course?: string;
  totalFee?: number | string;
  paidFee?: number | string;
  pendingFee?: number | string;
  fee?: number | string;
  registrationFee?: number | string;
  discount?: number | string;
  status?: string;
  dueDate?: string | Timestamp | Date | number;
}

export interface PaymentDoc {
  docId: string;
  paymentId?: string;
  studentId?: string;
  studentName?: string;
  amount?: number | string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  razorpayPaymentId?: string;
  paymentDate?: string | Timestamp | Date | number;
  createdAt?: string | Timestamp | Date | number;
  remarks?: string;
  recordedBy?: string;
  receiptUrl?: string;
}

export default function StudentFeesPage() {
  const router = useRouter();

  // Auth & Student Document
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [payments, setPayments] = useState<PaymentDoc[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Payment for Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentDoc | null>(null);

  // Safe Formatting Helpers
  const parseNumber = (val: unknown): number => {
    if (val === undefined || val === null || val === "" || val === "—") return 0;
    const num = Number(val);
    return isFinite(num) ? num : 0;
  };

  const formatINR = (val: number): string => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Math.max(0, val));
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

  // Auth Listener & Real-Time Student + Payment Subscription
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/student/login");
        return;
      }
      setCurrentUser(user);

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

        // Step 2: Set up Real-Time Subscriptions
        const knownStudentId = matchedStudentDoc.studentId || matchedStudentDoc.docId || sDocId;

        // Subscribe to Payments Collection where studentId matches
        const paymentsRef = collection(db, "payments");
        const qPay = query(paymentsRef, where("studentId", "==", knownStudentId));

        const unsubPayments = onSnapshot(
          qPay,
          (paySnap) => {
            const payList: PaymentDoc[] = paySnap.docs.map((dSnap) => ({
              docId: dSnap.id,
              ...dSnap.data(),
            }));

            // Sort newest payments first
            payList.sort((a, b) => {
              const tA = parseDateToMillis(a.paymentDate || a.createdAt);
              const tB = parseDateToMillis(b.paymentDate || b.createdAt);
              return tB - tA;
            });

            setPayments(payList);
            setLoading(false);
          },
          (err) => {
            console.error("Real-time Payments Subscription Error:", err);
            setError("Unable to sync live payment records. Please refresh.");
            setLoading(false);
          }
        );

        // Subscribe to Student Document Changes (for instant fee updates when Admin updates fees)
        const unsubStudentDoc = onSnapshot(doc(db, "students", sDocId), (sSnap) => {
          if (sSnap.exists()) {
            setStudent({
              docId: sSnap.id,
              ...sSnap.data(),
            } as StudentDoc);
          }
        });

        return () => {
          unsubPayments();
          unsubStudentDoc();
        };
      } catch (err) {
        console.error("Error setting up student fees data:", err);
        setError("Failed to load fee information. Please try again.");
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, [router]);

  // Financial Computations using authoritative Firestore records
  const financialSummary = useMemo(() => {
    if (!student) {
      return {
        totalCourseFee: 0,
        registrationFee: 0,
        totalPayable: 0,
        paidAmount: 0,
        pendingAmount: 0,
        status: "pending",
        hasOverdue: false,
      };
    }

    const courseFeeNum = parseNumber(student.totalFee ?? student.fee);
    const regFeeNum = parseNumber(student.registrationFee);
    const totalPayable = courseFeeNum > 0 ? courseFeeNum : courseFeeNum + regFeeNum;

    // Sum successfully paid payments from the payments collection
    let verifiedPaid = 0;
    payments.forEach((p) => {
      if ((p.paymentStatus || "").toLowerCase() === "paid") {
        verifiedPaid += parseNumber(p.amount);
      }
    });

    // Check if student document explicitly specifies a higher paid amount
    const docPaid = parseNumber(student.paidFee);
    const finalPaid = Math.max(verifiedPaid, docPaid);

    // Compute Pending
    const computedPending = Math.max(0, totalPayable - finalPaid);
    const docPending = parseNumber(student.pendingFee);
    const finalPending = totalPayable > 0 ? computedPending : docPending;

    // Status Determination
    let status = "Pending";
    if (totalPayable > 0 && finalPaid >= totalPayable) {
      status = "Paid";
    } else if (finalPaid > 0) {
      status = "Partially Paid";
    }

    // Check Overdue if due date exists and is in the past
    let hasOverdue = false;
    if (student.dueDate && finalPending > 0) {
      const dueMillis = parseDateToMillis(student.dueDate);
      if (dueMillis > 0 && dueMillis < Date.now()) {
        status = "Overdue";
        hasOverdue = true;
      }
    }

    return {
      totalCourseFee: courseFeeNum,
      registrationFee: regFeeNum,
      totalPayable,
      paidAmount: finalPaid,
      pendingAmount: finalPending,
      status,
      hasOverdue,
    };
  }, [student, payments]);

  // Trigger Online Payment Handler
  const handlePayNow = () => {
    alert(
      "Online Payment Gateway Integration:\n\nVEEZNA Online Payment Gateway (Razorpay/UPI) is currently in sandbox verification mode.\n\nTo complete your payment immediately, please visit the VEEZNA Admin Desk or transfer directly via official UPI/Bank Transfer and present the reference ID to the Admin."
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Loading student fee records...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !student) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-bold text-slate-800">Fee Records Error</h2>
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

  const studentName = student.fullName || student.name || currentUser?.displayName || "Student";
  const studentCode = student.studentId || student.docId || "VZ-STU";
  const assignedProgram = student.program || student.course || "Standard Academic Program";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* TOP BREADCRUMB NAVIGATION */}
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
            Student Portal • Fees
          </span>
        </div>

        {/* PAGE HEADER */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#0057B8] tracking-tight">
              My Fees & Payments
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-light">
              Review your course fee structure, view payment history, and download official VEEZNA receipts.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold bg-blue-50 text-[#0057B8] px-3.5 py-2 rounded-xl border border-blue-100 shrink-0">
            <span>Student ID:</span>
            <span>{studentCode}</span>
          </div>
        </div>

        {/* PENDING / OVERDUE ALERT BANNER */}
        {financialSummary.pendingAmount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h12.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-amber-900">
                  {financialSummary.hasOverdue ? "Overdue Fee Alert" : "Pending Fee Notification"}
                </h3>
                <p className="text-xs text-amber-800 mt-0.5">
                  Your current pending balance is{" "}
                  <strong className="font-extrabold">{formatINR(financialSummary.pendingAmount)}</strong>.
                  {student.dueDate
                    ? ` Please complete your payment by the due date: ${formatDateDisplay(student.dueDate)}.`
                    : " Please complete your payment at your earliest convenience."}
                </p>
              </div>
            </div>

            <button
              onClick={handlePayNow}
              className="px-5 py-2.5 bg-[#F7931E] hover:bg-amber-600 text-white rounded-xl text-xs font-semibold shadow-md transition-all shrink-0 w-full sm:w-auto text-center"
            >
              Pay Now
            </button>
          </div>
        )}

        {/* 1. FINANCIAL SUMMARY CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          {/* Card 1: Total Payable */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Course Fee
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 block">
              {formatINR(financialSummary.totalPayable)}
            </span>
            <span className="text-[11px] text-slate-400 block font-light truncate">
              {assignedProgram}
            </span>
          </div>

          {/* Card 2: Paid Amount */}
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Total Paid
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700 block">
              {formatINR(financialSummary.paidAmount)}
            </span>
            <span className="text-[11px] text-emerald-600/80 block font-medium">
              Verified Receipts
            </span>
          </div>

          {/* Card 3: Pending Amount */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Pending Balance
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-700 block">
              {formatINR(financialSummary.pendingAmount)}
            </span>
            <span className="text-[11px] text-amber-600/80 block font-medium">
              Outstanding Dues
            </span>
          </div>

          {/* Card 4: Payment Status */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Overall Status
            </span>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold capitalize mt-0.5 ${
                  financialSummary.status === "Paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : financialSummary.status === "Overdue"
                    ? "bg-rose-100 text-rose-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {financialSummary.status}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-light">
              Account Financial Standing
            </span>
          </div>

        </div>

        {/* 2. FEE BREAKDOWN SECTION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0057B8]" />
              Fee Structure Breakdown
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Assigned Course
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Course / Program</span>
              <p className="font-bold text-slate-800 text-sm">{assignedProgram}</p>
              {student.academicClass && (
                <p className="text-slate-500">Class: {student.academicClass}</p>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[9px] block">Tuition & Base Fee</span>
              <p className="font-bold text-slate-800 text-sm">
                {formatINR(financialSummary.totalCourseFee > 0 ? financialSummary.totalCourseFee : financialSummary.totalPayable)}
              </p>
            </div>

            {financialSummary.registrationFee > 0 && (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Registration Fee</span>
                <p className="font-bold text-slate-800 text-sm">
                  {formatINR(financialSummary.registrationFee)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 3. PAYMENT HISTORY (UNIFIED ONLINE + OFFLINE) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-[#0057B8] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F7931E]" />
              Payment History & Receipts
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {payments.length} Transactions Recorded
            </span>
          </div>

          {payments.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-2">
              <div className="w-10 h-10 bg-slate-200/70 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                💳
              </div>
              <p className="text-xs font-semibold">No payment records available yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto font-light">
                Once an online payment or offline cash payment is recorded by VEEZNA Admin, transaction details and downloadable receipts will appear here automatically.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE VIEW */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Transaction / Payment ID</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((p) => {
                      const pStatus = (p.paymentStatus || "paid").toLowerCase();
                      const pMethod = p.paymentMethod || "Offline Cash";
                      const pTxn = p.transactionId || p.razorpayPaymentId || p.paymentId || p.docId;

                      return (
                        <tr key={p.docId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {pTxn}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {formatDateDisplay(p.paymentDate || p.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-700 capitalize">
                            {pMethod}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-800">
                            {formatINR(parseNumber(p.amount))}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                                pStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : pStatus === "failed"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {pStatus}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {pStatus === "paid" ? (
                              <button
                                onClick={() => setSelectedReceipt(p)}
                                className="px-3 py-1 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-[11px] font-semibold transition"
                              >
                                View Receipt
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">N/A</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD VIEW */}
              <div className="block md:hidden space-y-3">
                {payments.map((p) => {
                  const pStatus = (p.paymentStatus || "paid").toLowerCase();
                  const pMethod = p.paymentMethod || "Offline Cash";
                  const pTxn = p.transactionId || p.razorpayPaymentId || p.paymentId || p.docId;

                  return (
                    <div
                      key={p.docId}
                      className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <span className="font-mono font-bold text-slate-600 truncate max-w-[180px]">
                          #{pTxn}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            pStatus === "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : pStatus === "failed"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {pStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-700 pt-1">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Amount Paid</span>
                          <span className="font-extrabold text-slate-800 text-sm">
                            {formatINR(parseNumber(p.amount))}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[9px] uppercase font-bold">Method & Date</span>
                          <span className="font-medium text-slate-700 capitalize">
                            {pMethod} • {formatDateDisplay(p.paymentDate || p.createdAt)}
                          </span>
                        </div>
                      </div>

                      {pStatus === "paid" && (
                        <div className="pt-2 border-t border-slate-200/60 flex justify-end">
                          <button
                            onClick={() => setSelectedReceipt(p)}
                            className="w-full py-1.5 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-xs font-semibold text-center transition"
                          >
                            View Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5 relative my-auto">
            
            {/* Modal Close */}
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Printable Receipt Content */}
            <div className="border border-slate-200 p-6 rounded-2xl bg-slate-50/50 space-y-4 text-xs" id="veezna-official-receipt">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-black text-[#0057B8]">VEEZNA</h3>
                  <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Clarity With Care</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">
                    Official Fee Receipt
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">
                    Date: {formatDateDisplay(selectedReceipt.paymentDate || selectedReceipt.createdAt)}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-slate-700">
                <p>
                  <strong className="text-slate-500">Student Name:</strong> {studentName}
                </p>
                <p>
                  <strong className="text-slate-500">Student ID:</strong> {studentCode}
                </p>
                <p>
                  <strong className="text-slate-500">Course Program:</strong> {assignedProgram}
                </p>
                <p>
                  <strong className="text-slate-500">Transaction Ref:</strong>{" "}
                  <span className="font-mono text-slate-800 font-bold">
                    {selectedReceipt.transactionId || selectedReceipt.razorpayPaymentId || selectedReceipt.docId}
                  </span>
                </p>
                <p>
                  <strong className="text-slate-500">Payment Method:</strong>{" "}
                  <span className="capitalize">{selectedReceipt.paymentMethod || "Offline / Cash"}</span>
                </p>
                {selectedReceipt.recordedBy && (
                  <p>
                    <strong className="text-slate-500">Recorded By:</strong> {selectedReceipt.recordedBy}
                  </p>
                )}
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-slate-700 text-sm">Amount Received</span>
                <span className="font-black text-[#0057B8] text-lg">
                  {formatINR(parseNumber(selectedReceipt.amount))}
                </span>
              </div>

              <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                This is a computer-generated fee receipt issued by VEEZNA Management.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#0057B8] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md transition"
              >
                Print / Save PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}