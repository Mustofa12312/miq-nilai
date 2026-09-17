export const formatStudentName = (name: string): string => {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const calculateProgressPercentage = (scored: number, total: number): number => {
  if (total === 0) return 0;
  if (scored < 0 || total < 0) return 0;
  if (scored > total) return 100;
  return Math.round((scored / total) * 100);
};
