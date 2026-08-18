// src/lib/whatsapp.ts

import "server-only";

// ============================================================
// WHATSAPP CONFIGURATION
// ============================================================

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_API_VERSION =
  process.env.WHATSAPP_API_VERSION || "v21.0";

const WHATSAPP_API_URL =
  `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// ============================================================
// TYPES
// ============================================================

export interface WhatsAppSendTextResult {
  success: boolean;
  messageId?: string;
  contacts?: unknown[];
  error?: string;
  raw?: unknown;
}

export interface WhatsAppIncomingMessage {
  from: string;
  messageId?: string;
  messageType?: string;
  text?: string;
  timestamp?: string;
  profileName?: string;
}

export interface WhatsAppLeadData {
  name?: string;
  mobile?: string;
  className?: string;
  qualification?: string;
  program?: string;
  city?: string;
  requirement?: string;
}

// ============================================================
// CONFIG CHECK
// ============================================================

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    WHATSAPP_ACCESS_TOKEN &&
      WHATSAPP_PHONE_NUMBER_ID
  );
}

// ============================================================
// NORMALIZE INDIAN WHATSAPP NUMBER
// ============================================================

export function normalizeWhatsAppNumber(
  phone: string
): string {
  let value = String(phone)
    .trim()
    .replace(/[^\d+]/g, "");

  if (value.startsWith("+")) {
    value = value.substring(1);
  }

  // 10-digit Indian mobile number
  if (
    value.length === 10 &&
    /^[6-9]\d{9}$/.test(value)
  ) {
    value = `91${value}`;
  }

  // 0XXXXXXXXXX
  if (
    value.startsWith("0") &&
    value.length === 11
  ) {
    value = `91${value.substring(1)}`;
  }

  return value;
}

// ============================================================
// SEND TEXT MESSAGE
// ============================================================

export async function sendWhatsAppText(
  to: string,
  message: string
): Promise<WhatsAppSendTextResult> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    return {
      success: false,
      error:
        "WHATSAPP_ACCESS_TOKEN is not configured.",
    };
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    return {
      success: false,
      error:
        "WHATSAPP_PHONE_NUMBER_ID is not configured.",
    };
  }

  if (!to) {
    return {
      success: false,
      error:
        "WhatsApp recipient number is required.",
    };
  }

  if (!message || !message.trim()) {
    return {
      success: false,
      error:
        "WhatsApp message cannot be empty.",
    };
  }

  const normalizedNumber =
    normalizeWhatsAppNumber(to);

  if (
    !normalizedNumber ||
    normalizedNumber.length < 10
  ) {
    return {
      success: false,
      error:
        "Invalid WhatsApp recipient number.",
    };
  }

  try {
    const response = await fetch(
      WHATSAPP_API_URL,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          messaging_product:
            "whatsapp",
          recipient_type:
            "individual",
          to: normalizedNumber,
          type: "text",
          text: {
            preview_url: false,
            body: message.trim(),
          },
        }),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "[WhatsApp] Send failed:",
        data
      );

      return {
        success: false,
        error:
          data?.error?.message ||
          "WhatsApp message could not be sent.",
        raw: data,
      };
    }

    return {
      success: true,
      messageId:
        data?.messages?.[0]?.id,
      contacts:
        data?.contacts,
      raw: data,
    };
  } catch (error: any) {
    console.error(
      "[WhatsApp] Network error:",
      error
    );

    return {
      success: false,
      error:
        error?.message ||
        "Unable to connect to WhatsApp API.",
    };
  }
}

// ============================================================
// MAIN WELCOME MENU
// ============================================================

export async function sendWhatsAppWelcome(
  to: string
): Promise<WhatsAppSendTextResult> {
  const message = `👋 Welcome to Veezna!

We are happy to help you.

Please choose an option:

1️⃣ Courses & Programs
2️⃣ Admission
3️⃣ Fees & Payments
4️⃣ VLS – Veezna Learning System
5️⃣ Talk to a Counsellor

Reply with the number of your choice.

You can type *MENU* anytime to return here.

— Team Veezna
Vision Turns Into Mission`;

  return sendWhatsAppText(
    to,
    message
  );
}

// ============================================================
// COURSES RESPONSE
// ============================================================

export async function sendWhatsAppCourses(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `📚 *Veezna Programs*

We currently offer:

🎤 *Veezna Vox*
Spoken English & Communication

💻 *Web Development*
Full Stack Web Development & AI Engineering

🧠 *Veezna Wellness*
Counselling, Hypnotherapy & Wellness Support

📈 *Veezna Spark*
Trading & Business Learning

🎓 *VLS*
Veezna Learning System

Reply with:

*ADMISSION* — Start admission enquiry
*FEES* — Fee information
*VLS* — Learn about VLS
*COUNSELLOR* — Talk to our team
*MENU* — Main menu`
  );
}

// ============================================================
// ADMISSION RESPONSE
// ============================================================

export async function sendWhatsAppAdmission(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `🎓 *Veezna Admission Enquiry*

Let's get started.

Please send the following information in one message:

1. Student Name
2. Class / Qualification
3. Program interested in
4. City
5. Parent/Student Mobile Number

Example:

Name: Rahul Sharma
Class: 10
Program: Academic Excellence
City: Neemuch
Mobile: 9876543210

Our Veezna team will guide you further.

Reply *MENU* for the main menu.`
  );
}

// ============================================================
// FEES RESPONSE
// ============================================================

export async function sendWhatsAppFees(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `💳 *Veezna Fees & Payments*

For admission/course fee information, please tell us:

• Student Name
• Program / Class

For an existing student, send your:

*Student ID*

Example:

STU-1001

Your student-specific fee information can then be checked from the Veezna student system.

Reply *MENU* for the main menu.`
  );
}

// ============================================================
// VLS RESPONSE
// ============================================================

export async function sendWhatsAppVLS(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `🧠 *VLS — Veezna Learning System*

VLS is Veezna's learning intelligence platform.

It helps students:

📚 Learn
📝 Practise
📊 Track progress
🎯 Build mastery
❌ Analyse mistakes
🤖 Get AI learning assistance
📅 Follow a learning plan

VLS is designed to grow into a complete student learning ecosystem.

Reply:

*ADMISSION* — Join Veezna
*COUNSELLOR* — Talk to our team
*MENU* — Main menu`
  );
}

// ============================================================
// COUNSELLOR RESPONSE
// ============================================================

export async function sendWhatsAppCounsellor(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `👨‍🏫 *Veezna Counsellor Support*

Your request has been received.

Please send:

• Your name
• Your requirement
• Program / Class
• Preferred contact time

Our counsellor will assist you.

If your requirement is urgent, please mention:

*URGENT*

— Team Veezna`
  );
}

// ============================================================
// UNKNOWN MESSAGE RESPONSE
// ============================================================

export async function sendWhatsAppUnknown(
  to: string
): Promise<WhatsAppSendTextResult> {
  return sendWhatsAppText(
    to,
    `I didn't quite understand that. 🙂

Please choose:

1️⃣ Courses & Programs
2️⃣ Admission
3️⃣ Fees & Payments
4️⃣ VLS
5️⃣ Talk to a Counsellor

Reply with the number.

Type *MENU* anytime.`
  );
}

// ============================================================
// STUDENT ID DETECTION
// ============================================================

export function extractStudentId(
  message: string
): string | null {
  const match =
    message
      .trim()
      .toUpperCase()
      .match(
        /\bSTU[- ]?\d{3,10}\b/
      );

  if (!match) {
    return null;
  }

  return match[0]
    .replace(" ", "-");
}

// ============================================================
// INDIAN MOBILE DETECTION
// ============================================================

export function extractIndianMobile(
  message: string
): string | null {
  const matches =
    message.match(
      /(?:\+91[\s-]?)?[6-9]\d{9}\b/g
    );

  if (!matches?.length) {
    return null;
  }

  return normalizeWhatsAppNumber(
    matches[0]
  );
}

// ============================================================
// SIMPLE ADMISSION LEAD EXTRACTION
// ============================================================

export function extractLeadData(
  message: string
): WhatsAppLeadData {
  const lead: WhatsAppLeadData = {};

  const mobile =
    extractIndianMobile(message);

  if (mobile) {
    lead.mobile = mobile;
  }

  const lines =
    message
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

  for (const line of lines) {
    const separatorIndex =
      line.indexOf(":");

    if (separatorIndex === -1) {
      continue;
    }

    const key =
      line
        .slice(0, separatorIndex)
        .trim()
        .toLowerCase();

    const value =
      line
        .slice(separatorIndex + 1)
        .trim();

    if (!value) {
      continue;
    }

    if (
      key.includes("name")
    ) {
      lead.name = value;
    }

    if (
      key.includes("class")
    ) {
      lead.className = value;
    }

    if (
      key.includes("qualification")
    ) {
      lead.qualification = value;
    }

    if (
      key.includes("program") ||
      key.includes("course")
    ) {
      lead.program = value;
    }

    if (
      key.includes("city")
    ) {
      lead.city = value;
    }

    if (
      key.includes("requirement") ||
      key.includes("need")
    ) {
      lead.requirement = value;
    }
  }

  return lead;
}

// ============================================================
// AUTOMATED WHATSAPP REPLY ENGINE
// ============================================================

export async function generateWhatsAppAutoReply(
  from: string,
  incomingMessage: string
): Promise<WhatsAppSendTextResult> {
  const text =
    String(incomingMessage || "")
      .trim()
      .toLowerCase();

  if (!text) {
    return sendWhatsAppWelcome(from);
  }

  // ----------------------------------------------------------
  // MENU / GREETING
  // ----------------------------------------------------------

  if (
    [
      "hi",
      "hello",
      "hey",
      "hii",
      "hiii",
      "namaste",
      "namaskar",
      "start",
      "menu",
      "0",
    ].includes(text)
  ) {
    return sendWhatsAppWelcome(from);
  }

  // ----------------------------------------------------------
  // COURSES
  // ----------------------------------------------------------

  if (
    text === "1" ||
    text.includes("course") ||
    text.includes("courses") ||
    text.includes("program") ||
    text.includes("programs")
  ) {
    return sendWhatsAppCourses(from);
  }

  // ----------------------------------------------------------
  // ADMISSION
  // ----------------------------------------------------------

  if (
    text === "2" ||
    text.includes("admission") ||
    text.includes("admit") ||
    text.includes("join") ||
    text.includes("joining")
  ) {
    return sendWhatsAppAdmission(from);
  }

  // ----------------------------------------------------------
  // FEES
  // ----------------------------------------------------------

  if (
    text === "3" ||
    text.includes("fee") ||
    text.includes("fees") ||
    text.includes("payment") ||
    text.includes("payments") ||
    text.includes("price") ||
    text.includes("pricing")
  ) {
    return sendWhatsAppFees(from);
  }

  // ----------------------------------------------------------
  // VLS
  // ----------------------------------------------------------

  if (
    text === "4" ||
    text.includes("vls") ||
    text.includes("learning system")
  ) {
    return sendWhatsAppVLS(from);
  }

  // ----------------------------------------------------------
  // COUNSELLOR
  // ----------------------------------------------------------

  if (
    text === "5" ||
    text.includes("counsellor") ||
    text.includes("counselor") ||
    text.includes("human") ||
    text.includes("talk to") ||
    text.includes("contact")
  ) {
    return sendWhatsAppCounsellor(from);
  }

  // ----------------------------------------------------------
  // STUDENT ID
  // ----------------------------------------------------------

  const studentId =
    extractStudentId(
      incomingMessage
    );

  if (studentId) {
    return sendWhatsAppText(
      from,
      `🔎 *Student ID Received*

Student ID:

*${studentId}*

Your request has been received.

Student-specific fee and academic information can be connected to the Veezna student system.

If you need counsellor support, reply:

*COUNSELLOR*

Reply *MENU* for the main menu.`
    );
  }

  // ----------------------------------------------------------
  // SPECIFIC COMMON QUESTIONS
  // ----------------------------------------------------------

  if (
    text.includes("spoken english") ||
    text.includes("english course")
  ) {
    return sendWhatsAppText(
      from,
      `🎤 *Veezna Vox — Spoken English*

Veezna Vox focuses on:

• Spoken English
• Communication
• Confidence
• Vocabulary
• Pronunciation
• Practical conversation

Reply *ADMISSION* to enquire about joining.

Reply *MENU* for all programs.`
    );
  }

  if (
    text.includes("web development") ||
    text.includes("coding") ||
    text.includes("programming") ||
    text.includes("ai engineering")
  ) {
    return sendWhatsAppText(
      from,
      `💻 *Veezna Web Development & AI Engineering*

The program is designed to take learners from:

Beginner → Professional → Industry Ready

Topics include:

• Programming
• Web Development
• JavaScript
• Python
• HTML
• CSS
• AI Engineering

Reply *ADMISSION* to enquire.

Reply *MENU* for all programs.`
    );
  }

  if (
    text.includes("trading") ||
    text.includes("business")
  ) {
    return sendWhatsAppText(
      from,
      `📈 *Veezna Spark*

Veezna Spark focuses on practical learning around:

• Trading
• Market understanding
• Risk management
• Business thinking
• Practical decision making

Reply *ADMISSION* for an enquiry.

Reply *MENU* for all programs.`
    );
  }

  if (
    text.includes("wellness") ||
    text.includes("counselling") ||
    text.includes("counseling") ||
    text.includes("hypnotherapy")
  ) {
    return sendWhatsAppText(
      from,
      `🧠 *Veezna Wellness*

Veezna Wellness provides professional support and learning around wellbeing.

For service-specific information, please tell us what you are looking for.

Reply *COUNSELLOR* to connect with our team.

Reply *MENU* for the main menu.`
    );
  }

  // ----------------------------------------------------------
  // URGENT REQUEST
  // ----------------------------------------------------------

  if (
    text.includes("urgent") ||
    text.includes("emergency")
  ) {
    return sendWhatsAppText(
      from,
      `⚠️ *Veezna Support*

Your message has been marked as *URGENT*.

Please send:

• Your name
• Your requirement
• Best time to contact you

Our team will review your request.

— Team Veezna`
    );
  }

  // ----------------------------------------------------------
  // FALLBACK
  // ----------------------------------------------------------

  return sendWhatsAppUnknown(from);
}

// ============================================================
// SEND ADMISSION CONFIRMATION
// ============================================================

export async function sendWhatsAppAdmissionConfirmation(
  to: string,
  studentName: string,
  program?: string
): Promise<WhatsAppSendTextResult> {
  const programText =
    program
      ? `\nProgram: ${program}`
      : "";

  return sendWhatsAppText(
    to,
    `✅ *Veezna Admission Enquiry Received*

Hello ${studentName},

Thank you for contacting Veezna.

We have received your admission enquiry.${programText}

Our team will review your details and contact you for the next step.

If you need anything else, reply:

*MENU*

— Team Veezna
Vision Turns Into Mission`
  );
}

// ============================================================
// SEND PAYMENT REMINDER
// ============================================================

export async function sendWhatsAppFeeReminder(
  to: string,
  studentName: string,
  amount?: number,
  dueDate?: string
): Promise<WhatsAppSendTextResult> {
  const amountText =
    typeof amount === "number"
      ? `\nPending Amount: ₹${amount.toLocaleString(
          "en-IN"
        )}`
      : "";

  const dueDateText =
    dueDate
      ? `\nDue Date: ${dueDate}`
      : "";

  return sendWhatsAppText(
    to,
    `🔔 *Veezna Fee Reminder*

Hello ${studentName},

This is a friendly reminder regarding your pending Veezna fee.

${amountText}${dueDateText}

If you have already completed the payment, please ignore this message.

For payment assistance, reply:

*COUNSELLOR*

— Team Veezna`
  );
}

// ============================================================
// SEND PAYMENT RECEIVED
// ============================================================

export async function sendWhatsAppPaymentConfirmation(
  to: string,
  studentName: string,
  amount: number,
  paymentId?: string
): Promise<WhatsAppSendTextResult> {
  const paymentText =
    paymentId
      ? `\nPayment ID: ${paymentId}`
      : "";

  return sendWhatsAppText(
    to,
    `✅ *Payment Received — Veezna*

Hello ${studentName},

Your payment of:

*₹${amount.toLocaleString(
      "en-IN"
    )}*

has been received successfully.${paymentText}

Thank you for choosing Veezna.

— Team Veezna
Vision Turns Into Mission`
  );
}

// ============================================================
// SEND WELCOME TO NEW STUDENT
// ============================================================

export async function sendWhatsAppStudentWelcome(
  to: string,
  studentName: string,
  studentId: string,
  program?: string
): Promise<WhatsAppSendTextResult> {
  const programText =
    program
      ? `\nProgram: ${program}`
      : "";

  return sendWhatsAppText(
    to,
    `🎉 *Welcome to Veezna, ${studentName}!*

Your student account has been created successfully.

🆔 Student ID:
*${studentId}*${programText}

Please keep your Student ID safe.

You can use it when contacting Veezna for student-related support.

We wish you a successful learning journey. 🚀

— Team Veezna
Vision Turns Into Mission`
  );
}