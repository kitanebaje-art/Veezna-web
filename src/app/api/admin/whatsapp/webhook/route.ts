import { NextRequest, NextResponse } from "next/server";

import {
  generateWhatsAppAutoReply,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

// ============================================================
// WHATSAPP WEBHOOK CONFIG
// ============================================================

const VERIFY_TOKEN =
  process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

// ============================================================
// GET
// Meta uses this request to verify the webhook.
// ============================================================

export async function GET(
  req: NextRequest
) {
  try {
    const searchParams =
      req.nextUrl.searchParams;

    const mode =
      searchParams.get("hub.mode");

    const token =
      searchParams.get("hub.verify_token");

    const challenge =
      searchParams.get("hub.challenge");

    if (
      mode === "subscribe" &&
      token === VERIFY_TOKEN
    ) {
      console.log(
        "[WhatsApp Webhook] Verification successful."
      );

      return new NextResponse(
        challenge || "",
        {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        }
      );
    }

    console.warn(
      "[WhatsApp Webhook] Verification failed."
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Webhook verification failed.",
      },
      { status: 403 }
    );
  } catch (error: unknown) {
    console.error(
      "[WhatsApp Webhook GET] Error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Webhook verification error.",
      },
      { status: 500 }
    );
  }
}

// ============================================================
// POST
// Meta sends incoming WhatsApp messages here.
// ============================================================

export async function POST(
  req: NextRequest
) {
  try {
    const body =
      await req.json();

    console.log(
      "[WhatsApp Webhook] Incoming event:",
      JSON.stringify(body)
    );

    // ========================================================
    // BASIC META EVENT VALIDATION
    // ========================================================

    if (
      body?.object !==
      "whatsapp_business_account"
    ) {
      return NextResponse.json(
        {
          success: true,
          ignored: true,
        },
        { status: 200 }
      );
    }

    const entries =
      Array.isArray(body.entry)
        ? body.entry
        : [];

    // ========================================================
    // PROCESS WEBHOOK ENTRIES
    // ========================================================

    for (const entry of entries) {
      const changes =
        Array.isArray(entry?.changes)
          ? entry.changes
          : [];

      for (const change of changes) {
        if (
          change?.field !==
          "messages"
        ) {
          continue;
        }

        const value =
          change?.value;

        const messages =
          Array.isArray(value?.messages)
            ? value.messages
            : [];

        // ====================================================
        // PROCESS EACH INCOMING MESSAGE
        // ====================================================

        for (const message of messages) {
          const from =
            message?.from;

          const messageType =
            message?.type;

          // Currently process text messages only.
          if (
            !from ||
            messageType !== "text"
          ) {
            console.log(
              "[WhatsApp Webhook] Ignored message type:",
              messageType
            );

            continue;
          }

          const incomingText =
            message?.text?.body;

          if (
            typeof incomingText !== "string" ||
            !incomingText.trim()
          ) {
            continue;
          }

          console.log(
            `[WhatsApp Webhook] Message from ${from}: ${incomingText}`
          );

          // ==================================================
          // GENERATE AUTOMATIC REPLY
          // ==================================================

          const result =
            await generateWhatsAppAutoReply(
              from,
              incomingText
            );

          if (!result.success) {
            console.error(
              "[WhatsApp Webhook] Auto reply failed:",
              result.error
            );
          } else {
            console.log(
              `[WhatsApp Webhook] Reply sent to ${from}. Message ID: ${
                result.messageId || "N/A"
              }`
            );
          }
        }
      }
    }

    // ========================================================
    // ACKNOWLEDGE META
    // ========================================================

    return NextResponse.json(
      {
        success: true,
        received: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      "[WhatsApp Webhook POST] Error:",
      error
    );

    // Return 200 so Meta does not unnecessarily retry
    // malformed/non-critical webhook events.

    return NextResponse.json(
      {
        success: false,
        received: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to process WhatsApp webhook.",
      },
      { status: 200 }
    );
  }
}