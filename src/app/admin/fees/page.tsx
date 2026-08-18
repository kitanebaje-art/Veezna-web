"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
} from "firebase/auth";

import { db } from "@/lib/firebase";

// ============================================================
// TYPES
// ============================================================

export interface StudentFeeRecord {
  id: string;
  studentId: string;
  enrollmentId: string;
  admissionId?: string;

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
  id: string;

  paymentId?: string;

  studentId: string;
  studentName?: string;

  enrollmentId?: string;
  admissionId?: string;

  applicationNo?: string;

  amount: number;

  paymentMethod:
    | "cash"
    | "upi"
    | "bank_transfer"
    | "online"
    | string;

  paymentStatus:
    | "completed"
    | "pending"
    | "failed"
    | "refunded"
    | string;

  transactionId?: string;

  razorpayPaymentId?: string;

  receiptNumber?: string;

  course?: string;
  program?: string;

  paymentDate: string;

  createdAt?: any;
  updatedAt?: any;

  notes?: string;
}

export interface RecordPaymentFormData {
  studentId: string;
  amount: string;

  paymentMethod:
    | "cash"
    | "upi"
    | "bank_transfer"
    | "online";

  transactionId: string;
  notes: string;
  paymentDate: string;
}

// ============================================================
// HELPERS
// ============================================================

export function isPaymentSuccessful(
  statusStr: string | undefined
): boolean {
  if (!statusStr) return false;

  const s = statusStr.toLowerCase().trim();

  return s === "completed";
}

export function normalizeDateString(val: any): string {
  if (!val) return "N/A";

  try {
    if (
      typeof val === "object" &&
      typeof val.toDate === "function"
    ) {
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

export function formatINR(val: number): string {
  if (
    isNaN(val) ||
    val === null ||
    val === undefined
  ) {
    return "₹0";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

// ============================================================
// PAGE
// ============================================================

export default function FeesAndPaymentsPage() {
  // ============================================================
  // STATE
  // ============================================================

  const [students, setStudents] = useState<StudentFeeRecord[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [programFilter, setProgramFilter] = useState("ALL");

  // Record payment modal
  const [isRecordModalOpen, setIsRecordModalOpen] =
    useState(false);

  const [paymentFormData, setPaymentFormData] =
    useState<RecordPaymentFormData>({
      studentId: "",
      amount: "",
      paymentMethod: "cash",
      transactionId: "",
      notes: "",
      paymentDate: new Date()
        .toISOString()
        .split("T")[0],
    });

  const [
    selectedStudentForPayment,
    setSelectedStudentForPayment,
  ] = useState<StudentFeeRecord | null>(null);

  const [studentLookupError, setStudentLookupError] =
    useState<string | null>(null);

  const [formError, setFormError] =
    useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // Details modal
  const [isDetailsModalOpen, setIsDetailsModalOpen] =
    useState(false);

  const [
    selectedStudentDetails,
    setSelectedStudentDetails,
  ] = useState<StudentFeeRecord | null>(null);

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchFeeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // --------------------------------------------------------
      // 1. PAYMENTS
      // --------------------------------------------------------

      const paymentsSnap = await getDocs(
        collection(db, "payments")
      );

      const paymentList: PaymentTransaction[] = [];

      paymentsSnap.forEach((docSnap) => {
        const d = docSnap.data();

        const amount = Number(
          d.amount ??
            d.totalAmount ??
            d.paidAmount ??
            0
        );

        paymentList.push({
          id: docSnap.id,

          paymentId:
            d.paymentId || docSnap.id,

          studentId:
            d.studentId ||
            d.studentID ||
            d.userId ||
            "",

          studentName:
            d.studentName ||
            d.name ||
            d.fullName ||
            "N/A",

          enrollmentId:
            d.enrollmentId || "",

          admissionId:
            d.admissionId || "",

          applicationNo:
            d.applicationNo ||
            d.appNo ||
            "",

          amount: Number.isFinite(amount)
            ? amount
            : 0,

          paymentMethod:
            d.paymentMethod ||
            "cash",

          paymentStatus:
            d.paymentStatus ||
            "completed",

          transactionId:
            d.transactionId ||
            "",

          razorpayPaymentId:
            d.razorpayPaymentId ||
            d.razorpay_payment_id ||
            "",

          receiptNumber:
            d.receiptNumber ||
            "",

          course:
            d.course ||
            d.program ||
            "",

          program:
            d.program ||
            d.course ||
            "",

          paymentDate:
            normalizeDateString(
              d.paymentDate ||
                d.createdAt ||
                d.date
            ),

          createdAt: d.createdAt,
          updatedAt: d.updatedAt,

          notes:
            d.notes ||
            d.remarks ||
            "",
        });
      });

      // Newest first
      paymentList.sort((a, b) => {
        const timeA =
          a.createdAt?.seconds || 0;

        const timeB =
          b.createdAt?.seconds || 0;

        return timeB - timeA;
      });

      setPayments(paymentList);

      // --------------------------------------------------------
      // 2. PAYMENT TOTAL PER STUDENT
      // --------------------------------------------------------

      const paymentsPerStudent: Record<
        string,
        number
      > = {};

      paymentList.forEach((payment) => {
        if (
          payment.studentId &&
          isPaymentSuccessful(
            payment.paymentStatus
          )
        ) {
          const key = payment.studentId
            .trim()
            .toLowerCase();

          paymentsPerStudent[key] =
            (paymentsPerStudent[key] || 0) +
            payment.amount;
        }
      });

      // --------------------------------------------------------
      // 3. STUDENTS
      // --------------------------------------------------------

      const studentsSnap = await getDocs(
        collection(db, "students")
      );

      // --------------------------------------------------------
      // 4. ENROLLMENTS
      // --------------------------------------------------------

      const enrollmentsSnap = await getDocs(
        collection(db, "enrollments")
      );

      const enrollmentsByStudent: Record<
        string,
        any[]
      > = {};

      enrollmentsSnap.forEach((docSnap) => {
        const d = docSnap.data();

        const studentId =
          d.studentId ||
          d.studentID ||
          "";

        if (!studentId) return;

        const key = String(studentId)
          .trim()
          .toLowerCase();

        if (!enrollmentsByStudent[key]) {
          enrollmentsByStudent[key] = [];
        }

        enrollmentsByStudent[key].push({
          id: docSnap.id,
          ...d,
        });
      });

      // --------------------------------------------------------
      // 5. BUILD STUDENT FEE RECORDS
      // --------------------------------------------------------

      const studentList: StudentFeeRecord[] =
        [];

      studentsSnap.forEach((docSnap) => {
        const d = docSnap.data();

        const studentId =
          d.studentId ||
          d.studentID ||
          d.regNo ||
          d.id ||
          docSnap.id;

        const studentName =
          d.fullName ||
          d.name ||
          d.studentName ||
          "Unnamed Student";

        const mobile =
          d.mobile ||
          d.phone ||
          d.phoneNumber ||
          "N/A";

        const academicClass =
          d.academicClass ||
          d.class ||
          d.grade ||
          "N/A";

        const program =
          d.program ||
          d.course ||
          d.department ||
          "N/A";

        const studentKey = String(studentId)
          .trim()
          .toLowerCase();

        // ------------------------------------------------------
        // FIND ENROLLMENT
        // ------------------------------------------------------

        const studentEnrollments =
          enrollmentsByStudent[
            studentKey
          ] || [];

        const enrollment =
          studentEnrollments[0];

        const enrollmentId =
          d.enrollmentId ||
          enrollment?.id ||
          "";

        const admissionId =
          d.admissionId ||
          enrollment?.admissionId ||
          "";

        // ------------------------------------------------------
        // TOTAL FEE
        // ------------------------------------------------------

        const totalFee = Number(
          d.totalFee ??
            d.totalFees ??
            d.courseFee ??
            enrollment?.totalFee ??
            enrollment?.totalFees ??
            enrollment?.courseFee ??
            0
        );

        // ------------------------------------------------------
        // PAID FEE
        // ------------------------------------------------------

        const paymentCollectionTotal =
          paymentsPerStudent[
            studentKey
          ] || 0;

        const legacyPaid = Number(
          d.paidFee ??
            d.feePaid ??
            d.paidAmount ??
            0
        );

        const paidFee = Math.max(
          legacyPaid,
          paymentCollectionTotal
        );

        // ------------------------------------------------------
        // PENDING
        // ------------------------------------------------------

        const pendingFee = Math.max(
          0,
          totalFee - paidFee
        );

        // ------------------------------------------------------
        // STATUS
        // ------------------------------------------------------

        let status:
          | "paid"
          | "pending"
          | "partial"
          | "overdue" = "pending";

        if (
          totalFee > 0 &&
          paidFee >= totalFee
        ) {
          status = "paid";
        } else if (
          paidFee > 0 &&
          paidFee < totalFee
        ) {
          status = "partial";
        }

        studentList.push({
          id: docSnap.id,

          studentId: String(studentId),

          enrollmentId,

          ...(admissionId
            ? { admissionId }
            : {}),

          name: String(studentName),

          mobile: String(mobile),

          academicClass:
            String(academicClass),

          program: String(program),

          totalFee,

          paidFee,

          pendingFee,

          status,

          rawStudentDoc: d,
        });
      });

      setStudents(studentList);
    } catch (err: any) {
      console.error(
        "[Fees] Firestore loading error:",
        err
      );

      setError(
        err?.message ||
          "Failed to load fee and payment records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeeData();
  }, [fetchFeeData]);

  // ============================================================
  // STUDENT LOOKUP
  // ============================================================

  const handleStudentIdChange = (
    idInput: string
  ) => {
    setPaymentFormData((prev) => ({
      ...prev,
      studentId: idInput,
    }));

    setStudentLookupError(null);

    const trimmed = idInput.trim();

    if (!trimmed) {
      setSelectedStudentForPayment(null);
      return;
    }

    const matched = students.find(
      (student) =>
        student.studentId
          .toLowerCase() ===
          trimmed.toLowerCase() ||
        student.id
          .toLowerCase() ===
          trimmed.toLowerCase()
    );

    if (matched) {
      setSelectedStudentForPayment(
        matched
      );

      setStudentLookupError(null);

      // Auto-fill pending amount
      setPaymentFormData((prev) => ({
        ...prev,
        amount:
          matched.pendingFee > 0
            ? String(matched.pendingFee)
            : "",
      }));
    } else {
      setSelectedStudentForPayment(null);

      setStudentLookupError(
        "Student ID not found in database."
      );
    }
  };

  // ============================================================
  // OPEN RECORD PAYMENT
  // ============================================================

  const handleOpenRecordModal = (
    student?: StudentFeeRecord
  ) => {
    setFormError(null);
    setStudentLookupError(null);

    const transactionId =
      `TXN-OFF-${Date.now()
        .toString()
        .slice(-8)}`;

    if (student) {
      setSelectedStudentForPayment(
        student
      );

      setPaymentFormData({
        studentId: student.studentId,

        amount:
          student.pendingFee > 0
            ? String(student.pendingFee)
            : "",

        paymentMethod: "cash",

        transactionId,

        notes:
          "Offline fee payment",

        paymentDate:
          new Date()
            .toISOString()
            .split("T")[0],
      });
    } else {
      setSelectedStudentForPayment(null);

      setPaymentFormData({
        studentId: "",
        amount: "",
        paymentMethod: "cash",
        transactionId,
        notes: "Offline fee payment",
        paymentDate:
          new Date()
            .toISOString()
            .split("T")[0],
      });
    }

    setIsRecordModalOpen(true);
  };

  // ============================================================
  // RECORD PAYMENT
  // ============================================================

  const handleRecordPaymentSubmit =
    async (
      e: React.FormEvent
    ) => {
      e.preventDefault();

      if (isSubmitting) return;

      setFormError(null);

      // --------------------------------------------------------
      // VALIDATION
      // --------------------------------------------------------

      if (!selectedStudentForPayment) {
        setFormError(
          "Please select a valid student."
        );
        return;
      }

      if (
        !selectedStudentForPayment
          .enrollmentId
      ) {
        setFormError(
          "This student does not have an enrollment record. Please create/verify the enrollment before recording a payment."
        );
        return;
      }

      const amountNum = Number(
        paymentFormData.amount
      );

      if (
        !Number.isFinite(amountNum) ||
        amountNum <= 0
      ) {
        setFormError(
          "Please enter a valid payment amount greater than ₹0."
        );
        return;
      }

      if (
        amountNum >
        selectedStudentForPayment.pendingFee
      ) {
        setFormError(
          `Amount ${formatINR(
            amountNum
          )} exceeds the pending balance of ${formatINR(
            selectedStudentForPayment.pendingFee
          )}.`
        );

        return;
      }

      if (
        !paymentFormData.transactionId.trim()
      ) {
        setFormError(
          "Transaction ID / receipt reference is required."
        );

        return;
      }

      setIsSubmitting(true);

      try {
        // ------------------------------------------------------
        // FIREBASE AUTH TOKEN
        // ------------------------------------------------------

        const auth = getAuth();

        const currentUser =
          auth.currentUser;

        if (!currentUser) {
          throw new Error(
            "Admin session expired. Please login again."
          );
        }

        const idToken =
          await currentUser.getIdToken();

        // ------------------------------------------------------
        // CALL EXISTING SECURE API
        //
        // /api/admin/record-payment
        // ------------------------------------------------------

        const response = await fetch(
          "/api/admin/record-payment",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${idToken}`,
            },

            body: JSON.stringify({
              studentId:
                selectedStudentForPayment.studentId,

              enrollmentId:
                selectedStudentForPayment.enrollmentId,

              admissionId:
                selectedStudentForPayment.admissionId ||
                undefined,

              amount: amountNum,

              paymentMethod:
                paymentFormData.paymentMethod,

              paymentStatus:
                "completed",

              transactionId:
                paymentFormData.transactionId.trim(),

              notes:
                paymentFormData.notes.trim() ||
                "Admin recorded payment",
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Unable to record payment."
          );
        }

        // ------------------------------------------------------
        // SUCCESS
        // ------------------------------------------------------

        setIsRecordModalOpen(false);

        setSelectedStudentForPayment(
          null
        );

        setFormError(null);

        await fetchFeeData();
      } catch (err: any) {
        console.error(
          "[Fees] Payment recording error:",
          err
        );

        setFormError(
          err?.message ||
            "Failed to record payment."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo(() => {
    let totalFees = 0;
    let totalCollected = 0;

    students.forEach((student) => {
      totalFees += student.totalFee;
      totalCollected += student.paidFee;
    });

    return {
      totalFees,

      totalCollected,

      totalPending: Math.max(
        0,
        totalFees - totalCollected
      ),

      totalTransactions:
        payments.length,
    };
  }, [students, payments]);

  // ============================================================
  // PROGRAM FILTER
  // ============================================================

  const programOptions = useMemo(() => {
    const programs = new Set<string>();

    students.forEach((student) => {
      if (
        student.program &&
        student.program !== "N/A"
      ) {
        programs.add(
          student.program
        );
      }
    });

    return Array.from(programs).sort();
  }, [students]);

  // ============================================================
  // FILTER STUDENTS
  // ============================================================

  const filteredStudents =
    useMemo(() => {
      return students.filter(
        (student) => {
          // Program
          if (
            programFilter !== "ALL" &&
            student.program !==
              programFilter
          ) {
            return false;
          }

          // Status
          if (
            statusFilter !== "ALL"
          ) {
            if (
              statusFilter ===
                "paid" &&
              student.status !==
                "paid"
            ) {
              return false;
            }

            if (
              statusFilter ===
                "pending" &&
              student.status !==
                "pending" &&
              student.status !==
                "partial"
            ) {
              return false;
            }
          }

          // Search
          if (
            searchTerm.trim()
          ) {
            const term =
              searchTerm
                .toLowerCase()
                .trim();

            const matchesStudent =
              student.studentId
                .toLowerCase()
                .includes(term) ||
              student.name
                .toLowerCase()
                .includes(term) ||
              student.mobile
                .toLowerCase()
                .includes(term);

            const matchesPayment =
              payments.some(
                (payment) => {
                  if (
                    payment.studentId
                      .toLowerCase() !==
                    student.studentId
                      .toLowerCase()
                  ) {
                    return false;
                  }

                  return (
                    payment.transactionId
                      ?.toLowerCase()
                      .includes(
                        term
                      ) ||
                    payment.paymentId
                      ?.toLowerCase()
                      .includes(
                        term
                      ) ||
                    payment.razorpayPaymentId
                      ?.toLowerCase()
                      .includes(
                        term
                      ) ||
                    payment.receiptNumber
                      ?.toLowerCase()
                      .includes(
                        term
                      )
                  );
                }
              );

            return (
              matchesStudent ||
              matchesPayment
            );
          }

          return true;
        }
      );
    }, [
      students,
      payments,
      searchTerm,
      statusFilter,
      programFilter,
    ]);

  // ============================================================
  // SELECTED STUDENT PAYMENTS
  // ============================================================

  const selectedStudentPayments =
    useMemo(() => {
      if (
        !selectedStudentDetails
      ) {
        return [];
      }

      return payments.filter(
        (payment) =>
          payment.studentId
            .toLowerCase() ===
          selectedStudentDetails.studentId
            .toLowerCase()
      );
    }, [
      payments,
      selectedStudentDetails,
    ]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">

          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link
                href="/admin/dashboard"
                className="hover:text-[#0057B8] transition font-medium"
              >
                ← Back to Dashboard
              </Link>

              <span>/</span>

              <span className="text-slate-800 font-semibold">
                Fees &amp; Payments
              </span>
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Fees &amp; Payments Management
            </h1>

            <p className="text-slate-600 text-sm mt-1">
              Manage student fee collection,
              Razorpay transactions and
              offline payments from one place.
            </p>
          </div>

          <button
            onClick={() =>
              handleOpenRecordModal()
            }
            className="inline-flex items-center justify-center bg-[#0057B8] hover:bg-[#004494] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition cursor-pointer text-sm"
          >
            <span className="mr-2 text-lg font-bold">
              +
            </span>

            Record Payment
          </button>
        </div>

        {/* NAVIGATION */}

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

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center justify-between gap-3">

          <div className="flex items-center gap-3">
            <span className="text-xl">
              ⚠️
            </span>

            <p className="text-sm font-medium">
              {error}
            </p>
          </div>

          <button
            onClick={fetchFeeData}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* ====================================================== */}
      {/* STATISTICS */}
      {/* ====================================================== */}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Fees Billed
          </p>

          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatINR(
              stats.totalFees
            )}
          </p>

          <span className="text-[11px] text-slate-500 mt-1 block">
            Expected revenue
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Collected
          </p>

          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatINR(
              stats.totalCollected
            )}
          </p>

          <span className="text-[11px] text-emerald-700/80 font-medium mt-1 block">
            Completed payments
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-amber-500">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Pending
          </p>

          <p className="text-2xl font-extrabold text-amber-600 mt-1">
            {formatINR(
              stats.totalPending
            )}
          </p>

          <span className="text-[11px] text-amber-700/80 font-medium mt-1 block">
            Outstanding balances
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-[#0057B8]">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Transactions
          </p>

          <p className="text-2xl font-extrabold text-[#0057B8] mt-1">
            {stats.totalTransactions}
          </p>

          <span className="text-[11px] text-slate-500 mt-1 block">
            Online &amp; offline records
          </span>
        </div>

      </section>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <section className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

          <div className="md:col-span-2 relative">

            <input
              type="text"
              placeholder="Search Student ID, Name, Mobile, Transaction ID, Receipt..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
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

          <div>
            <select
              value={programFilter}
              onChange={(e) =>
                setProgramFilter(
                  e.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">
                All Programs / Courses
              </option>

              {programOptions.map(
                (program) => (
                  <option
                    key={program}
                    value={program}
                  >
                    {program}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="flex gap-2">

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0057B8] text-sm text-slate-800 bg-white"
            >
              <option value="ALL">
                All Fee Status
              </option>

              <option value="paid">
                Fully Paid
              </option>

              <option value="pending">
                Pending / Partial
              </option>
            </select>

            <button
              onClick={fetchFeeData}
              title="Refresh Data"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-slate-700 transition"
            >
              ↻
            </button>

          </div>

        </div>
      </section>

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">

          <div className="w-10 h-10 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin mb-4" />

          <p className="text-slate-500 text-sm font-medium">
            Synchronizing fee records...
          </p>

        </div>
      ) : filteredStudents.length === 0 ? (

        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">

          <div className="w-16 h-16 bg-blue-50 text-[#0057B8] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
            💳
          </div>

          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No Fee Records Found
          </h3>

          <p className="text-slate-500 text-sm max-w-md mx-auto">
            {searchTerm ||
            statusFilter !== "ALL" ||
            programFilter !== "ALL"
              ? "No student records match the selected filters."
              : "No student records are currently available in Firestore."}
          </p>

        </div>
      ) : (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full text-left border-collapse text-xs sm:text-sm">

              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">

                  <th className="p-4">
                    Student Info
                  </th>

                  <th className="p-4">
                    Program / Course
                  </th>

                  <th className="p-4">
                    Total Fee
                  </th>

                  <th className="p-4">
                    Paid Fee
                  </th>

                  <th className="p-4">
                    Pending Fee
                  </th>

                  <th className="p-4">
                    Status
                  </th>

                  <th className="p-4 text-right">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredStudents.map(
                  (student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 transition"
                    >

                      <td className="p-4">

                        <div className="font-bold text-slate-900">
                          {student.name}
                        </div>

                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">

                          <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 text-[10px]">
                            {student.studentId}
                          </span>

                          <span>
                            • {student.mobile}
                          </span>

                        </div>

                        {!student.enrollmentId && (
                          <div className="mt-1 text-[10px] font-semibold text-red-600">
                            ⚠ Enrollment missing
                          </div>
                        )}

                      </td>

                      <td className="p-4 text-slate-700 font-medium">

                        {student.program}

                        <div className="text-[11px] text-slate-400 font-normal">
                          {student.academicClass}
                        </div>

                      </td>

                      <td className="p-4 font-semibold text-slate-900">
                        {formatINR(
                          student.totalFee
                        )}
                      </td>

                      <td className="p-4 font-semibold text-emerald-600">
                        {formatINR(
                          student.paidFee
                        )}
                      </td>

                      <td className="p-4 font-semibold text-amber-600">
                        {formatINR(
                          student.pendingFee
                        )}
                      </td>

                      <td className="p-4">

                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                            student.status ===
                            "paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : student.status ===
                                "partial"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {student.status ===
                          "paid"
                            ? "Paid"
                            : student.status ===
                              "partial"
                            ? "Partial"
                            : "Pending"}
                        </span>

                      </td>

                      <td className="p-4 text-right">

                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() => {
                              setSelectedStudentDetails(
                                student
                              );

                              setIsDetailsModalOpen(
                                true
                              );
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            View Details
                          </button>

                          {student.pendingFee >
                            0 && (
                            <button
                              onClick={() =>
                                handleOpenRecordModal(
                                  student
                                )
                              }
                              disabled={
                                !student.enrollmentId
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-white bg-[#0057B8] hover:bg-[#004494] rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Collect Fee
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>
      )}

      {/* ====================================================== */}
      {/* RECORD PAYMENT MODAL */}
      {/* ====================================================== */}

      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">

            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Record Payment
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Secure admin payment entry
                </p>
              </div>

              <button
                onClick={() =>
                  setIsRecordModalOpen(
                    false
                  )
                }
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

            <form
              onSubmit={
                handleRecordPaymentSubmit
              }
              className="space-y-4 text-xs"
            >

              {/* STUDENT */}

              <div>

                <label className="block font-semibold text-slate-700 mb-1">
                  Student ID{" "}
                  <span className="text-red-500">
                    *
                  </span>
                </label>

                <input
                  type="text"
                  required
                  placeholder="Enter Student ID"
                  value={
                    paymentFormData.studentId
                  }
                  onChange={(e) =>
                    handleStudentIdChange(
                      e.target.value
                    )
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                />

                {studentLookupError && (
                  <p className="text-red-500 text-[11px] mt-1 font-medium">
                    {studentLookupError}
                  </p>
                )}

                {selectedStudentForPayment && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl flex justify-between items-center">

                    <div>
                      <p className="font-bold text-sm text-blue-900">
                        {
                          selectedStudentForPayment.name
                        }
                      </p>

                      <p className="text-[11px] text-blue-700">
                        {
                          selectedStudentForPayment.program
                        }
                      </p>

                      <p className="text-[10px] text-blue-600 mt-1">
                        Enrollment:{" "}
                        {
                          selectedStudentForPayment.enrollmentId
                        }
                      </p>
                    </div>

                    <div className="text-right">

                      <span className="text-[10px] text-blue-600 block uppercase font-bold">
                        Pending
                      </span>

                      <span className="font-extrabold text-sm text-amber-700">
                        {formatINR(
                          selectedStudentForPayment.pendingFee
                        )}
                      </span>

                    </div>

                  </div>
                )}

              </div>

              {/* AMOUNT + METHOD */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Amount (₹){" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    required
                    min="1"
                    max={
                      selectedStudentForPayment?.pendingFee ||
                      undefined
                    }
                    value={
                      paymentFormData.amount
                    }
                    onChange={(e) =>
                      setPaymentFormData(
                        (prev) => ({
                          ...prev,
                          amount:
                            e.target.value,
                        })
                      )
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-bold"
                  />

                </div>

                <div>

                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Method{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <select
                    value={
                      paymentFormData.paymentMethod
                    }
                    onChange={(e) =>
                      setPaymentFormData(
                        (prev) => ({
                          ...prev,
                          paymentMethod:
                            e.target
                              .value as RecordPaymentFormData["paymentMethod"],
                        })
                      )
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm bg-white"
                  >
                    <option value="cash">
                      Cash
                    </option>

                    <option value="upi">
                      UPI / GPay / PhonePe
                    </option>

                    <option value="bank_transfer">
                      Bank Transfer / NEFT / IMPS
                    </option>

                    <option value="online">
                      Online
                    </option>
                  </select>

                </div>

              </div>

              {/* TRANSACTION + DATE */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block font-semibold text-slate-700 mb-1">
                    Transaction / Receipt Reference{" "}
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      paymentFormData.transactionId
                    }
                    onChange={(e) =>
                      setPaymentFormData(
                        (prev) => ({
                          ...prev,
                          transactionId:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm font-mono"
                  />

                </div>

                <div>

                  <label className="block font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>

                  <input
                    type="date"
                    required
                    value={
                      paymentFormData.paymentDate
                    }
                    onChange={(e) =>
                      setPaymentFormData(
                        (prev) => ({
                          ...prev,
                          paymentDate:
                            e.target
                              .value,
                        })
                      )
                    }
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                  />

                </div>

              </div>

              {/* NOTES */}

              <div>

                <label className="block font-semibold text-slate-700 mb-1">
                  Notes
                </label>

                <textarea
                  rows={2}
                  placeholder="Optional payment notes..."
                  value={
                    paymentFormData.notes
                  }
                  onChange={(e) =>
                    setPaymentFormData(
                      (prev) => ({
                        ...prev,
                        notes:
                          e.target
                            .value,
                      })
                    )
                  }
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0057B8] outline-none text-sm"
                />

              </div>

              {/* BUTTONS */}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={() =>
                    setIsRecordModalOpen(
                      false
                    )
                  }
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedStudentForPayment ||
                    !selectedStudentForPayment.enrollmentId
                  }
                  className="px-5 py-2 bg-[#0057B8] text-white font-semibold rounded-xl hover:bg-[#004494] shadow-md transition disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Recording..."
                    : "Save Payment"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ====================================================== */}
      {/* DETAILS MODAL */}
      {/* ====================================================== */}

      {isDetailsModalOpen &&
        selectedStudentDetails && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full p-6 my-8">

              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">

                <div>

                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-blue-50 text-[#0057B8] font-mono">
                    {
                      selectedStudentDetails.studentId
                    }
                  </span>

                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    {
                      selectedStudentDetails.name
                    }
                  </h2>

                </div>

                <button
                  onClick={() =>
                    setIsDetailsModalOpen(
                      false
                    )
                  }
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>

              </div>

              {/* SUMMARY */}

              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-center text-xs">

                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">
                    Total Billed
                  </p>

                  <p className="text-base font-extrabold text-slate-900 mt-0.5">
                    {formatINR(
                      selectedStudentDetails.totalFee
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">
                    Total Paid
                  </p>

                  <p className="text-base font-extrabold text-emerald-600 mt-0.5">
                    {formatINR(
                      selectedStudentDetails.paidFee
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-semibold uppercase text-[10px]">
                    Pending Balance
                  </p>

                  <p className="text-base font-extrabold text-amber-600 mt-0.5">
                    {formatINR(
                      selectedStudentDetails.pendingFee
                    )}
                  </p>
                </div>

              </div>

              {/* HISTORY */}

              <h3 className="font-bold text-slate-800 text-sm mb-3">
                Transaction History
              </h3>

              {selectedStudentPayments.length ===
              0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-slate-500 font-medium">
                    No recorded transactions found.
                  </p>
                </div>
              ) : (

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">

                  {selectedStudentPayments.map(
                    (payment) => {
                      const successful =
                        isPaymentSuccessful(
                          payment.paymentStatus
                        );

                      return (
                        <div
                          key={payment.id}
                          className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3"
                        >

                          <div>

                            <div className="flex items-center gap-2 flex-wrap">

                              <span className="font-mono font-bold text-slate-800">
                                {payment.transactionId ||
                                  payment.paymentId}
                              </span>

                              <span className="uppercase text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {
                                  payment.paymentMethod
                                }
                              </span>

                              {payment.receiptNumber && (
                                <span className="text-[9px] font-bold text-blue-600">
                                  {
                                    payment.receiptNumber
                                  }
                                </span>
                              )}

                            </div>

                            <p className="text-slate-500 text-[11px] mt-1">
                              Date:{" "}
                              {
                                payment.paymentDate
                              }

                              {payment.notes &&
                                ` • ${payment.notes}`}
                            </p>

                            {payment.razorpayPaymentId && (
                              <p className="text-[10px] font-mono text-blue-600 mt-0.5">
                                Razorpay ID:{" "}
                                {
                                  payment.razorpayPaymentId
                                }
                              </p>
                            )}

                          </div>

                          <div className="text-right">

                            <span className="font-extrabold text-sm text-slate-900 block">
                              {formatINR(
                                payment.amount
                              )}
                            </span>

                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded capitalize mt-0.5 ${
                                successful
                                  ? "bg-emerald-50 text-emerald-700"
                                  : payment.paymentStatus ===
                                    "pending"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {
                                payment.paymentStatus
                              }
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

              <div className="mt-6 pt-3 border-t border-slate-100 flex justify-end">

                <button
                  onClick={() =>
                    setIsDetailsModalOpen(
                      false
                    )
                  }
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