// src/app/api/admin/create-student/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/auth-guard";
import { FieldValue } from "firebase-admin/firestore";

import type {
  UserDocument,
  StudentDocument,
  AdmissionDocument,
  EnrollmentDocument,
  PaymentDocument,
} from "@/types/database";

export const runtime = "nodejs";

function cleanMobile(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "").slice(-10);
}

function createStudentPassword(mobile: string): string {
  return `Veezna@${mobile.slice(-4)}`;
}

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1. VERIFY ADMIN
    // ---------------------------------------------------------

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

    // ---------------------------------------------------------
    // 2. READ REQUEST
    // ---------------------------------------------------------

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
      name,
      mobile,
      email,
      password,
      dob,
      gender,
      parentName,
      parentMobile,
      address,
      academicClass,
      profilePhotoUrl,
      courseId,
      batchId,
      totalFee,
      registrationFeePaid,
      paymentMethod,
      transactionId,
      notes,
    } = body;

    // ---------------------------------------------------------
    // 3. VALIDATION
    // ---------------------------------------------------------

    const cleanStudentMobile = cleanMobile(mobile);

    if (
      !name?.trim() ||
      !cleanStudentMobile ||
      !academicClass ||
      !courseId ||
      !batchId
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Name, mobile, class, course, and batch are required.",
        },
        { status: 400 }
      );
    }

    if (cleanStudentMobile.length !== 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid 10-digit mobile number.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4. LOGIN CREDENTIALS
    //
    // IMPORTANT:
    // Every student gets a stable internal login email based
    // on mobile number.
    //
    // Example:
    // 9876543210
    // becomes
    // 9876543210@veezna.local
    // ---------------------------------------------------------

    const loginEmail =
      `${cleanStudentMobile}@veezna.local`.toLowerCase();

    const defaultPassword =
      typeof password === "string" && password.trim().length >= 6
        ? password.trim()
        : createStudentPassword(cleanStudentMobile);

    let studentUid = "";

    // ---------------------------------------------------------
    // 5. FIREBASE AUTH
    // ---------------------------------------------------------

    try {
      let existingUser;

      try {
        existingUser =
          await adminAuth.getUserByEmail(loginEmail);
      } catch (lookupError: any) {
        if (lookupError?.code !== "auth/user-not-found") {
          throw lookupError;
        }
      }

      if (existingUser) {
        // Existing student:
        // update password so the password shown to Admin
        // is always the actual Firebase password.

        const updatedUser =
          await adminAuth.updateUser(existingUser.uid, {
            password: defaultPassword,
            displayName: String(name).trim(),
            disabled: false,
          });

        studentUid = updatedUser.uid;
      } else {
        // New student

        const newAuthUser =
          await adminAuth.createUser({
            email: loginEmail,
            password: defaultPassword,
            displayName: String(name).trim(),
            emailVerified: false,
            disabled: false,
          });

        studentUid = newAuthUser.uid;
      }

      // Student role
      await adminAuth.setCustomUserClaims(studentUid, {
        role: "student",
      });
    } catch (authError: any) {
      console.error(
        "[Create Student] Firebase Authentication Error:",
        authError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            authError?.message ||
            "Unable to create Firebase Authentication account.",
          code:
            authError?.code ||
            "auth/unknown",
        },
        { status: 500 }
      );
    }

    // ---------------------------------------------------------
    // 6. IDS
    // ---------------------------------------------------------

    const timestamp = Date.now();

    const studentId =
      `VEZ-${new Date().getFullYear()}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;

    const admissionId = `ADM-${timestamp}`;
    const enrollmentId = `ENR-${timestamp}`;
    const paymentId = `PAY-${timestamp}`;

    const receiptNumber =
      `RCP-${timestamp.toString().slice(-6)}`;

    const now = new Date().toISOString();

    // ---------------------------------------------------------
    // 7. USER DOCUMENT
    // ---------------------------------------------------------

    const userDoc: UserDocument = {
      uid: studentUid,
      email: loginEmail,
      mobile: cleanStudentMobile,
      role: "student",
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    // ---------------------------------------------------------
    // 8. STUDENT DOCUMENT
    // ---------------------------------------------------------

    const studentDoc: StudentDocument = {
      studentId,
      uid: studentUid,
      name: String(name).trim(),
      mobile: cleanStudentMobile,

      // Login email is always the internal Veezna email.
      email: loginEmail,

      dob: dob || "",
      gender: gender || "male",
      parentName: parentName || "",
      parentMobile: parentMobile || "",
      address: address || "",
      profilePhotoUrl: profilePhotoUrl || "",
      academicClass,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    // ---------------------------------------------------------
    // 9. ADMISSION
    // ---------------------------------------------------------

    const admissionDoc: AdmissionDocument = {
      admissionId,
      studentId,
      source: "offline",
      courseId,
      batchId,
      admissionDate: now.split("T")[0],
      status: "approved",
      totalFee: Number(totalFee) || 0,
      registrationFeePaid:
        Number(registrationFeePaid) || 0,
      approvedBy: adminUid,
      approvedAt: now,
      remarks:
        notes ||
        "Offline admission created by Admin",
      createdAt: now,
    };

    // ---------------------------------------------------------
    // 10. ENROLLMENT
    // ---------------------------------------------------------

    const enrollmentDoc: EnrollmentDocument = {
      enrollmentId,
      studentId,
      courseId,
      batchId,
      admissionId,
      status: "active",
      startDate: now.split("T")[0],
      createdAt: now,
      updatedAt: now,
    };

    // ---------------------------------------------------------
    // 11. FIRESTORE BATCH
    // ---------------------------------------------------------

    const batch = adminDb.batch();

    batch.set(
      adminDb.collection("users").doc(studentUid),
      userDoc,
      { merge: true }
    );

    batch.set(
      adminDb.collection("students").doc(studentId),
      studentDoc
    );

    batch.set(
      adminDb.collection("admissions").doc(admissionId),
      admissionDoc
    );

    batch.set(
      adminDb.collection("enrollments").doc(enrollmentId),
      enrollmentDoc
    );

    // ---------------------------------------------------------
    // 12. INITIAL PAYMENT
    // ---------------------------------------------------------

    if (Number(registrationFeePaid) > 0) {
      const paymentDoc: PaymentDocument = {
        paymentId,
        studentId,
        enrollmentId,
        admissionId,
        amount: Number(registrationFeePaid),
        paymentMethod:
          paymentMethod || "cash",
        paymentStatus: "completed",
        paymentDate: now,
        transactionId:
          transactionId || receiptNumber,
        receiptNumber,
        recordedBy: adminUid,
        notes:
          notes ||
          "Initial admission fee payment",
        createdAt: now,
      };

      batch.set(
        adminDb.collection("payments").doc(paymentId),
        paymentDoc
      );
    }

    // ---------------------------------------------------------
    // 13. UPDATE BATCH COUNT
    // ---------------------------------------------------------

    const batchRef = adminDb
      .collection("batches")
      .doc(batchId);

    batch.set(
      batchRef,
      {
        currentEnrollmentCount:
          FieldValue.increment(1),
        isActive: true,
      },
      { merge: true }
    );

    // ---------------------------------------------------------
    // 14. COMMIT
    // ---------------------------------------------------------

    await batch.commit();

    // ---------------------------------------------------------
    // 15. SUCCESS
    // ---------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Student account and offline admission created successfully.",

        student: {
          studentId,
          uid: studentUid,

          // This is what the student uses to login.
          loginEmail,

          // Password actually configured in Firebase Auth.
          defaultPassword,

          mobile: cleanStudentMobile,

          // Keep the entered email available for reference.
          contactEmail:
            typeof email === "string"
              ? email.trim()
              : "",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(
      "[Create Student] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Internal server error.",
        code:
          error?.code ||
          "internal/error",
      },
      { status: 500 }
    );
  }
}