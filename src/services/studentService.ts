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
  console.log('[studentService] fetchClassStudentsData', { classId, examinerId });

  // Parallel fetch: Class info, Students, Active Period, Exam Type (like Flutter: any, not filtered active)
  const [
    classRes,
    studentsRes,
    activePeriodRes,
    defaultExamTypeRes
  ] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase.from('students').select('*').eq('class_id', classId).eq('active', true).order('id', { ascending: true }),
    supabase.from('exam_periods').select('id').eq('active', true).maybeSingle(),
    // Match Flutter: ambil exam_type pertama saja, tidak wajib active=true
    supabase.from('exam_types').select('id').order('id', { ascending: true }).limit(1).maybeSingle()
  ]);

  const classInfo = classRes.data || null;
  const students = studentsRes.data || [];
  const activePeriodId = activePeriodRes.data?.id || null;
  const defaultExamTypeId = defaultExamTypeRes.data?.id || null;

  console.log('[studentService] Step 1:', {
    studentsInDb: students.length,
    activePeriodId,
    defaultExamTypeId,
    className: classInfo?.name,
    studentsError: studentsRes.error,
    periodError: activePeriodRes.error,
  });

  if (!activePeriodId) {
    console.warn('[studentService] BLOCKED: Tidak ada periode ujian aktif!');
    return { classInfo, students: [], activePeriodId, defaultExamTypeId, scoredStudentIds: new Set(), hasAssignment: false };
  }

  // Check assignment — limit(1) not maybeSingle() to handle multi-ranting
  const assignmentRes = await supabase
    .from('examiner_assignments')
    .select('id')
    .eq('examiner_id', examinerId)
    .eq('class_id', Number(classId))
    .eq('period_id', activePeriodId)
    .limit(1);

  console.log('[studentService] Assignment check:', {
    hasData: assignmentRes.data,
    error: assignmentRes.error,
    examinerId,
    classId: Number(classId),
    activePeriodId,
  });

  const hasAssignment = (assignmentRes.data?.length ?? 0) > 0;

  if (!hasAssignment) {
    console.warn('[studentService] BLOCKED: Tidak ada assignment untuk penguji ini!');
    return { classInfo, students: [], activePeriodId, defaultExamTypeId, scoredStudentIds: new Set(), hasAssignment: false };
  }

  // Fetch scores only if we have exam type
  let scoredStudentIds = new Set<number>();
  if (defaultExamTypeId) {
    const scoresRes = await supabase
      .from('scores')
      .select('student_id')
      .eq('period_id', activePeriodId)
      .eq('exam_type_id', defaultExamTypeId);
    scoredStudentIds = new Set(scoresRes.data?.map(s => s.student_id) || []);
  }

  console.log('[studentService] Final:', { studentsShown: students.length, scoredCount: scoredStudentIds.size });

  return {
    classInfo,
    students,
    activePeriodId,
    defaultExamTypeId,
    scoredStudentIds,
    hasAssignment
  };
};
