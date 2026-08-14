import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Common status values supported throughout VLS models.
 */
export type VLSStatus = 'published' | 'active' | 'inactive' | 'draft';

/**
 * Flexibly supports client-side strings, Firestore Timestamps, or FieldValues (e.g. serverTimestamp()).
 */
export type VLSTimestamp = Timestamp | FieldValue | string | Date;

/**
 * Interface representing a VLS Course Module.
 */
export interface VLSModule {
  /** Firestore Document ID */
  id?: string;
  
  /** Unique domain-level module identifier (e.g., MOD-101) */
  moduleId: string;
  
  /** Associated course identifier */
  courseId: string;
  
  /** Module title */
  title: string;
  
  /** Detailed description or summary of the module */
  description?: string;
  
  /** Display sequence / sorting order */
  order: number;
  
  /** Publication or lifecycle status */
  status: VLSStatus;
  
  /** Creation timestamp */
  createdAt?: VLSTimestamp;
  
  /** Last updated timestamp */
  updatedAt?: VLSTimestamp;
}

/**
 * Interface representing an individual VLS Lesson within a Module.
 */
export interface VLSLesson {
  /** Firestore Document ID */
  id?: string;
  
  /** Unique domain-level lesson identifier (e.g., LESSON-101) */
  lessonId: string;
  
  /** Associated module identifier */
  moduleId: string;
  
  /** Associated course identifier */
  courseId: string;
  
  /** Lesson title */
  title: string;
  
  /** Brief description or objective of the lesson */
  description?: string;
  
  /** Lesson content type */
  type:
    | 'video'
    | 'reading'
    | 'assignment'
    | 'quiz'
    | 'practice'
    | 'lesson';
  
  /** Rich text / Markdown text content for reading or notes */
  textContent?: string;
  
  /** Embeddable video URL (e.g., YouTube embed URL) */
  videoUrl?: string;
  
  /** External resource or downloadable link URL */
  resourceUrl?: string;
  
  /** Estimated duration string (e.g., "15 mins") */
  duration?: string;
  
  /** Display sequence / sorting order inside the module */
  order: number;
  
  /** Publication or lifecycle status */
  status: VLSStatus;
  
  /** Creation timestamp */
  createdAt?: VLSTimestamp;
  
  /** Last updated timestamp */
  updatedAt?: VLSTimestamp;
}

/**
 * Interface representing a student's course progress tracking record.
 */
export interface StudentProgress {
  /** Firestore Document ID */
  id?: string;

  /**
   * Unique identifier for the student's VLS progress record.
   * Kept separate from the Firestore document ID (`id`)
   * for compatibility with the existing VLS implementation.
   * Format usually follows: `${studentId}_${courseId}`
   */
  progressId?: string;

  /** Unique student identifier */
  studentId: string;

  /** Associated course identifier */
  courseId: string;

  /** List of completed lesson IDs */
  completedLessonIds: string[];

  /** Computed completion percentage (0 to 100) */
  completionPercentage: number;

  /** ID of the lesson last accessed by the student */
  lastAccessedLessonId?: string;

  /** Total cumulative learning time spent in minutes */
  totalTimeSpentMinutes?: number;

  /** Last updated timestamp */
  updatedAt: VLSTimestamp;
}

/**
 * Helper payload interface for updating progress records safely.
 */
export interface UpdateProgressPayload {
  progressId: string;
  studentId: string;
  courseId: string;
  completedLessonIds: string[];
  completionPercentage: number;
  lastAccessedLessonId?: string;
  totalTimeSpentMinutes?: number;
  updatedAt: VLSTimestamp;
}

/*
 * Backward-compatible aliases
 *
 * Existing VLS pages and components use these names.
 * Keeping these aliases ensures zero breaking changes across your codebase.
 */
export type ModuleDocument = VLSModule;
export type LessonDocument = VLSLesson;
export type StudentProgressDocument = StudentProgress;