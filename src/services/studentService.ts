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

export const fetchClassStudentsData = async (classId: string, examinerId: string, assignmentId?: number): Promise<ClassStudentsData> => {
  console.log('[studentService] fetchClassStudentsData', { classId, examinerId, assignmentId });

  // 1. Fetch active period & default exam type
  const [activePeriodRes, defaultExamTypeRes] = await Promise.all([
    supabase.from('exam_periods').select('id').eq('active', true).maybeSingle(),
    supabase.from('exam_types').select('id').order('id', { ascending: true }).limit(1).maybeSingle()
  ]);

  const activePeriodId = activePeriodRes.data?.id || null;
  const defaultExamTypeId = defaultExamTypeRes.data?.id || null;

  if (!activePeriodId) {
    console.warn('[studentService] BLOCKED: Tidak ada periode ujian aktif!');
    return { classInfo: null, students: [], activePeriodId, defaultExamTypeId, scoredStudentIds: new Set(), hasAssignment: false };
  }

  // 2. Fetch specific assignment
  let assignmentQuery = supabase
    .from('examiner_assignments')
    .select('id, room, ranting_id')
    .eq('examiner_id', examinerId)
    .eq('class_id', Number(classId))
    .eq('period_id', activePeriodId);
    
  if (assignmentId) {
    assignmentQuery = assignmentQuery.eq('id', assignmentId);
  }
  
  const { data: assignmentData } = await assignmentQuery.limit(1).maybeSingle();

  if (!assignmentData) {
    console.warn('[studentService] BLOCKED: Tidak ada assignment untuk penguji ini!');
    return { classInfo: null, students: [], activePeriodId, defaultExamTypeId, scoredStudentIds: new Set(), hasAssignment: false };
  }

  // 3. Fetch class info and students (filtered by assignment's room and ranting)
  const [classRes, studentsRes] = await Promise.all([
    supabase.from('classes').select('*').eq('id', classId).single(),
    supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .eq('active', true)
      .match(
        Object.assign(
          {}, 
          assignmentData.room ? { room: assignmentData.room } : {},
          assignmentData.ranting_id ? { ranting_id: assignmentData.ranting_id } : {}
        )
      )
      .order('id', { ascending: true })
  ]);

  const classInfo = classRes.data || null;
  const students = studentsRes.data || [];

  // 4. Fetch scores to calculate progress
  let scoredStudentIds = new Set<number>();
  if (defaultExamTypeId) {
    const scoresRes = await supabase
      .from('scores')
      .select('student_id')
      .eq('period_id', activePeriodId)
      .eq('exam_type_id', defaultExamTypeId)
      .in('student_id', students.map(s => s.id));
    scoredStudentIds = new Set(scoresRes.data?.map(s => s.student_id) || []);
  }

  console.log('[studentService] Final:', { studentsShown: students.length, scoredCount: scoredStudentIds.size });

  return {
    classInfo,
    students,
    activePeriodId,
    defaultExamTypeId,
    scoredStudentIds,
    hasAssignment: true
  };
};
