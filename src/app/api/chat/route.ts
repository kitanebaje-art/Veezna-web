// src/app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is missing in .env.local' },
        { status: 500 }
      );
    }

    const systemPrompt = `
You are the official Veezna Course Advisor & Admission Assistant for "VEEZNA" (veezna.com).
Your tone: Helpful, empathetic, encouraging, professional, and clear.

About Veezna Programs:
1. Academic Excellence: Classes 6–12 coaching, board preparation, personalized mentoring, small batches.
2. Veezna Vox: Spoken English, public speaking, interview training, confidence building, daily practice.
3. Full Stack Web Development: HTML, CSS, JavaScript, React, Next.js, full-stack projects, deployment.
4. Veezna Spark (Trading): Financial markets, risk management, chart analysis, trading psychology.
5. Veezna Wellness: Self-awareness, emotional balance, mindfulness, lifestyle counseling.
6. AI & Digital Skills: Prompt engineering, workflow automation, modern workplace AI tools.
7. Career Guidance: 1-on-1 mentorship, goal planning, roadmap for education and career.

Instructions:
- Keep responses concise (2 to 4 sentences).
- If a user is confused, ask about their current qualification/goal and suggest 1-2 most relevant Veezna programs.
- If the user is interested in enrolling or has detailed queries, encourage them to provide their Name and Phone number to book a "Free Counselling Call" with a Veezna Mentor.
`;

    // Free Groq Llama-3 API Endpoint (Super fast)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Namaste! Main aapko Veezna programs select karne me kaise help kar sakta hoon?";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}