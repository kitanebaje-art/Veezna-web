"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ============================================================
// TYPES
// ============================================================

interface Student {
  id: string;
  studentId: string;
  name: string;
  mobile: string;
  program: string;
  totalFee: number;
  paidFee: number;
  pendingFee: number;
}

type MessageTemplate =
  | "custom"
  | "welcome"
  | "admission"
  | "payment"
  | "fee_reminder"
  | "class_reminder"
  | "attendance"
  | "result";

interface Template {
  id: MessageTemplate;
  title: string;
  description: string;
  message: string;
}

// ============================================================
// HELPERS
// ============================================================

function cleanPhoneNumber(phone: string): string {
  let value = String(phone || "").replace(/\D/g, "");

  // India number without country code
  if (value.length === 10) {
    value = `91${value}`;
  }

  // Remove accidental leading 0
  if (value.startsWith("091") && value.length === 13) {
    value = value.substring(1);
  }

  return value;
}

function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "₹0";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ============================================================
// PAGE
// ============================================================

export default function WhatsAppAutomationPage() {
  // ----------------------------------------------------------
  // STUDENTS
  // ----------------------------------------------------------

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [studentName, setStudentName] = useState("");

  const [template, setTemplate] =
    useState<MessageTemplate>("custom");

  const [message, setMessage] = useState("");

  // ----------------------------------------------------------
  // SEND STATE
  // ----------------------------------------------------------

  const [sending, setSending] = useState(false);

  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // ----------------------------------------------------------
  // TEMPLATES
  // ----------------------------------------------------------

  const templates: Template[] = useMemo(
    () => [
      {
        id: "welcome",
        title: "Welcome Message",
        description: "Send a welcome message to a new student.",
        message:
          "Hello {{name}},\n\nWelcome to Veezna! 🎓\n\nWe are happy to have you with us.\n\nYour learning journey starts here.\n\nRegards,\nVeezna Team",
      },

      {
        id: "admission",
        title: "Admission Confirmation",
        description: "Confirm successful admission.",
        message:
          "Hello {{name}},\n\nYour admission at Veezna has been successfully confirmed. 🎓\n\nProgram: {{program}}\n\nWe are excited to have you as part of the Veezna learning community.\n\nRegards,\nVeezna Team",
      },

      {
        id: "payment",
        title: "Payment Confirmation",
        description: "Confirm a fee payment.",
        message:
          "Hello {{name}},\n\nWe have successfully received your payment. ✅\n\nAmount: {{amount}}\nProgram: {{program}}\n\nThank you for your payment.\n\nRegards,\nVeezna Team",
      },

      {
        id: "fee_reminder",
        title: "Fee Reminder",
        description: "Remind a student about pending fees.",
        message:
          "Hello {{name}},\n\nThis is a gentle reminder regarding your pending Veezna fee.\n\nProgram: {{program}}\nPending Amount: {{pendingFee}}\n\nPlease complete the pending payment at your convenience.\n\nIf you have already made the payment, kindly ignore this message.\n\nRegards,\nVeezna Team",
      },

      {
        id: "class_reminder",
        title: "Class Reminder",
        description: "Send a class reminder.",
        message:
          "Hello {{name}},\n\nThis is a reminder for your upcoming Veezna class. 📚\n\nPlease be ready on time and keep your learning material with you.\n\nRegards,\nVeezna Team",
      },

      {
        id: "attendance",
        title: "Attendance Message",
        description: "Inform student about attendance.",
        message:
          "Hello {{name}},\n\nYour attendance is important for consistent learning and progress at Veezna.\n\nPlease make sure to attend your scheduled classes regularly.\n\nRegards,\nVeezna Team",
      },

      {
        id: "result",
        title: "Performance Update",
        description: "Send a learning/performance update.",
        message:
          "Hello {{name}},\n\nYour latest learning progress has been updated by Veezna. 📈\n\nPlease continue working consistently and focus on improving your weak areas.\n\nRegards,\nVeezna Team",
      },

      {
        id: "custom",
        title: "Custom Message",
        description: "Write your own WhatsApp message.",
        message: "",
      },
    ],
    []
  );

  // ============================================================
  // LOAD STUDENTS
  // ============================================================

  useEffect(() => {
    async function loadStudents() {
      try {
        setLoadingStudents(true);

        const snapshot = await getDocs(
          collection(db, "students")
        );

        const list: Student[] = [];

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          const studentId =
            data.studentId ||
            data.studentID ||
            data.regNo ||
            docSnap.id;

          const name =
            data.fullName ||
            data.name ||
            data.studentName ||
            "Unnamed Student";

          const mobile =
            data.mobile ||
            data.phone ||
            data.phoneNumber ||
            "";

          const program =
            data.program ||
            data.course ||
            data.department ||
            "N/A";

          const totalFee =
            Number(
              data.totalFee ||
                data.totalFees ||
                data.courseFee ||
                0
            ) || 0;

          const paidFee =
            Number(
              data.paidFee ||
                data.feePaid ||
                data.paidAmount ||
                0
            ) || 0;

          const pendingFee = Math.max(
            0,
            totalFee - paidFee
          );

          list.push({
            id: docSnap.id,
            studentId: String(studentId),
            name: String(name),
            mobile: String(mobile),
            program: String(program),
            totalFee,
            paidFee,
            pendingFee,
          });
        });

        list.sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        setStudents(list);
      } catch (error) {
        console.error(
          "[WhatsApp] Failed to load students:",
          error
        );

        setResult({
          success: false,
          message:
            "Unable to load students from Firestore.",
        });
      } finally {
        setLoadingStudents(false);
      }
    }

    loadStudents();
  }, []);

  // ============================================================
  // SELECT STUDENT
  // ============================================================

  function handleStudentChange(id: string) {
    setSelectedStudentId(id);
    setResult(null);

    const student = students.find(
      (item) => item.id === id
    );

    if (!student) {
      setPhone("");
      setStudentName("");
      return;
    }

    setStudentName(student.name);
    setPhone(student.mobile);

    applyTemplate(
      template,
      student
    );
  }

  // ============================================================
  // APPLY TEMPLATE
  // ============================================================

  function replaceVariables(
    text: string,
    student?: Student
  ): string {
    if (!student) return text;

    return text
      .replaceAll("{{name}}", student.name)
      .replaceAll("{{studentId}}", student.studentId)
      .replaceAll("{{program}}", student.program)
      .replaceAll(
        "{{amount}}",
        formatINR(student.paidFee)
      )
      .replaceAll(
        "{{pendingFee}}",
        formatINR(student.pendingFee)
      );
  }

  function applyTemplate(
    templateId: MessageTemplate,
    student?: Student
  ) {
    const selectedTemplate = templates.find(
      (item) => item.id === templateId
    );

    if (!selectedTemplate) {
      return;
    }

    setTemplate(templateId);

    const selected =
      student ||
      students.find(
        (item) => item.id === selectedStudentId
      );

    setMessage(
      replaceVariables(
        selectedTemplate.message,
        selected
      )
    );
  }

  // ============================================================
  // TEMPLATE CHANGE
  // ============================================================

  function handleTemplateChange(
    value: MessageTemplate
  ) {
    setTemplate(value);

    const student = students.find(
      (item) => item.id === selectedStudentId
    );

    applyTemplate(value, student);
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  async function handleSendMessage(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setResult(null);

    if (sending) return;

    const cleanedPhone =
      cleanPhoneNumber(phone);

    if (!cleanedPhone) {
      setResult({
        success: false,
        message:
          "Please enter a valid WhatsApp number.",
      });

      return;
    }

    if (cleanedPhone.length < 10) {
      setResult({
        success: false,
        message:
          "Please enter a valid WhatsApp number with country code.",
      });

      return;
    }

    if (!message.trim()) {
      setResult({
        success: false,
        message:
          "Please enter a WhatsApp message.",
      });

      return;
    }

    setSending(true);

    try {
      const response = await fetch(
        "/api/whatsapp/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: cleanedPhone,
            message: message.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            "WhatsApp message could not be sent."
        );
      }

      setResult({
        success: true,
        message:
          "WhatsApp message sent successfully. ✅",
      });
    } catch (error: any) {
      console.error(
        "[WhatsApp Admin] Send error:",
        error
      );

      setResult({
        success: false,
        message:
          error?.message ||
          "Unable to send WhatsApp message.",
      });
    } finally {
      setSending(false);
    }
  }

  // ============================================================
  // RESET
  // ============================================================

  function handleReset() {
    setSelectedStudentId("");
    setStudentName("");
    setPhone("");
    setTemplate("custom");
    setMessage("");
    setResult(null);
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 lg:p-8">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="mb-8">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

          <div>

            <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">

              <Link
                href="/admin/dashboard"
                className="hover:text-[#0057B8] transition font-medium"
              >
                ← Back to Dashboard
              </Link>

              <span>/</span>

              <span className="text-slate-800 font-semibold">
                WhatsApp
              </span>

            </div>

            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              WhatsApp Automation
            </h1>

            <p className="text-slate-600 text-sm mt-1">
              Send student communication directly from
              the Veezna Admin Panel.
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              WhatsApp API Ready
            </span>

          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-200">

          <Link
            href="/admin/dashboard"
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Dashboard
          </Link>

          <Link
            href="/admin/students"
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Students
          </Link>

          <Link
            href="/admin/admissions"
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Admissions
          </Link>

          <Link
            href="/admin/fees"
            className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            Fees & Payments
          </Link>

          <Link
            href="/admin/whatsapp"
            className="px-3 py-1.5 rounded-lg bg-[#0057B8] text-white font-semibold text-sm"
          >
            WhatsApp
          </Link>

        </nav>

      </header>

      {/* ====================================================== */}
      {/* STATUS */}
      {/* ====================================================== */}

      {result && (
        <div
          className={`mb-6 p-4 rounded-2xl border ${
            result.success
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >

          <div className="flex items-center gap-3">

            <span className="text-lg">
              {result.success ? "✅" : "⚠️"}
            </span>

            <p className="text-sm font-semibold">
              {result.message}
            </p>

          </div>

        </div>
      )}

      {/* ====================================================== */}
      {/* MAIN GRID */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ==================================================== */}
        {/* LEFT — COMPOSE */}
        {/* ==================================================== */}

        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">

          <div className="p-6 border-b border-slate-100">

            <h2 className="text-lg font-bold text-slate-900">
              Compose WhatsApp Message
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Select a student, choose a template, edit
              the message and send.
            </p>

          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-6 space-y-5"
          >

            {/* STUDENT */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Student
              </label>

              <select
                value={selectedStudentId}
                onChange={(e) =>
                  handleStudentChange(
                    e.target.value
                  )
                }
                disabled={loadingStudents}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-[#0057B8]"
              >

                <option value="">
                  {loadingStudents
                    ? "Loading students..."
                    : "Select a student"}
                </option>

                {students.map((student) => (
                  <option
                    key={student.id}
                    value={student.id}
                  >
                    {student.name} —{" "}
                    {student.studentId}
                  </option>
                ))}

              </select>

            </div>

            {/* STUDENT INFO */}

            {selectedStudentId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">

                  <p className="text-[10px] uppercase font-bold text-blue-500">
                    Student
                  </p>

                  <p className="font-bold text-sm text-blue-900 mt-1">
                    {studentName}
                  </p>

                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">

                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    WhatsApp
                  </p>

                  <p className="font-bold text-sm text-slate-800 mt-1">
                    {phone || "Not available"}
                  </p>

                </div>

                {(() => {
                  const student =
                    students.find(
                      (item) =>
                        item.id ===
                        selectedStudentId
                    );

                  return (
                    <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">

                      <p className="text-[10px] uppercase font-bold text-amber-500">
                        Pending Fee
                      </p>

                      <p className="font-bold text-sm text-amber-900 mt-1">
                        {formatINR(
                          student?.pendingFee ||
                            0
                        )}
                      </p>

                    </div>
                  );
                })()}

              </div>
            )}

            {/* PHONE */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                WhatsApp Number
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-[#0057B8]"
              />

              <p className="text-[11px] text-slate-400 mt-1">
                Indian 10-digit numbers are automatically
                converted to +91 format.
              </p>

            </div>

            {/* TEMPLATE */}

            <div>

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Message Template
              </label>

              <select
                value={template}
                onChange={(e) =>
                  handleTemplateChange(
                    e.target
                      .value as MessageTemplate
                  )
                }
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-sm outline-none focus:ring-2 focus:ring-[#0057B8]"
              >

                {templates.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.title}
                  </option>
                ))}

              </select>

              {template !== "custom" && (
                <p className="text-[11px] text-slate-500 mt-1">
                  {
                    templates.find(
                      (item) =>
                        item.id === template
                    )?.description
                  }
                </p>
              )}

            </div>

            {/* MESSAGE */}

            <div>

              <div className="flex items-center justify-between mb-2">

                <label className="block text-sm font-semibold text-slate-700">
                  Message
                </label>

                <span className="text-[11px] text-slate-400">
                  {message.length} characters
                </span>

              </div>

              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                rows={10}
                placeholder="Write your WhatsApp message..."
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm leading-6 outline-none focus:ring-2 focus:ring-[#0057B8] resize-y"
              />

            </div>

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100">

              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={
                  sending ||
                  !message.trim()
                }
                className="px-6 py-3 rounded-xl bg-[#0057B8] hover:bg-[#004494] text-white font-bold text-sm shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending
                  ? "Sending..."
                  : "Send WhatsApp Message"}
              </button>

            </div>

          </form>

        </section>

        {/* ==================================================== */}
        {/* RIGHT — AUTOMATION INFO */}
        {/* ==================================================== */}

        <aside className="space-y-6">

          {/* QUICK TEMPLATES */}

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <h3 className="font-bold text-slate-900">
              Quick Messages
            </h3>

            <p className="text-xs text-slate-500 mt-1 mb-4">
              Select a template to quickly prepare a
              message.
            </p>

            <div className="space-y-2">

              {templates
                .filter(
                  (item) =>
                    item.id !== "custom"
                )
                .map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleTemplateChange(
                        item.id
                      )
                    }
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition"
                  >

                    <p className="text-sm font-semibold text-slate-800">
                      {item.title}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {item.description}
                    </p>

                  </button>
                ))}

            </div>

          </section>

          {/* AUTOMATION ROADMAP */}

          <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm">

            <p className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              Veezna Automation
            </p>

            <h3 className="text-lg font-bold mt-1">
              WhatsApp System
            </h3>

            <div className="mt-5 space-y-4">

              <div className="flex gap-3">

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">
                  ✓
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    WhatsApp API Route
                  </p>

                  <p className="text-[11px] text-slate-400">
                    /api/whatsapp/send
                  </p>
                </div>

              </div>

              <div className="flex gap-3">

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    Admin Messaging
                  </p>

                  <p className="text-[11px] text-slate-400">
                    Send messages from admin panel
                  </p>
                </div>

              </div>

              <div className="flex gap-3">

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
                  3
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Fee Reminders
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Automatic pending-fee messages
                  </p>
                </div>

              </div>

              <div className="flex gap-3">

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
                  4
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Payment Notifications
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Automatic payment confirmations
                  </p>
                </div>

              </div>

              <div className="flex gap-3">

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center">
                  5
                </span>

                <div>
                  <p className="text-sm font-semibold text-slate-300">
                    Scheduled Automation
                  </p>

                  <p className="text-[11px] text-slate-500">
                    Daily and monthly reminders
                  </p>
                </div>

              </div>

            </div>

          </section>

          {/* API STATUS */}

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">

            <h3 className="font-bold text-slate-900">
              System Status
            </h3>

            <div className="mt-4 space-y-3">

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Admin WhatsApp UI
                </span>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  READY
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Send API
                </span>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  READY
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Student Database
                </span>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  CONNECTED
                </span>

              </div>

              <div className="flex items-center justify-between">

                <span className="text-xs text-slate-500">
                  Scheduled Automation
                </span>

                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                  NEXT
                </span>

              </div>

            </div>

          </section>

        </aside>

      </div>

    </div>
  );
}