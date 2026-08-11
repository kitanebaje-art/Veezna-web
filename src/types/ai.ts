// src/types/ai.ts

export type AIMessageRole = 'user' | 'assistant' | 'system';

export interface AIMessage {
  id: string;
  role: AIMessageRole;
  content: string;
  timestamp: string;
}

export interface AIMentorContext {
  studentId: string;
  studentName: string;
  academicClass: string;
  courseId: string;
  currentLessonTitle?: string;
}