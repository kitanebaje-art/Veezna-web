// src/app/api/whatsapp/send/route.ts

import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  sendWhatsAppText,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    const {
      to,
      message,
    } = body;

    if (!to) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Recipient WhatsApp number is required.",
        },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Message is required.",
        },
        { status: 400 }
      );
    }

    const result =
      await sendWhatsAppText(
        String(to),
        String(message)
      );

    if (!result.success) {
      return NextResponse.json(
        result,
        { status: 502 }
      );
    }

    return NextResponse.json(
      result,
      { status: 200 }
    );
  } catch (error: any) {
    console.error(
      "[WhatsApp Send API] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Unable to send WhatsApp message.",
      },
      { status: 500 }
    );
  }
}