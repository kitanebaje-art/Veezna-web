import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeadPayload = {
  name?: unknown;
  phone?: unknown;
  program?: unknown;
  qualification?: unknown;
  goal?: unknown;
  preferredTime?: unknown;
  source?: unknown;
};

function clean(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  // 10 digit Indian number
  if (/^[6-9]\d{9}$/.test(digits)) {
    return digits;
  }

  // +91XXXXXXXXXX / 91XXXXXXXXXX
  if (
    digits.length === 12 &&
    digits.startsWith("91") &&
    /^[6-9]\d{9}$/.test(digits.slice(2))
  ) {
    return digits.slice(2);
  }

  // 0XXXXXXXXXX
  if (
    digits.length === 11 &&
    digits.startsWith("0") &&
    /^[6-9]\d{9}$/.test(digits.slice(1))
  ) {
    return digits.slice(1);
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const webhookUrl = process.env.VEEZNA_LEADS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error(
        "VEEZNA LEADS: VEEZNA_LEADS_WEBHOOK_URL is missing."
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Lead storage is not configured. Please check VEEZNA_LEADS_WEBHOOK_URL.",
          code: "MISSING_LEAD_WEBHOOK",
        },
        { status: 500 }
      );
    }

    let body: LeadPayload;

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body.",
          code: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    const name = clean(body?.name, 100);
    const rawPhone = clean(body?.phone, 30);
    const phone = normalizePhone(rawPhone);

    const program = clean(body?.program, 150);
    const qualification = clean(body?.qualification, 150);
    const goal = clean(body?.goal, 300);
    const preferredTime = clean(body?.preferredTime, 100);

    const source =
      clean(body?.source, 100) || "Veezna AI Advisor";

    /*
     * A lead must have these three core fields.
     */
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required.",
          code: "MISSING_NAME",
        },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid 10-digit Indian mobile number is required.",
          code: "INVALID_PHONE",
        },
        { status: 400 }
      );
    }

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: "Program information is required.",
          code: "MISSING_PROGRAM",
        },
        { status: 400 }
      );
    }

    /*
     * Send only required lead information
     * to Google Apps Script.
     */
    const payload = {
      name,
      phone,
      program,
      qualification,
      goal,
      preferredTime,
      source,
    };

    console.log("VEEZNA LEADS: Sending lead to Google Sheets:", {
      name,
      phone: `${phone.slice(0, 2)}******${phone.slice(-2)}`,
      program,
    });

    const googleResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const rawResponse = await googleResponse.text();

    let googleData: any = null;

    try {
      googleData = rawResponse
        ? JSON.parse(rawResponse)
        : null;
    } catch {
      console.error(
        "VEEZNA LEADS: Google Apps Script returned non-JSON:",
        rawResponse
      );
    }

    if (!googleResponse.ok) {
      console.error("VEEZNA LEADS GOOGLE ERROR:", {
        status: googleResponse.status,
        response: rawResponse,
      });

      return NextResponse.json(
        {
          success: false,
          error:
            googleData?.message ||
            `Google Sheets webhook failed with status ${googleResponse.status}.`,
          code: "GOOGLE_SHEETS_ERROR",
        },
        { status: 502 }
      );
    }

    /*
     * Google Apps Script may return:
     *
     * {
     *   success: true,
     *   duplicate: false,
     *   message: "Veezna lead saved successfully."
     * }
     */

    if (!googleData?.success) {
      console.error(
        "VEEZNA LEADS: Google webhook rejected lead:",
        googleData
      );

      return NextResponse.json(
        {
          success: false,
          error:
            googleData?.message ||
            "Google Sheets did not confirm the lead.",
          code: "LEAD_NOT_CONFIRMED",
        },
        { status: 502 }
      );
    }

    console.log("VEEZNA LEADS: Lead successfully processed.", {
      duplicate: googleData?.duplicate === true,
    });

    return NextResponse.json(
      {
        success: true,
        duplicate: googleData?.duplicate === true,
        saved: googleData?.duplicate !== true,
        message:
          googleData?.message ||
          "Veezna lead saved successfully.",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("VEEZNA LEADS SERVER ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to save Veezna lead.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}