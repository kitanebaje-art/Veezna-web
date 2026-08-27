"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

interface InvoiceItem {
  id: string;
  description: string;
  category: "Academic" | "Wellness" | "Material" | "Other";
  quantity: number;
  rate: number;
}

interface InvoiceData {
  invoiceId: string;
  invoiceNumber: string;

  date: string;
  dueDate: string;

  studentId: string;
  customerName: string;
  fatherName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;

  course: string;
  batch: string;
  feeType: string;

  items: InvoiceItem[];

  discountType: "percentage" | "flat";
  discountValue: number;

  taxRate: number;

  amountPaid: number;
  transactionId: string;

  paymentMode: "UPI" | "Cash" | "Bank Transfer" | "Card";
  paymentStatus: "PAID" | "PENDING" | "PARTIAL";

  notes: string;

  googleSheetWebhookUrl: string;

  businessName: string;
  businessAddress: string;
  businessEmail: string;
  businessWebsite: string;
  founderName: string;
  gstin: string;
  upiId: string;
  bankDetails: string;
}

const GOOGLE_SHEET_WEBHOOK =
  "https://script.google.com/macros/s/AKfycbxc1fx7fWQzAi9dCw-F1n6RkPmr01zgCAcSGrfJebflKAPfuqkFtq8QVFweWQtfavx2/exec";

const STORAGE_KEY = "veezna_invoice_draft";

const getToday = () => {
  return new Date().toISOString().split("T")[0];
};

const getDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split("T")[0];
};

const generateInvoiceNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);

  return `VEEZNA-INV-${year}-${random}`;
};

const createId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const createNewInvoice = (): InvoiceData => ({
  invoiceId: createId(),

  invoiceNumber: generateInvoiceNumber(),

  date: getToday(),
  dueDate: getDueDate(),

  studentId: "",
  customerName: "",
  fatherName: "",
  customerPhone: "",
  customerEmail: "",
  customerAddress: "",

  course: "",
  batch: "",
  feeType: "Course Fee",

  items: [
    {
      id: createId(),
      description: "Veezna Academic Mentorship / Course Module",
      category: "Academic",
      quantity: 1,
      rate: 3500,
    },
  ],

  discountType: "flat",
  discountValue: 0,

  taxRate: 0,

  amountPaid: 0,
  transactionId: "",

  paymentMode: "UPI",
  paymentStatus: "PAID",

  notes:
    "Thank you for choosing Veezna for your learning and wellness journey!",

  googleSheetWebhookUrl: GOOGLE_SHEET_WEBHOOK,

  businessName: "VEEZNA",
  businessAddress: "Neemuch, Madhya Pradesh, India",
  businessEmail: "contact@veezna.com",
  businessWebsite: "veezna.com",
  founderName: "S. S. Gour",
  gstin: "",
  upiId: "",
  bankDetails: "",
});

export default function VeeznaInvoiceApp() {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<InvoiceData>(() => {
    if (typeof window === "undefined") {
      return createNewInvoice();
    }

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as InvoiceData;

        return {
          ...createNewInvoice(),
          ...parsed,
          googleSheetWebhookUrl:
            parsed.googleSheetWebhookUrl || GOOGLE_SHEET_WEBHOOK,
        };
      }
    } catch (error) {
      console.error("Unable to load saved invoice:", error);
    }

    return createNewInvoice();
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [syncStatus, setSyncStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "invoice" | "business" | "sync"
  >("invoice");

  /* =========================================================
     SAVE DRAFT LOCALLY
  ========================================================= */

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error("Unable to save invoice draft:", error);
    }
  }, [data]);

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const calculations = useMemo(() => {
    const subtotal = data.items.reduce(
      (total, item) =>
        total +
        Number(item.quantity || 0) *
          Number(item.rate || 0),
      0
    );

    const discountAmount =
      data.discountType === "percentage"
        ? (subtotal * Number(data.discountValue || 0)) / 100
        : Number(data.discountValue || 0);

    const safeDiscount = Math.min(
      Math.max(discountAmount, 0),
      subtotal
    );

    const taxableAmount = Math.max(
      0,
      subtotal - safeDiscount
    );

    const taxAmount =
      (taxableAmount * Number(data.taxRate || 0)) / 100;

    const grandTotal = Math.round(
      taxableAmount + taxAmount
    );

    const amountPaid = Math.min(
      Math.max(Number(data.amountPaid || 0), 0),
      grandTotal
    );

    const balance = Math.max(
      0,
      grandTotal - amountPaid
    );

    return {
      subtotal,
      discountAmount: safeDiscount,
      taxableAmount,
      taxAmount,
      grandTotal,
      amountPaid,
      balance,
    };
  }, [data]);

  /* =========================================================
     UPDATE DATA
  ========================================================= */

  const updateData = <K extends keyof InvoiceData>(
    key: K,
    value: InvoiceData[K]
  ) => {
    setData((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  /* =========================================================
     ITEM MANAGEMENT
  ========================================================= */

  const handleItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    setData((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]: value,
            }
          : item
      ),
    }));
  };

  const addItem = () => {
    setData((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        {
          id: createId(),
          description: "",
          category: "Academic",
          quantity: 1,
          rate: 0,
        },
      ],
    }));
  };

  const removeItem = (id: string) => {
    setData((previous) => {
      if (previous.items.length <= 1) {
        return previous;
      }

      return {
        ...previous,
        items: previous.items.filter(
          (item) => item.id !== id
        ),
      };
    });
  };

  /* =========================================================
     NEW INVOICE
  ========================================================= */

  const resetInvoice = () => {
    const confirmed = window.confirm(
      "Start a new invoice? Current invoice data will be cleared."
    );

    if (!confirmed) {
      return;
    }

    setData(createNewInvoice());
    setSyncStatus(null);
    setActiveTab("invoice");
  };

  /* =========================================================
     GOOGLE SHEET SYNC
  ========================================================= */

  const syncToGoogleSheet = async () => {
    if (!data.googleSheetWebhookUrl.trim()) {
      alert(
        "Please enter your Google Apps Script Web App URL first."
      );
      return;
    }

    if (!data.customerName.trim()) {
      alert("Please enter student/client name.");
      return;
    }

    if (!data.customerPhone.trim()) {
      alert("Please enter student/client phone number.");
      return;
    }

    if (calculations.grandTotal <= 0) {
      alert("Invoice total must be greater than ₹0.");
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);

    const payload = {
      invoiceId: data.invoiceId,

      invoiceNumber: data.invoiceNumber,

      invoiceDate: data.date,
      dueDate: data.dueDate,

      studentId: data.studentId,
      studentName: data.customerName,
      fatherName: data.fatherName,

      mobile: data.customerPhone,
      email: data.customerEmail,
      address: data.customerAddress,

      course: data.course,
      batch: data.batch,
      feeType: data.feeType,

      items: data.items,

      description: data.items
        .map((item) => item.description)
        .filter(Boolean)
        .join(", "),

      amount: calculations.subtotal,

      discount: calculations.discountAmount,

      tax: calculations.taxAmount,

      finalAmount: calculations.grandTotal,

      amountPaid: calculations.amountPaid,

      balance: calculations.balance,

      paymentStatus: data.paymentStatus,

      paymentMethod: data.paymentMode,

      transactionId: data.transactionId,

      createdAt: new Date().toISOString(),

      createdBy: "Admin",

      notes: data.notes,

      founderName: data.founderName,

      businessName: data.businessName,
    };

    try {
      /*
       * IMPORTANT:
       * text/plain avoids CORS preflight problems with
       * Google Apps Script Web Apps.
       */
      await fetch(data.googleSheetWebhookUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      setSyncStatus({
        success: true,
        message:
          "✓ Invoice sent to Google Sheet successfully.",
      });
    } catch (error) {
      console.error(
        "Google Sheet sync error:",
        error
      );

      setSyncStatus({
        success: false,
        message:
          "✕ Sync failed. Please check the Google Apps Script URL and deployment.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  /* =========================================================
     EXPORT IMAGE
  ========================================================= */

  const exportAsImage = async (
    format: "jpeg" | "png"
  ) => {
    if (!invoiceRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const html2canvas = (
        await import("html2canvas")
      ).default;

      const canvas = await html2canvas(
        invoiceRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        }
      );

      const image = canvas.toDataURL(
        `image/${format}`,
        0.95
      );

      const link =
        document.createElement("a");

      link.href = image;

      link.download = `${data.invoiceNumber}.${
        format === "jpeg" ? "jpg" : "png"
      }`;

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(
        "Image export failed:",
        error
      );

      alert(
        "Unable to export invoice image."
      );
    } finally {
      setIsExporting(false);
    }
  };

  /* =========================================================
     EXPORT PDF
  ========================================================= */

  const exportAsPDF = async () => {
    if (!invoiceRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const html2canvas = (
        await import("html2canvas")
      ).default;

      const { jsPDF } =
        await import("jspdf");

      const canvas = await html2canvas(
        invoiceRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
        }
      );

      const imgData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const imageHeight =
        (canvas.height * pageWidth) /
        canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        pageWidth,
        imageHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          pageWidth,
          imageHeight
        );

        heightLeft -= pageHeight;
      }

      pdf.save(
        `${data.invoiceNumber}.pdf`
      );
    } catch (error) {
      console.error(
        "PDF export failed:",
        error
      );

      alert(
        "Unable to generate PDF."
      );
    } finally {
      setIsExporting(false);
    }
  };

  /* =========================================================
     PRINT
  ========================================================= */

  const printInvoice = () => {
    window.print();
  };

  /* =========================================================
     WHATSAPP
  ========================================================= */

  const shareOnWhatsApp = () => {
    const text =
      `*INVOICE FROM VEEZNA*\n` +
      `---------------------------\n` +
      `*Invoice No:* ${data.invoiceNumber}\n` +
      `*Student:* ${data.customerName || "Student"}\n` +
      `*Total:* ₹${calculations.grandTotal.toLocaleString(
        "en-IN"
      )}\n` +
      `*Paid:* ₹${calculations.amountPaid.toLocaleString(
        "en-IN"
      )}\n` +
      `*Balance:* ₹${calculations.balance.toLocaleString(
        "en-IN"
      )}\n` +
      `*Status:* ${data.paymentStatus}\n` +
      `*Date:* ${data.date}\n` +
      `---------------------------\n` +
      `Thank you for choosing Veezna!`;

    const phone = data.customerPhone.replace(
      /\D/g,
      ""
    );

    const url =
      phone.length >= 10
        ? `https://wa.me/91${phone.slice(
            -10
          )}?text=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(
            text
          )}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-3 sm:p-6 lg:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4 print:hidden">

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#0057B8] flex items-center justify-center text-white font-black text-xl shadow-md">
              V
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight">
                VEEZNA Invoice Studio
              </h1>

              <p className="text-xs text-slate-500">
                Admin billing & invoice management
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={resetInvoice}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
            >
              + New Invoice
            </button>

            <button
              onClick={printInvoice}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              🖨 Print
            </button>

            <button
              onClick={exportAsPDF}
              disabled={isExporting}
              className="px-3 py-2 bg-[#0057B8] hover:bg-[#00428d] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
            >
              {isExporting
                ? "Exporting..."
                : "📄 PDF"}
            </button>

            <button
              onClick={() =>
                exportAsImage("jpeg")
              }
              disabled={isExporting}
              className="px-3 py-2 bg-[#F7931E] hover:bg-[#d87b0f] disabled:opacity-50 text-white rounded-xl text-xs font-bold"
            >
              🖼 JPG
            </button>

            <button
              onClick={shareOnWhatsApp}
              className="px-3 py-2 bg-[#25D366] hover:bg-[#1eb757] text-white rounded-xl text-xs font-bold"
            >
              💬 WhatsApp
            </button>

          </div>
        </div>

        {/* =====================================================
            TABS
        ====================================================== */}

        <div className="bg-white rounded-2xl border border-slate-200 p-2 flex flex-wrap gap-2 print:hidden">

          <button
            onClick={() =>
              setActiveTab("invoice")
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === "invoice"
                ? "bg-[#0057B8] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Invoice
          </button>

          <button
            onClick={() =>
              setActiveTab("business")
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === "business"
                ? "bg-[#0057B8] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Business Settings
          </button>

          <button
            onClick={() =>
              setActiveTab("sync")
            }
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              activeTab === "sync"
                ? "bg-[#0057B8] text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            Google Sheet
          </button>

        </div>

        {/* =====================================================
            SYNC STATUS
        ====================================================== */}

        {syncStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-bold ${
              syncStatus.success
                ? "bg-emerald-100 text-emerald-800"
                : "bg-rose-100 text-rose-800"
            } print:hidden`}
          >
            {syncStatus.message}
          </div>
        )}

        {/* =====================================================
            BUSINESS / GOOGLE SETTINGS
        ====================================================== */}

        {activeTab !== "invoice" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 print:hidden">

            {activeTab === "business" && (
              <div className="space-y-4">

                <div>
                  <h2 className="font-black text-lg">
                    Business Information
                  </h2>

                  <p className="text-xs text-slate-500">
                    This information appears on every invoice.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-3">

                  <input
                    value={data.businessName}
                    onChange={(e) =>
                      updateData(
                        "businessName",
                        e.target.value
                      )
                    }
                    placeholder="Business Name"
                    className="input"
                  />

                  <input
                    value={data.founderName}
                    onChange={(e) =>
                      updateData(
                        "founderName",
                        e.target.value
                      )
                    }
                    placeholder="Founder & CEO"
                    className="input"
                  />

                  <input
                    value={data.businessEmail}
                    onChange={(e) =>
                      updateData(
                        "businessEmail",
                        e.target.value
                      )
                    }
                    placeholder="Business Email"
                    className="input"
                  />

                  <input
                    value={data.businessWebsite}
                    onChange={(e) =>
                      updateData(
                        "businessWebsite",
                        e.target.value
                      )
                    }
                    placeholder="Website"
                    className="input"
                  />

                  <input
                    value={data.gstin}
                    onChange={(e) =>
                      updateData(
                        "gstin",
                        e.target.value
                      )
                    }
                    placeholder="GSTIN (Optional)"
                    className="input"
                  />

                  <input
                    value={data.upiId}
                    onChange={(e) =>
                      updateData(
                        "upiId",
                        e.target.value
                      )
                    }
                    placeholder="UPI ID (Optional)"
                    className="input"
                  />

                  <textarea
                    value={data.businessAddress}
                    onChange={(e) =>
                      updateData(
                        "businessAddress",
                        e.target.value
                      )
                    }
                    placeholder="Business Address"
                    rows={2}
                    className="input md:col-span-2"
                  />

                  <textarea
                    value={data.bankDetails}
                    onChange={(e) =>
                      updateData(
                        "bankDetails",
                        e.target.value
                      )
                    }
                    placeholder="Bank Details (Optional)"
                    rows={2}
                    className="input md:col-span-2"
                  />

                </div>

              </div>
            )}

            {activeTab === "sync" && (
              <div className="space-y-4">

                <div>
                  <h2 className="font-black text-lg">
                    Google Sheet Integration
                  </h2>

                  <p className="text-xs text-slate-500">
                    Your VEEZNA Invoice Google Apps Script
                    Web App is connected below.
                  </p>
                </div>

                <input
                  type="url"
                  value={
                    data.googleSheetWebhookUrl
                  }
                  onChange={(e) =>
                    updateData(
                      "googleSheetWebhookUrl",
                      e.target.value
                    )
                  }
                  placeholder="Google Apps Script Web App URL"
                  className="input"
                />

                <div className="flex flex-wrap gap-2">

                  <button
                    onClick={syncToGoogleSheet}
                    disabled={isSyncing}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                  >
                    {isSyncing
                      ? "Syncing..."
                      : "📊 Save Invoice to Google Sheet"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab("invoice")
                    }
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold"
                  >
                    ← Back to Invoice
                  </button>

                </div>

              </div>
            )}

          </div>
        )}

        {/* =====================================================
            MAIN INVOICE
        ====================================================== */}

        {activeTab === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* =================================================
                EDITOR
            ================================================== */}

            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-5 print:hidden">

              <h2 className="font-black text-sm uppercase tracking-wider text-slate-500 border-b pb-2">
                Invoice Details
              </h2>

              {/* CLIENT */}

              <div className="space-y-3">

                <p className="text-xs font-bold">
                  Student / Client
                </p>

                <div className="grid grid-cols-2 gap-2">

                  <input
                    value={data.studentId}
                    onChange={(e) =>
                      updateData(
                        "studentId",
                        e.target.value
                      )
                    }
                    placeholder="Student ID"
                    className="input"
                  />

                  <input
                    value={data.customerName}
                    onChange={(e) =>
                      updateData(
                        "customerName",
                        e.target.value
                      )
                    }
                    placeholder="Full Name *"
                    className="input"
                  />

                </div>

                <input
                  value={data.fatherName}
                  onChange={(e) =>
                    updateData(
                      "fatherName",
                      e.target.value
                    )
                  }
                  placeholder="Father / Guardian Name"
                  className="input"
                />

                <div className="grid grid-cols-2 gap-2">

                  <input
                    value={data.customerPhone}
                    onChange={(e) =>
                      updateData(
                        "customerPhone",
                        e.target.value
                      )
                    }
                    placeholder="Phone *"
                    className="input"
                  />

                  <input
                    type="email"
                    value={data.customerEmail}
                    onChange={(e) =>
                      updateData(
                        "customerEmail",
                        e.target.value
                      )
                    }
                    placeholder="Email"
                    className="input"
                  />

                </div>

                <textarea
                  value={data.customerAddress}
                  onChange={(e) =>
                    updateData(
                      "customerAddress",
                      e.target.value
                    )
                  }
                  placeholder="Address / City"
                  rows={2}
                  className="input"
                />

              </div>

              {/* COURSE */}

              <div className="space-y-3">

                <p className="text-xs font-bold">
                  Course / Enrollment
                </p>

                <div className="grid grid-cols-2 gap-2">

                  <input
                    value={data.course}
                    onChange={(e) =>
                      updateData(
                        "course",
                        e.target.value
                      )
                    }
                    placeholder="Course / Program"
                    className="input"
                  />

                  <input
                    value={data.batch}
                    onChange={(e) =>
                      updateData(
                        "batch",
                        e.target.value
                      )
                    }
                    placeholder="Batch"
                    className="input"
                  />

                </div>

                <select
                  value={data.feeType}
                  onChange={(e) =>
                    updateData(
                      "feeType",
                      e.target.value
                    )
                  }
                  className="input"
                >
                  <option value="Course Fee">
                    Course Fee
                  </option>
                  <option value="Admission Fee">
                    Admission Fee
                  </option>
                  <option value="Registration Fee">
                    Registration Fee
                  </option>
                  <option value="Monthly Fee">
                    Monthly Fee
                  </option>
                  <option value="Material Fee">
                    Material Fee
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>

              </div>

              {/* META */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="label">
                    Invoice Number
                  </label>

                  <input
                    value={data.invoiceNumber}
                    onChange={(e) =>
                      updateData(
                        "invoiceNumber",
                        e.target.value
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Issue Date
                  </label>

                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) =>
                      updateData(
                        "date",
                        e.target.value
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Due Date
                  </label>

                  <input
                    type="date"
                    value={data.dueDate}
                    onChange={(e) =>
                      updateData(
                        "dueDate",
                        e.target.value
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Payment Mode
                  </label>

                  <select
                    value={data.paymentMode}
                    onChange={(e) =>
                      updateData(
                        "paymentMode",
                        e.target.value as InvoiceData["paymentMode"]
                      )
                    }
                    className="input"
                  >
                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="Card">
                      Card
                    </option>
                  </select>
                </div>

              </div>

              {/* PAYMENT */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="label">
                    Payment Status
                  </label>

                  <select
                    value={data.paymentStatus}
                    onChange={(e) =>
                      updateData(
                        "paymentStatus",
                        e.target.value as InvoiceData["paymentStatus"]
                      )
                    }
                    className="input font-bold"
                  >
                    <option value="PAID">
                      PAID
                    </option>

                    <option value="PENDING">
                      PENDING
                    </option>

                    <option value="PARTIAL">
                      PARTIAL
                    </option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Tax / GST %
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={data.taxRate}
                    onChange={(e) =>
                      updateData(
                        "taxRate",
                        Number(e.target.value)
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Amount Paid ₹
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={data.amountPaid}
                    onChange={(e) =>
                      updateData(
                        "amountPaid",
                        Number(e.target.value)
                      )
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Transaction ID
                  </label>

                  <input
                    value={data.transactionId}
                    onChange={(e) =>
                      updateData(
                        "transactionId",
                        e.target.value
                      )
                    }
                    placeholder="Optional"
                    className="input"
                  />
                </div>

              </div>

              {/* ITEMS */}

              <div className="space-y-3">

                <div className="flex justify-between items-center">

                  <p className="text-xs font-bold">
                    Services & Programs
                  </p>

                  <button
                    onClick={addItem}
                    className="text-xs font-bold text-[#0057B8]"
                  >
                    + Add Item
                  </button>

                </div>

                {data.items.map(
                  (item, index) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                    >

                      <div className="flex justify-between items-center">

                        <span className="text-[10px] font-bold text-slate-400">
                          #{index + 1}
                        </span>

                        <select
                          value={item.category}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "category",
                              e.target.value
                            )
                          }
                          className="text-[10px] bg-white border rounded px-2 py-1"
                        >
                          <option value="Academic">
                            Academic
                          </option>

                          <option value="Wellness">
                            Wellness
                          </option>

                          <option value="Material">
                            Material
                          </option>

                          <option value="Other">
                            Other
                          </option>
                        </select>

                        {data.items.length > 1 && (
                          <button
                            onClick={() =>
                              removeItem(
                                item.id
                              )
                            }
                            className="text-rose-500 font-bold"
                          >
                            ✕
                          </button>
                        )}

                      </div>

                      <input
                        value={
                          item.description
                        }
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "description",
                            e.target.value
                          )
                        }
                        placeholder="Service / Program Description"
                        className="input"
                      />

                      <div className="grid grid-cols-2 gap-2">

                        <input
                          type="number"
                          min="1"
                          value={
                            item.quantity
                          }
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "quantity",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          placeholder="Quantity"
                          className="input"
                        />

                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "rate",
                              Number(
                                e.target.value
                              )
                            )
                          }
                          placeholder="Rate ₹"
                          className="input"
                        />

                      </div>

                    </div>
                  )
                )}

              </div>

              {/* DISCOUNT */}

              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="label">
                    Discount Type
                  </label>

                  <select
                    value={
                      data.discountType
                    }
                    onChange={(e) =>
                      updateData(
                        "discountType",
                        e.target.value as InvoiceData["discountType"]
                      )
                    }
                    className="input"
                  >
                    <option value="flat">
                      Flat ₹
                    </option>

                    <option value="percentage">
                      Percentage %
                    </option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Discount
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      data.discountValue
                    }
                    onChange={(e) =>
                      updateData(
                        "discountValue",
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="input"
                  />
                </div>

              </div>

              {/* NOTES */}

              <textarea
                value={data.notes}
                onChange={(e) =>
                  updateData(
                    "notes",
                    e.target.value
                  )
                }
                placeholder="Invoice notes / terms"
                rows={3}
                className="input"
              />

              {/* SAVE */}

              <button
                onClick={syncToGoogleSheet}
                disabled={isSyncing}
                className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-black"
              >
                {isSyncing
                  ? "Saving Invoice..."
                  : "📊 SAVE INVOICE TO GOOGLE SHEET"}
              </button>

            </div>

            {/* =================================================
                INVOICE PREVIEW
            ================================================== */}

            <div className="lg:col-span-7 overflow-x-auto">

              <div
                ref={invoiceRef}
                className="w-[700px] mx-auto bg-white p-8 shadow-lg text-slate-800"
                style={{
                  minHeight: "990px",
                }}
              >

                {/* HEADER */}

                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-6">

                  <div>

                    <div className="flex items-center gap-2">

                      <div className="w-9 h-9 rounded-lg bg-[#0057B8] text-white flex items-center justify-center font-black text-xl">
                        V
                      </div>

                      <span className="text-3xl font-black text-[#002855]">
                        {data.businessName}
                      </span>

                    </div>

                    <p className="text-[10px] font-black tracking-widest text-[#F7931E] mt-1">
                      EDUCATION & HOLISTIC WELLNESS
                    </p>

                    <p className="text-[10px] text-slate-500 mt-2">
                      {data.businessAddress}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {data.businessWebsite} •{" "}
                      {data.businessEmail}
                    </p>

                    <p className="text-[10px] text-slate-500 mt-1">
                      Founder & CEO:{" "}
                      <strong>
                        {data.founderName}
                      </strong>
                    </p>

                    {data.gstin && (
                      <p className="text-[10px] text-slate-500">
                        GSTIN: {data.gstin}
                      </p>
                    )}

                  </div>

                  <div className="text-right">

                    <h2 className="text-3xl font-black">
                      INVOICE
                    </h2>

                    <p className="text-xs font-bold text-[#0057B8]">
                      {data.invoiceNumber}
                    </p>

                    <div
                      className={`inline-block mt-3 px-3 py-1 rounded-full text-[10px] font-black ${
                        data.paymentStatus ===
                        "PAID"
                          ? "bg-emerald-100 text-emerald-700"
                          : data.paymentStatus ===
                            "PARTIAL"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      ● {data.paymentStatus}
                    </div>

                  </div>

                </div>

                {/* CLIENT */}

                <div className="grid grid-cols-2 gap-8 mt-7">

                  <div>

                    <p className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                      Billed To
                    </p>

                    <p className="font-black text-lg mt-1">
                      {data.customerName ||
                        "Student / Client Name"}
                    </p>

                    {data.studentId && (
                      <p className="text-xs text-[#0057B8] font-bold">
                        Student ID: {data.studentId}
                      </p>
                    )}

                    {data.fatherName && (
                      <p className="text-xs">
                        Father / Guardian:{" "}
                        {data.fatherName}
                      </p>
                    )}

                    <p className="text-xs">
                      {data.customerPhone ||
                        "+91 00000 00000"}
                    </p>

                    {data.customerEmail && (
                      <p className="text-xs text-slate-500">
                        {data.customerEmail}
                      </p>
                    )}

                    {data.customerAddress && (
                      <p className="text-xs text-slate-500 mt-1">
                        {data.customerAddress}
                      </p>
                    )}

                  </div>

                  <div className="text-right text-xs space-y-1">

                    {data.course && (
                      <p>
                        <span className="text-slate-400">
                          Course:{" "}
                        </span>

                        <strong>
                          {data.course}
                        </strong>
                      </p>
                    )}

                    {data.batch && (
                      <p>
                        <span className="text-slate-400">
                          Batch:{" "}
                        </span>

                        <strong>
                          {data.batch}
                        </strong>
                      </p>
                    )}

                    <p>
                      <span className="text-slate-400">
                        Issue Date:{" "}
                      </span>

                      <strong>
                        {data.date}
                      </strong>
                    </p>

                    <p>
                      <span className="text-slate-400">
                        Due Date:{" "}
                      </span>

                      <strong>
                        {data.dueDate}
                      </strong>
                    </p>

                    <p>
                      <span className="text-slate-400">
                        Payment:{" "}
                      </span>

                      <strong className="text-[#0057B8]">
                        {data.paymentMode}
                      </strong>
                    </p>

                  </div>

                </div>

                {/* ITEMS */}

                <table className="w-full mt-8 text-xs border-collapse">

                  <thead>

                    <tr className="border-y-2 border-slate-800">

                      <th className="py-3 text-left">
                        Description
                      </th>

                      <th className="py-3 text-center">
                        Category
                      </th>

                      <th className="py-3 text-center">
                        Qty
                      </th>

                      <th className="py-3 text-right">
                        Rate
                      </th>

                      <th className="py-3 text-right">
                        Amount
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {data.items.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100"
                        >

                          <td className="py-4 font-bold">
                            {item.description ||
                              "Program / Service"}
                          </td>

                          <td className="py-4 text-center text-[10px]">
                            {item.category}
                          </td>

                          <td className="py-4 text-center">
                            {item.quantity}
                          </td>

                          <td className="py-4 text-right">
                            ₹
                            {Number(
                              item.rate
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                          <td className="py-4 text-right font-bold">
                            ₹
                            {(
                              Number(
                                item.quantity
                              ) *
                              Number(
                                item.rate
                              )
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

                {/* SUMMARY */}

                <div className="flex justify-between mt-8 border-t pt-5">

                  <div className="w-1/2 text-xs text-slate-500">

                    <p className="font-black text-slate-700 mb-2">
                      Notes
                    </p>

                    <p className="leading-relaxed">
                      {data.notes}
                    </p>

                    {data.upiId && (
                      <p className="mt-3">
                        UPI:{" "}
                        <strong>
                          {data.upiId}
                        </strong>
                      </p>
                    )}

                    {data.bankDetails && (
                      <p className="mt-2 whitespace-pre-line">
                        {data.bankDetails}
                      </p>
                    )}

                    {data.transactionId && (
                      <p className="mt-3">
                        Transaction ID:{" "}
                        <strong>
                          {data.transactionId}
                        </strong>
                      </p>
                    )}

                  </div>

                  <div className="w-5/12 text-xs space-y-2">

                    <div className="flex justify-between">
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₹
                        {calculations.subtotal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                    {calculations.discountAmount >
                      0 && (
                      <div className="flex justify-between text-emerald-600">

                        <span>
                          Discount
                        </span>

                        <strong>
                          -₹
                          {calculations.discountAmount.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>
                    )}

                    {calculations.taxAmount >
                      0 && (
                      <div className="flex justify-between">

                        <span>
                          GST / Tax
                        </span>

                        <strong>
                          ₹
                          {calculations.taxAmount.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>
                    )}

                    <div className="border-t-2 border-slate-800 pt-3 flex justify-between text-lg font-black text-[#002855]">

                      <span>
                        Grand Total
                      </span>

                      <span>
                        ₹
                        {calculations.grandTotal.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>

                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Amount Paid
                      </span>

                      <strong>
                        ₹
                        {calculations.amountPaid.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                    <div className="flex justify-between text-rose-600 font-bold">
                      <span>
                        Balance
                      </span>

                      <strong>
                        ₹
                        {calculations.balance.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    </div>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="mt-16 pt-5 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-400">

                  <div>

                    <p className="font-bold text-slate-600">
                      Veezna Official Invoice
                    </p>

                    <p>
                      Computer generated invoice.
                    </p>

                    <p>
                      Founder & CEO:{" "}
                      {data.founderName}
                    </p>

                  </div>

                  <div className="text-center">

                    <div className="w-32 border-b border-slate-300 mb-1" />

                    <p className="font-bold text-slate-600">
                      Authorized Signatory
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* =======================================================
          GLOBAL STYLES
      ======================================================== */}

      <style jsx global>{`
        .input {
          width: 100%;
          padding: 9px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12px;
          outline: none;
          transition: all 0.15s ease;
        }

        .input:focus {
          background: white;
          border-color: #93c5fd;
          box-shadow:
            0 0 0 2px rgba(59, 130, 246, 0.08);
        }

        .label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 5px;
        }

        @media print {
          body {
            background: white !important;
          }

          @page {
            size: A4;
            margin: 0;
          }

          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}