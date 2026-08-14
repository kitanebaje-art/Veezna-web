import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // =========================================================
    // 1. GEMINI API KEY
    // =========================================================

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      console.error("❌ GEMINI_API_KEY is missing.");

      return NextResponse.json(
        {
          error: "AI service is not configured.",
        },
        { status: 500 }
      );
    }

    // =========================================================
    // 2. READ REQUEST
    // =========================================================

    let body: {
      prompt?: unknown;
      studentClass?: unknown;
      currentProgram?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 3. VALIDATE DATA
    // =========================================================

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    const studentClass =
      typeof body.studentClass === "string"
        ? body.studentClass.trim()
        : "Class 6-12";

    const currentProgram =
      typeof body.currentProgram === "string"
        ? body.currentProgram.trim()
        : "General Academic";

    if (!prompt) {
      return NextResponse.json(
        {
          error: "Prompt field is required.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // 4. VEEZNA AI SYSTEM PROMPT
    // =========================================================

    const systemPrompt = `
You are VEEZNA AI Copilot.

You are an expert, encouraging and accurate academic tutor
for students enrolled in the VEEZNA Educational Ecosystem.

Student Information:
- Class: ${studentClass}
- Program: ${currentProgram}

Your responsibilities:

1. Explain concepts clearly and accurately.
2. Use language appropriate for the student's class level.
3. Give step-by-step explanations for difficult questions.
4. For mathematics, show complete working.
5. For science, explain concepts with simple examples.
6. For theoretical subjects, organize answers logically.
7. Use bullet points and numbered steps when useful.
8. Encourage understanding instead of only giving answers.
9. If the question is unclear, ask for clarification.
10. Never intentionally invent facts.
11. Keep answers focused and useful.
12. Be friendly, patient and motivating.

The student is asking:

${prompt}
`;

    // =========================================================
    // 5. GEMINI REST API
    // =========================================================

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/" +
      "models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(geminiUrl, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: systemPrompt,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      }),
    });

    // =========================================================
    // 6. READ GEMINI RESPONSE
    // =========================================================

    let data: any;

    try {
      data = await response.json();
    } catch {
      console.error("❌ Gemini returned invalid JSON.");

      return NextResponse.json(
        {
          error: "AI service returned an invalid response.",
        },
        { status: 502 }
      );
    }

    // =========================================================
    // 7. HANDLE GEMINI ERRORS
    // =========================================================

    if (!response.ok) {
      console.error("❌ Gemini API Error:", {
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Google AI service returned an error.",
        },
        {
          status: response.status >= 400
            ? response.status
            : 502,
        }
      );
    }

    // =========================================================
    // 8. EXTRACT ANSWER
    // =========================================================

    const aiAnswer =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || "")
        .join("")
        .trim() || "";

    if (!aiAnswer) {
      console.error(
        "❌ Gemini returned no usable answer:",
        data
      );

      return NextResponse.json(
        {
          error: "AI generated an empty response.",
        },
        { status: 502 }
      );
    }

    // =========================================================
    // 9. SUCCESS
    // =========================================================

    return NextResponse.json(
      {
        answer: aiAnswer,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error(
      "❌ AI Route Execution Exception:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal Server Failure",
      },
      { status: 500 }
    );
  }
}