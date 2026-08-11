// src/app/api/ai/mentor/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { payload } = body;

    if (!payload || !Array.isArray(payload)) {
      return NextResponse.json({ error: 'Invalid payload structure.' }, { status: 400 });
    }

    // Extract latest user message
    const userMessages = payload.filter((m: any) => m.role === 'user');
    const latestUserMessage = userMessages[userMessages.length - 1]?.content || '';

    // Mock response for development fallback
    const simulatedReply = `Hello! As your **Veezna AI Mentor**, I am here to help you master your current lesson. 

Regarding your question about: *"${latestUserMessage.slice(0, 50)}..."*

Here is how we break it down:
1. **Key Concept:** Understand the core rule for your class level.
2. **Step-by-Step Approach:** Identify what information you have, then solve logically.
3. **Practice Challenge:** Would you like to try a short example problem together now?`;

    return NextResponse.json({ reply: simulatedReply });
  } catch (error: any) {
    console.error('AI Mentor Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI Server Error' },
      { status: 500 }
    );
  }
}