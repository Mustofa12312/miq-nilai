import { describe, it, expect } from 'vitest';
import { formatStudentName, calculateProgressPercentage } from './formatters';

describe('formatters', () => {
  describe('formatStudentName', () => {
    it('should format all lowercase names to title case', () => {
      expect(formatStudentName('ahmad ridwan')).toBe('Ahmad Ridwan');
    });

    it('should handle extra spaces correctly', () => {
      expect(formatStudentName('  budi   santoso  ')).toBe('Budi Santoso');
    });

    it('should handle ALL CAPS names', () => {
      expect(formatStudentName('SITI AMINAH')).toBe('Siti Aminah');
    });

    it('should return empty string if input is empty', () => {
      expect(formatStudentName('')).toBe('');
    });
  });

  describe('calculateProgressPercentage', () => {
    it('should calculate correct percentage', () => {
      expect(calculateProgressPercentage(5, 10)).toBe(50);
      expect(calculateProgressPercentage(3, 10)).toBe(30);
    });

    it('should round correctly', () => {
      expect(calculateProgressPercentage(1, 3)).toBe(33); // 33.333...
      expect(calculateProgressPercentage(2, 3)).toBe(67); // 66.666...
    });

    it('should return 0 when total is 0', () => {
      expect(calculateProgressPercentage(5, 0)).toBe(0);
    });

    it('should cap at 100% if scored > total', () => {
      expect(calculateProgressPercentage(11, 10)).toBe(100);
    });
    
    it('should handle negative numbers gracefully', () => {
      expect(calculateProgressPercentage(-1, 10)).toBe(0);
    });
  });
});
