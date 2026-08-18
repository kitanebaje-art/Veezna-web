import "server-only";

import { adminDb } from "@/lib/firebase-admin";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";

import type { StudentDocument } from "@/types/database";

// ============================================================
// TYPES
// ============================================================

export interface WhatsAppStudent {
  studentId: string;
  name: string;
  mobile: string;
  academicClass: string;
  status: string;

  program?: string;
  course?: string;

  totalFee?: number;
  paidFee?: number;
  pendingFee?: number;

  createdAt?: unknown;
}

// ============================================================
// HELPERS
// ============================================================

function normalizeForComparison(phone: string): string {
  if (!phone) {
    return "";
  }

  const normalized = normalizeWhatsAppNumber(phone);

  return normalized.replace(/^\+?/, "");
}

function buildPhoneCandidates(phone: string): string[] {
  const normalizedIncoming = normalizeForComparison(phone);

  if (!normalizedIncoming) {
    return [];
  }

  const candidates = new Set<string>();

  candidates.add(normalizedIncoming);

  // Indian number:
  // 919876543210
  // 9876543210
  // +919876543210
  // 09876543210

  if (
    normalizedIncoming.startsWith("91") &&
    normalizedIncoming.length === 12
  ) {
    const tenDigit = normalizedIncoming.substring(2);

    candidates.add(tenDigit);
    candidates.add(`91${tenDigit}`);
    candidates.add(`+91${tenDigit}`);
    candidates.add(`0${tenDigit}`);
  }

  if (
    normalizedIncoming.startsWith("0") &&
    normalizedIncoming.length === 11
  ) {
    const tenDigit = normalizedIncoming.substring(1);

    candidates.add(tenDigit);
    candidates.add(`91${tenDigit}`);
    candidates.add(`+91${tenDigit}`);
    candidates.add(normalizedIncoming);
  }

  if (
    normalizedIncoming.length === 10 &&
    !normalizedIncoming.startsWith("0")
  ) {
    candidates.add(normalizedIncoming);
    candidates.add(`91${normalizedIncoming}`);
    candidates.add(`+91${normalizedIncoming}`);
    candidates.add(`0${normalizedIncoming}`);
  }

  return Array.from(candidates);
}

// ============================================================
// CONVERT FIRESTORE STUDENT TO WHATSAPP STUDENT
// ============================================================

function mapStudent(
  studentId: string,
  data: StudentDocument
): WhatsAppStudent {
  const rawData = data as StudentDocument & {
    program?: string;
    course?: string;

    totalFee?: number | string;
    totalFees?: number | string;

    paidFee?: number | string;
    feePaid?: number | string;

    pendingFee?: number | string;
  };

  const totalFee = Number(
    rawData.totalFee ??
      rawData.totalFees ??
      0
  );

  const paidFee = Number(
    rawData.paidFee ??
      rawData.feePaid ??
      0
  );

  const calculatedPending = Math.max(
    0,
    totalFee - paidFee
  );

  const storedPending =
    rawData.pendingFee !== undefined &&
    rawData.pendingFee !== null
      ? Number(rawData.pendingFee)
      : calculatedPending;

  const pendingFee = Number.isFinite(storedPending)
    ? Math.max(0, storedPending)
    : calculatedPending;

  return {
    studentId:
      rawData.studentId ||
      studentId,

    name:
      rawData.name ||
      "Student",

    mobile:
      rawData.mobile ||
      "",

    academicClass:
      rawData.academicClass ||
      "N/A",

    status:
      rawData.status ||
      "active",

    program:
      rawData.program ||
      undefined,

    course:
      rawData.course ||
      undefined,

    totalFee:
      Number.isFinite(totalFee)
        ? totalFee
        : 0,

    paidFee:
      Number.isFinite(paidFee)
        ? paidFee
        : 0,

    pendingFee,

    createdAt:
      rawData.createdAt,
  };
}

// ============================================================
// FIND STUDENT BY WHATSAPP NUMBER
// ============================================================

export async function findStudentByWhatsAppNumber(
  phone: string
): Promise<WhatsAppStudent | null> {
  if (!phone) {
    return null;
  }

  const candidates =
    buildPhoneCandidates(phone);

  if (candidates.length === 0) {
    return null;
  }

  try {
    const studentsRef =
      adminDb.collection("students");

    // Firestore Admin SDK syntax.
    //
    // We intentionally keep this query small because
    // Firestore "in" queries have a maximum number of values.

    const snapshot =
      await studentsRef
        .where(
          "mobile",
          "in",
          candidates
        )
        .limit(1)
        .get();

    if (snapshot.empty) {
      console.log(
        `[WhatsApp Student] No student found for ${phone}`
      );

      return null;
    }

    const studentSnap =
      snapshot.docs[0];

    const data =
      studentSnap.data() as StudentDocument;

    return mapStudent(
      studentSnap.id,
      data
    );
  } catch (error) {
    console.error(
      "[WhatsApp Student] Phone lookup error:",
      error
    );

    return null;
  }
}

// ============================================================
// FIND STUDENT BY STUDENT ID
// ============================================================

export async function findStudentByStudentId(
  studentId: string
): Promise<WhatsAppStudent | null> {
  if (!studentId?.trim()) {
    return null;
  }

  const cleanStudentId =
    studentId.trim();

  try {
    const studentsRef =
      adminDb.collection("students");

    // First try the studentId field.
    const snapshot =
      await studentsRef
        .where(
          "studentId",
          "==",
          cleanStudentId
        )
        .limit(1)
        .get();

    if (!snapshot.empty) {
      const studentSnap =
        snapshot.docs[0];

      const data =
        studentSnap.data() as StudentDocument;

      return mapStudent(
        studentSnap.id,
        data
      );
    }

    // Some existing records may use
    // the Firestore document ID as the student ID.
    const documentSnap =
      await studentsRef
        .doc(cleanStudentId)
        .get();

    if (documentSnap.exists) {
      const data =
        documentSnap.data() as StudentDocument;

      return mapStudent(
        documentSnap.id,
        data
      );
    }

    console.log(
      `[WhatsApp Student] No student found for Student ID ${cleanStudentId}`
    );

    return null;
  } catch (error) {
    console.error(
      "[WhatsApp Student] Student ID lookup error:",
      error
    );

    return null;
  }
}

// ============================================================
// FIND STUDENT
//
// Useful for WhatsApp flows where we may receive either:
// - WhatsApp number
// - Student ID
// ============================================================

export async function findStudent(
  options: {
    phone?: string;
    studentId?: string;
  }
): Promise<WhatsAppStudent | null> {
  if (options.studentId) {
    const student =
      await findStudentByStudentId(
        options.studentId
      );

    if (student) {
      return student;
    }
  }

  if (options.phone) {
    return findStudentByWhatsAppNumber(
      options.phone
    );
  }

  return null;
}

// ============================================================
// STUDENT STATUS CHECK
// ============================================================

export function isWhatsAppStudentActive(
  student: WhatsAppStudent | null
): boolean {
  if (!student) {
    return false;
  }

  return (
    student.status
      .toLowerCase()
      .trim() === "active"
  );
}

// ============================================================
// STUDENT WELCOME MESSAGE
// ============================================================

export function buildStudentWelcomeMessage(
  student: WhatsAppStudent
): string {
  const firstName =
    student.name
      .trim()
      .split(/\s+/)[0] ||
    "Student";

  return `👋 Hello ${firstName}!

Welcome back to Veezna. 🌟

🎓 Student ID: ${student.studentId}
📚 Class: ${student.academicClass}

How can we help you today?

1️⃣ Course / Learning
2️⃣ Fees & Payments
3️⃣ Attendance
4️⃣ Study Material
5️⃣ Talk to Counsellor

Reply with the number of your choice.

— Team Veezna
Vision Turns Into Mission`;
}

// ============================================================
// MAIN MENU MESSAGE
// ============================================================

export function buildStudentMenuMessage(
  student: WhatsAppStudent
): string {
  const firstName =
    student.name
      .trim()
      .split(/\s+/)[0] ||
    "Student";

  return `📚 Veezna Student Menu

Hello ${firstName}! 👋

What would you like to access?

1️⃣ Course / Learning
2️⃣ Fees & Payments
3️⃣ Attendance
4️⃣ Study Material
5️⃣ Talk to Counsellor

Reply with a number.

Reply *MENU* anytime to see this menu again.

— Team Veezna`;
}

// ============================================================
// STUDENT FEE MESSAGE
// ============================================================

export function buildStudentFeeMessage(
  student: WhatsAppStudent
): string {
  const totalFee =
    Number(student.totalFee || 0);

  const paidFee =
    Number(student.paidFee || 0);

  const calculatedPending =
    Math.max(
      0,
      totalFee - paidFee
    );

  const pendingFee =
    student.pendingFee !== undefined
      ? Number(student.pendingFee)
      : calculatedPending;

  return `💳 Veezna Fee Information

Student: ${student.name}
Student ID: ${student.studentId}

Total Fee: ₹${totalFee.toLocaleString("en-IN")}

Paid: ₹${paidFee.toLocaleString("en-IN")}

Pending: ₹${Math.max(
    0,
    pendingFee
  ).toLocaleString("en-IN")}

For detailed payment history or receipt assistance, please contact the Veezna administration.

Reply *MENU* to return to the main menu.

— Team Veezna`;
}

// ============================================================
// PAYMENT REMINDER MESSAGE
// ============================================================

export function buildStudentPaymentReminderMessage(
  student: WhatsAppStudent
): string {
  const pendingFee =
    Math.max(
      0,
      Number(student.pendingFee || 0)
    );

  if (pendingFee <= 0) {
    return `✅ Fee Update

Hello ${student.name}!

Your Veezna fee account currently shows no pending amount.

Thank you for keeping your payments up to date. 🌟

— Team Veezna
Vision Turns Into Mission`;
  }

  return `🔔 Veezna Fee Reminder

Hello ${student.name}! 👋

This is a friendly reminder regarding your pending course fee.

🎓 Student ID: ${student.studentId}

💰 Pending Amount: ₹${pendingFee.toLocaleString(
    "en-IN"
  )}

Please contact the Veezna administration for payment assistance or payment details.

If you have already made the payment, please share your payment confirmation with the Veezna administration.

— Team Veezna
Vision Turns Into Mission`;
}

// ============================================================
// PAYMENT CONFIRMATION MESSAGE
// ============================================================

export function buildPaymentConfirmationMessage(
  student: WhatsAppStudent,
  amount: number,
  paymentId?: string
): string {
  const safeAmount =
    Math.max(
      0,
      Number(amount || 0)
    );

  const paymentReference =
    paymentId
      ? `\n\n🧾 Payment ID: ${paymentId}`
      : "";

  return `✅ Payment Received

Hello ${student.name}! 👋

Veezna has received your payment.

🎓 Student ID: ${student.studentId}
💰 Amount: ₹${safeAmount.toLocaleString(
    "en-IN"
  )}${paymentReference}

Thank you for your payment. 🌟

For the official receipt or complete payment history, please contact the Veezna administration.

Reply *MENU* to return to the main menu.

— Team Veezna
Vision Turns Into Mission`;
}

// ============================================================
// UNKNOWN STUDENT MESSAGE
// ============================================================

export function buildUnknownStudentMessage(): string {
  return `👋 Welcome to Veezna!

We could not find an active student account linked to this WhatsApp number.

If you are already a Veezna student, please send your Student ID.

Example:

STU-1001

If you are a new learner, reply:

1️⃣ Courses
2️⃣ Admission
3️⃣ Talk to a Counsellor

— Team Veezna
Vision Turns Into Mission`;
}

// ============================================================
// INACTIVE STUDENT MESSAGE
// ============================================================

export function buildInactiveStudentMessage(
  student: WhatsAppStudent
): string {
  return `👋 Hello ${student.name}!

We found your Veezna student account, but it is currently marked as ${student.status}.

Please contact the Veezna administration for assistance.

🎓 Student ID: ${student.studentId}

— Team Veezna
Vision Turns Into Mission`;
}