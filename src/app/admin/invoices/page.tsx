"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

const INVOICE_API_URL =
  "https://script.google.com/macros/s/AKfycbxc1fx7fWQzAi9dCw-F1n6RkPmr01zgCAcSGrfJebflKAPfuqkFtq8QVFweWQtfavx2/exec";

interface Student {
  studentId: string;
  name: string;
  mobile: string;
  academicClass: string;
  status: string;
  createdAt: string;
  fatherName?: string;
  email?: string;
  course?: string;
  batch?: string;
}

interface InvoiceResponse {
  success?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  message?: string;
  error?: string;
}

export default function AdminInvoicesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [dueDate, setDueDate] = useState("");

  const [feeType, setFeeType] = useState("Course Fee");
  const [description, setDescription] = useState("");
  const [course, setCourse] = useState("");
  const [batch, setBatch] = useState("");

  const [amount, setAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("0");
  const [amountPaid, setAmountPaid] = useState("");

  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");

  const [lastInvoice, setLastInvoice] = useState<InvoiceResponse | null>(
    null
  );

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);

      const q = query(
        collection(db, "students"),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);

      const list: Student[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();

        list.push({
          studentId: String(data.studentId || docSnap.id),
          name: String(data.name || ""),
          mobile: String(data.mobile || ""),
          academicClass: String(data.academicClass || ""),
          status: String(data.status || "active"),
          createdAt: String(data.createdAt || ""),
          fatherName: String(data.fatherName || ""),
          email: String(data.email || ""),
          course: String(data.course || ""),
          batch: String(data.batch || ""),
        });
      });

      setStudents(list);
    } catch (error) {
      console.error("Error loading students:", error);
      alert("Students load nahi ho paaye.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const selectedStudent = useMemo(() => {
    return students.find(
      (student) => student.studentId === selectedStudentId
    );
  }, [students, selectedStudentId]);

  const numericAmount = Number(amount || 0);
  const numericDiscount = Number(discount || 0);
  const numericTax = Number(tax || 0);
  const numericPaid = Number(amountPaid || 0);

  const finalAmount = Math.max(
    0,
    numericAmount - numericDiscount + numericTax
  );

  const balance = Math.max(0, finalAmount - numericPaid);

  useEffect(() => {
    if (numericPaid <= 0) {
      setPaymentStatus("Pending");
    } else if (numericPaid >= finalAmount && finalAmount > 0) {
      setPaymentStatus("Paid");
    } else {
      setPaymentStatus("Partial");
    }
  }, [numericPaid, finalAmount]);

  const resetForm = () => {
    setSelectedStudentId("");
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setDueDate("");
    setFeeType("Course Fee");
    setDescription("");
    setCourse("");
    setBatch("");
    setAmount("");
    setDiscount("");
    setTax("0");
    setAmountPaid("");
    setPaymentStatus("Pending");
    setPaymentMethod("Cash");
    setTransactionId("");
    setNotes("");
    setLastInvoice(null);
  };

  const generateInvoice = async () => {
    if (!selectedStudent) {
      alert("Please select a student.");
      return;
    }

    if (!amount || numericAmount <= 0) {
      alert("Please enter a valid fee amount.");
      return;
    }

    if (numericPaid > finalAmount) {
      alert("Amount Paid final amount se zyada nahi ho sakta.");
      return;
    }

    try {
      setSaving(true);
      setLastInvoice(null);

      const payload = {
        invoiceDate,

        studentId: selectedStudent.studentId,
        studentName: selectedStudent.name,
        fatherName: selectedStudent.fatherName || "",
        mobile: selectedStudent.mobile || "",
        email: selectedStudent.email || "",

        course: course || selectedStudent.course || "",
        batch: batch || selectedStudent.batch || "",

        feeType,
        description,

        amount: numericAmount,
        discount: numericDiscount,
        tax: numericTax,
        finalAmount,

        amountPaid: numericPaid,
        balance,

        paymentStatus,
        paymentMethod,
        transactionId,

        dueDate,

        createdAt: new Date().toISOString(),
        createdBy: "Admin",

        notes,
      };

      const response = await fetch(INVOICE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      const result: InvoiceResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Invoice save failed.");
      }

      setLastInvoice(result);

      alert(
        `Invoice successfully generated!\n\nInvoice No: ${
          result.invoiceNumber || "Generated"
        }`
      );
    } catch (error) {
      console.error("Invoice Error:", error);

      alert(
        `Invoice save nahi ho paya.\n\n${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  const printInvoice = () => {
    if (!selectedStudent) {
      alert("Please select a student.");
      return;
    }

    const invoiceNumber =
      lastInvoice?.invoiceNumber || "VEEZNA-INVOICE-PREVIEW";

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the invoice.");
      return;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${invoiceNumber}</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 30px;
    font-family: Arial, Helvetica, sans-serif;
    color: #172033;
    background: #ffffff;
  }

  .invoice {
    max-width: 850px;
    margin: auto;
    border: 1px solid #d9e0ea;
    border-radius: 12px;
    overflow: hidden;
  }

  .header {
    background: linear-gradient(135deg, #0057B8, #003b7e);
    color: white;
    padding: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .brand {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 1px;
  }

  .tagline {
    margin-top: 5px;
    font-size: 12px;
    color: #dcecff;
  }

  .invoice-title {
    text-align: right;
  }

  .invoice-title h1 {
    margin: 0;
    font-size: 28px;
  }

  .invoice-title p {
    margin: 5px 0 0;
    font-size: 13px;
  }

  .content {
    padding: 30px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 25px;
    margin-bottom: 25px;
  }

  .box {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
  }

  .label {
    color: #64748b;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: bold;
    margin-bottom: 5px;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th {
    background: #f1f5f9;
    padding: 12px;
    text-align: left;
    font-size: 12px;
  }

  td {
    border-bottom: 1px solid #e2e8f0;
    padding: 13px 12px;
    font-size: 13px;
  }

  .amount {
    text-align: right;
  }

  .summary {
    margin-top: 25px;
    margin-left: auto;
    max-width: 350px;
  }

  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 7px 0;
    font-size: 13px;
  }

  .total {
    border-top: 2px solid #0057B8;
    margin-top: 8px;
    padding-top: 12px;
    font-size: 18px;
    font-weight: 800;
  }

  .paid {
    color: #16803c;
  }

  .balance {
    color: #d97706;
  }

  .footer {
    margin-top: 35px;
    border-top: 1px solid #e2e8f0;
    padding-top: 20px;
    font-size: 11px;
    color: #64748b;
    text-align: center;
  }

  @media print {
    body {
      padding: 0;
    }

    .invoice {
      border: none;
    }
  }
</style>
</head>

<body>

<div class="invoice">

  <div class="header">

    <div>
      <div class="brand">VEEZNA</div>
      <div class="tagline">Vision Turns Into Mission</div>
    </div>

    <div class="invoice-title">
      <h1>INVOICE</h1>
      <p>${invoiceNumber}</p>
    </div>

  </div>

  <div class="content">

    <div class="info-grid">

      <div class="box">
        <div class="label">Bill To</div>
        <div class="value">${selectedStudent.name}</div>
        <div style="margin-top:7px;font-size:12px;">
          Student ID: ${selectedStudent.studentId}
        </div>
        <div style="margin-top:4px;font-size:12px;">
          Mobile: ${selectedStudent.mobile || "-"}
        </div>
        <div style="margin-top:4px;font-size:12px;">
          Class: ${selectedStudent.academicClass || "-"}
        </div>
      </div>

      <div class="box">
        <div class="label">Invoice Details</div>
        <div style="font-size:12px;margin-top:5px;">
          Invoice Date: ${invoiceDate || "-"}
        </div>
        <div style="font-size:12px;margin-top:5px;">
          Due Date: ${dueDate || "-"}
        </div>
        <div style="font-size:12px;margin-top:5px;">
          Payment Method: ${paymentMethod}
        </div>
        <div style="font-size:12px;margin-top:5px;">
          Status: ${paymentStatus}
        </div>
      </div>

    </div>

    <table>

      <thead>
        <tr>
          <th>Description</th>
          <th>Fee Type</th>
          <th class="amount">Amount</th>
        </tr>
      </thead>

      <tbody>

        <tr>
          <td>
            ${description || "VEEZNA Educational Services"}
            ${
              course
                ? `<div style="font-size:11px;color:#64748b;margin-top:4px;">Course: ${course}</div>`
                : ""
            }
            ${
              batch
                ? `<div style="font-size:11px;color:#64748b;margin-top:3px;">Batch: ${batch}</div>`
                : ""
            }
          </td>

          <td>${feeType}</td>

          <td class="amount">
            ₹${numericAmount.toLocaleString("en-IN")}
          </td>

        </tr>

      </tbody>

    </table>

    <div class="summary">

      <div class="summary-row">
        <span>Subtotal</span>
        <strong>₹${numericAmount.toLocaleString("en-IN")}</strong>
      </div>

      <div class="summary-row">
        <span>Discount</span>
        <strong>- ₹${numericDiscount.toLocaleString("en-IN")}</strong>
      </div>

      <div class="summary-row">
        <span>Tax</span>
        <strong>₹${numericTax.toLocaleString("en-IN")}</strong>
      </div>

      <div class="summary-row total">
        <span>Final Amount</span>
        <strong>₹${finalAmount.toLocaleString("en-IN")}</strong>
      </div>

      <div class="summary-row paid">
        <span>Amount Paid</span>
        <strong>₹${numericPaid.toLocaleString("en-IN")}</strong>
      </div>

      <div class="summary-row balance">
        <span>Balance Due</span>
        <strong>₹${balance.toLocaleString("en-IN")}</strong>
      </div>

    </div>

    ${
      transactionId
        ? `
      <div style="margin-top:20px;font-size:12px;">
        <strong>Transaction ID:</strong> ${transactionId}
      </div>
      `
        : ""
    }

    ${
      notes
        ? `
      <div style="margin-top:20px;font-size:12px;">
        <strong>Notes:</strong> ${notes}
      </div>
      `
        : ""
    }

    <div class="footer">
      Thank you for choosing VEEZNA.<br/>
      This is a computer-generated invoice.
    </div>

  </div>

</div>

<script>
  window.onload = function() {
    window.print();
  };
</script>

</body>
</html>
`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">

      {/* HEADER */}

      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            <div>

              <div className="flex items-center gap-3">

                <Link
                  href="/admin"
                  className="text-sm text-slate-500 hover:text-[#0057B8]"
                >
                  ← Admin
                </Link>

                <span className="text-slate-300">/</span>

                <span className="text-sm font-semibold text-slate-700">
                  Invoices
                </span>

              </div>

              <h1 className="mt-2 text-2xl sm:text-3xl font-black text-slate-900">
                Invoice Management
              </h1>

              <p className="text-sm text-slate-500 mt-1">
                Create and record VEEZNA student fee invoices.
              </p>

            </div>

            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              + New Invoice
            </button>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT FORM */}

          <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm">

            <div className="p-5 border-b border-slate-200">

              <h2 className="font-bold text-lg">
                Invoice Details
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Enter student and payment information.
              </p>

            </div>

            <div className="p-5 space-y-6">

              {/* STUDENT */}

              <div>

                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Select Student *
                </label>

                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  disabled={loadingStudents}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8] bg-white"
                >

                  <option value="">
                    {loadingStudents
                      ? "Loading students..."
                      : "Select student"}
                  </option>

                  {students.map((student) => (
                    <option
                      key={student.studentId}
                      value={student.studentId}
                    >
                      {student.studentId} — {student.name} —{" "}
                      {student.mobile}
                    </option>
                  ))}

                </select>

              </div>

              {/* SELECTED STUDENT CARD */}

              {selectedStudent && (

                <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                    <div>

                      <p className="text-xs font-bold text-blue-600 uppercase">
                        Selected Student
                      </p>

                      <h3 className="text-lg font-black text-slate-900 mt-1">
                        {selectedStudent.name}
                      </h3>

                      <p className="text-xs text-slate-600 mt-1">
                        ID: {selectedStudent.studentId}
                        {" • "}
                        Mobile: {selectedStudent.mobile}
                        {" • "}
                        {selectedStudent.academicClass}
                      </p>

                    </div>

                    <span className="px-3 py-1.5 rounded-full bg-white border border-blue-200 text-xs font-bold text-blue-700">
                      {selectedStudent.status}
                    </span>

                  </div>

                </div>

              )}

              {/* DATE */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Invoice Date
                  </label>

                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

              </div>

              {/* COURSE / BATCH */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Course
                  </label>

                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. Academic Excellence"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Batch
                  </label>

                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    placeholder="e.g. Batch 01"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

              </div>

              {/* FEE */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Fee Type
                  </label>

                  <select
                    value={feeType}
                    onChange={(e) => setFeeType(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  >

                    <option>Course Fee</option>
                    <option>Registration Fee</option>
                    <option>Monthly Fee</option>
                    <option>Admission Fee</option>
                    <option>Installment</option>
                    <option>Exam Fee</option>
                    <option>Other</option>

                  </select>

                </div>

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Description
                  </label>

                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Fee description"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

              </div>

              {/* AMOUNTS */}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                <div>

                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Tax
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

                <div>

                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Amount Paid
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

              </div>

              {/* PAYMENT */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  >

                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Bank Transfer</option>
                    <option>Razorpay</option>
                    <option>Card</option>
                    <option>Cheque</option>
                    <option>Other</option>

                  </select>

                </div>

                <div>

                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                    Transaction ID
                  </label>

                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Optional"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                  />

                </div>

              </div>

              {/* NOTES */}

              <div>

                <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-2">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#0057B8]/20 focus:border-[#0057B8]"
                />

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">

                <button
                  onClick={generateInvoice}
                  disabled={saving}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-[#0057B8] hover:bg-[#00458f] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-blue-900/10 transition"
                >
                  {saving
                    ? "Saving Invoice..."
                    : "✓ Generate & Save Invoice"}
                </button>

                <button
                  onClick={printInvoice}
                  className="px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition"
                >
                  🖨 Print Invoice
                </button>

              </div>

            </div>

          </section>

          {/* RIGHT SUMMARY */}

          <aside className="space-y-5">

            <div className="bg-[#042d5a] rounded-2xl p-6 text-white shadow-xl">

              <div className="text-xs uppercase tracking-widest text-blue-200 font-bold">
                Invoice Summary
              </div>

              <div className="mt-5">

                <p className="text-xs text-slate-300">
                  Final Amount
                </p>

                <p className="text-4xl font-black mt-1">
                  ₹{finalAmount.toLocaleString("en-IN")}
                </p>

              </div>

              <div className="mt-6 space-y-3 text-sm">

                <div className="flex justify-between">

                  <span className="text-slate-300">
                    Amount
                  </span>

                  <span className="font-bold">
                    ₹{numericAmount.toLocaleString("en-IN")}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-slate-300">
                    Discount
                  </span>

                  <span className="font-bold text-orange-300">
                    - ₹{numericDiscount.toLocaleString("en-IN")}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-slate-300">
                    Tax
                  </span>

                  <span className="font-bold">
                    ₹{numericTax.toLocaleString("en-IN")}
                  </span>

                </div>

                <div className="border-t border-white/10 pt-3 flex justify-between">

                  <span className="text-slate-300">
                    Paid
                  </span>

                  <span className="font-bold text-emerald-300">
                    ₹{numericPaid.toLocaleString("en-IN")}
                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-slate-300">
                    Balance
                  </span>

                  <span className="font-bold text-orange-300">
                    ₹{balance.toLocaleString("en-IN")}
                  </span>

                </div>

              </div>

              <div className="mt-5">

                <span
                  className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${
                    paymentStatus === "Paid"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : paymentStatus === "Partial"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {paymentStatus}
                </span>

              </div>

            </div>

            {lastInvoice && (

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                    ✓
                  </div>

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                      Invoice Saved
                    </p>

                    <p className="font-black text-slate-900 mt-1">
                      {lastInvoice.invoiceNumber}
                    </p>

                  </div>

                </div>

                <p className="text-xs text-emerald-700 mt-4 leading-relaxed">
                  Invoice Google Sheet में successfully save हो गया है।
                </p>

              </div>

            )}

            <div className="bg-white border border-slate-200 rounded-2xl p-5">

              <h3 className="font-bold text-slate-900">
                Invoice System
              </h3>

              <div className="mt-4 space-y-3 text-xs text-slate-500">

                <div className="flex gap-2">
                  <span>✓</span>
                  Automatic invoice numbering
                </div>

                <div className="flex gap-2">
                  <span>✓</span>
                  Firebase student directory
                </div>

                <div className="flex gap-2">
                  <span>✓</span>
                  Google Sheet backup
                </div>

                <div className="flex gap-2">
                  <span>✓</span>
                  Print-ready invoice
                </div>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}