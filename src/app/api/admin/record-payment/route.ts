// src/app/api/admin/record-payment/route.ts

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { adminDb } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/auth-guard";

import type {
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // ============================================================
    // 1. VERIFY ADMIN
    // ============================================================

    const authHeader = req.headers.get("authorization");

    const authCheck = await verifyAdminToken(authHeader);

    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.error || "Unauthorized",
        },
        { status: 403 }
      );
    }

    const adminUid = authCheck.uid || "dev-admin-uid";

    // ============================================================
    // 2. READ REQUEST
    // ============================================================

    let body: any;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or empty request body.",
        },
        { status: 400 }
      );
    }

    const {
      studentId,
      enrollmentId,
      admissionId,
      amount,
      paymentMethod,
      paymentStatus,
      transactionId,
      notes,
    } = body;

    // ============================================================
    // 3. VALIDATION
    // ============================================================

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Student ID is required.",
        },
        { status: 400 }
      );
    }

    if (!enrollmentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment ID is required.",
        },
        { status: 400 }
      );
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid payment amount.",
        },
        { status: 400 }
      );
    }

    const allowedMethods: PaymentMethod[] = [
      "online",
      "upi",
      "cash",
      "bank_transfer",
    ];

    const selectedPaymentMethod: PaymentMethod =
      allowedMethods.includes(paymentMethod)
        ? paymentMethod
        : "cash";

    const allowedStatuses: PaymentStatus[] = [
      "completed",
      "pending",
      "failed",
      "refunded",
    ];

    const selectedPaymentStatus: PaymentStatus =
      allowedStatuses.includes(paymentStatus)
        ? paymentStatus
        : "completed";

    // ============================================================
    // 4. CHECK STUDENT
    // ============================================================

    const studentRef = adminDb
      .collection("students")
      .doc(studentId);

    const studentSnap = await studentRef.get();

    if (!studentSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Student not found.",
        },
        { status: 404 }
      );
    }

    // ============================================================
    // 5. CHECK ENROLLMENT
    // ============================================================

    const enrollmentRef = adminDb
      .collection("enrollments")
      .doc(enrollmentId);

    const enrollmentSnap = await enrollmentRef.get();

    if (!enrollmentSnap.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment not found.",
        },
        { status: 404 }
      );
    }

    const enrollmentData = enrollmentSnap.data();

    if (enrollmentData?.studentId !== studentId) {
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment does not belong to this student.",
        },
        { status: 400 }
      );
    }

    // ============================================================
    // 6. GENERATE PAYMENT IDs
    // ============================================================

    const timestamp = Date.now();

    const paymentId = `PAY-${timestamp}`;

    const receiptNumber =
      `RCP-${timestamp.toString().slice(-8)}`;

    const now = new Date().toISOString();

    // ============================================================
    // 7. PAYMENT DOCUMENT
    // ============================================================

    const paymentDoc: PaymentDocument = {
      paymentId,

      studentId,

      enrollmentId,

      ...(admissionId ? { admissionId } : {}),

      amount: numericAmount,

      paymentMethod: selectedPaymentMethod,

      paymentStatus: selectedPaymentStatus,

      paymentDate: now,

      ...(transactionId
        ? {
            transactionId: String(transactionId).trim(),
          }
        : {}),

      receiptNumber,

      recordedBy: adminUid,

      ...(notes
        ? {
            notes: String(notes).trim(),
          }
        : {}),

      createdAt: now,
    };

    // ============================================================
    // 8. FIRESTORE BATCH
    // ============================================================

    const batch = adminDb.batch();

    const paymentRef = adminDb
      .collection("payments")
      .doc(paymentId);

    batch.set(paymentRef, paymentDoc);

    // ============================================================
    // 9. UPDATE ADMISSION PAYMENT
    // ============================================================

    if (admissionId) {
      const admissionRef = adminDb
        .collection("admissions")
        .doc(admissionId);

      const admissionSnap = await admissionRef.get();

      if (admissionSnap.exists) {
        const admissionData = admissionSnap.data();

        const previousPaid =
          Number(admissionData?.registrationFeePaid) || 0;

        batch.update(admissionRef, {
          registrationFeePaid:
            previousPaid + numericAmount,

          updatedAt: now,
        });
      }
    }

    // ============================================================
    // 10. COMMIT
    // ============================================================

    await batch.commit();

    // ============================================================
    // 11. SUCCESS
    // ============================================================

    return NextResponse.json(
      {
        success: true,

        message: "Payment recorded successfully.",

        payment: {
          paymentId,
          studentId,
          enrollmentId,
          admissionId: admissionId || null,
          amount: numericAmount,
          paymentMethod: selectedPaymentMethod,
          paymentStatus: selectedPaymentStatus,
          transactionId:
            transactionId || null,
          receiptNumber,
          recordedBy: adminUid,
          paymentDate: now,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "[Record Payment] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to record payment.",
        code:
          error?.code ||
          "internal/error",
      },
      { status: 500 }
    );
  }
}