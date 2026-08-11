// src/types/vls.ts

export type LessonType = 'video' | 'text' | 'interactive' | 'quiz';

export interface LessonDocument {
  lessonId: string;
  moduleId: string;
  courseId: string;
  title: string;
  durationMinutes: number;
  type: LessonType;
  contentUrl?: string; // Video URL or document link
  textContent?: string;
  order: number;
  isFreePreview: boolean;
  createdAt: string;
}

export interface ModuleDocument {
  moduleId: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessonsCount: number;
  createdAt: string;
}

export interface StudentProgressDocument {
  progressId: string; // `${studentId}_${courseId}`
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  lastAccessedLessonId?: string;
  completionPercentage: number;
  totalTimeSpentMinutes: number;
  updatedAt: string;
}