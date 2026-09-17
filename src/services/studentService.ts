import { supabase } from '../lib/supabase';
import type { Student, Class } from '../types';

export interface ClassStudentsData {
  classInfo: Class | null;
  students: Student[];
  activePeriodId: number | null;
  defaultExamTypeId: number | null;
  scoredStudentIds: Set<number>;
  hasAssignment: boolean;
}

export const fetchClassStudentsData = async (classId: string, examinerId: string): Promise<ClassStudentsData> => {
  // Parallel fetch: Class info, Students, Active Period, Active Exam Type
  const [
    classRes,
    studentsRes,
    activePeriodRes,
    defaultExamTypeRes
  ] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('students').select('*').eq('class_id', classId).eq('active', true).order('id', { ascending: true }),
    supabase.from('exam_periods').select('id').eq('active', true).maybeSingle(),
    supabase.from('exam_types').select('id').eq('active', true).maybeSingle()
  ]);

  const classInfo = classRes.data || null;
  const students = studentsRes.data || [];
  const activePeriodId = activePeriodRes.data?.id || null;
  const defaultExamTypeId = defaultExamTypeRes.data?.id || null;

  if (!activePeriodId || !defaultExamTypeId) {
    return { classInfo, students: [], activePeriodId, defaultExamTypeId, scoredStudentIds: new Set(), hasAssignment: false };
  }

  // Parallel fetch: Assignment check and Scores (if assigned)
  const [assignmentRes, scoresRes] = await Promise.all([
    supabase.from('examiner_assignments')
      .select('id')
      .eq('examiner_id', examinerId)
      .eq('class_id', Number(classId))
      .eq('period_id', activePeriodId)
      .maybeSingle(),
    supabase.from('scores')
      .select('student_id')
      .eq('period_id', activePeriodId)
      .eq('exam_type_id', defaultExamTypeId)
  ]);

  const hasAssignment = !!assignmentRes.data;
  const scoredStudentIds = new Set(scoresRes.data?.map(s => s.student_id) || []);

  return {
    classInfo,
    students: hasAssignment ? students : [],
    activePeriodId,
    defaultExamTypeId,
    scoredStudentIds,
    hasAssignment
  };
};
