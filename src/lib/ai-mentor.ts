// src/lib/ai-mentor.ts
import { AIMessage, AIMentorContext } from '@/types/ai';

export function buildSystemPrompt(context: AIMentorContext): string {
  return `You are Veezna AI Mentor, a dedicated, encouraging, and highly knowledgeable pedagogical assistant for VEEZNA Education.

STUDENT CONTEXT:
- Name: ${context.studentName}
- Class Level: ${context.academicClass}
- Enrolled Course: ${context.courseId}
${context.currentLessonTitle ? `- Active Lesson: ${context.currentLessonTitle}` : ''}

INSTRUCTIONS:
1. Teach and explain concepts step-by-step matching the student's class level (${context.academicClass}).
2. Do NOT simply give final answers for homework questions. Explain the underlying principle first, provide a guided example, and ask the student a follow-up question to test their understanding.
3. Keep responses clear, well-structured, and formatted in clean Markdown.
4. Encourage active practice and offer short practice questions when requested.`;
}

export async function sendMentorQuery(
  messages: AIMessage[],
  context: AIMentorContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);

  const apiPayload = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch('/api/ai/mentor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: apiPayload }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to get response from Veezna AI Mentor.');
  }

  const data = await res.json();
  return data.reply;
}