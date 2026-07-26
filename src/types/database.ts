// Supabase Database Types based on PRD Fase 4

export interface ExamPeriod {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  active: boolean;
}

export interface ExamType {
  id: number;
  name: string;
}

export interface Level {
  id: number;
  name: string;
  prefix: string | null;
  sort_order: number;
  active: boolean;
}

export interface Class {
  id: number;
  level_id: number;
  name: string;
  active: boolean;
  
  // Relations
  level?: Level;
}

export interface Student {
  id: number;
  class_id: number;
  full_name: string;
  active: boolean;
  created_at: string;
  
  // Relations
  class?: Class;
}

export interface Criteria {
  id: number;
  category: string;
  name: string;
  default_score: number;
  deduction: number;
  sort_order: number;
  active: boolean;
}

export interface ScoreSession {
  id: number;
  examiner_id: string; // UUID from profiles
  class_id: number;
  period_id: number;
  exam_type_id: number;
  started_at: string;
  finished_at: string | null;
  
  // Relations
  class?: Class;
  period?: ExamPeriod;
  exam_type?: ExamType;
}

export interface Score {
  id: number;
  session_id: number;
  student_id: number;
  total_score: number;
  grade: string | null;
  notes: string | null;
  locked: boolean;
  created_at: string;
  
  // Relations
  student?: Student;
  session?: ScoreSession;
}

export interface ScoreDetail {
  id: number;
  score_id: number;
  criteria_id: number;
  mistakes: number;
  score: number;
  
  // Relations
  criteria?: Criteria;
}

export interface ExaminerAssignment {
  id: number;
  examiner_id: string; // UUID from profiles
  class_id: number;
  period_id: number;
  
  // Relations
  class?: Class;
  period?: ExamPeriod;
}
