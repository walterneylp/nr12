import { describe, it, expect } from 'vitest';
import { calculateHRN, classifyRisk, getActionPriority } from './hrn';

describe('HRN Calculation', () => {
    it('should calculate HRN correctly for valid inputs', () => {
        // S=8, P=4, F=3 -> 8*4*3 = 96
        expect(calculateHRN(8, 4, 3)).toBe(96);

        // S=25, P=10, F=10 -> 2500
        expect(calculateHRN(25, 10, 10)).toBe(2500);

        // S=2, P=0.5, F=1 -> 1
        expect(calculateHRN(2, 0.5, 1)).toBe(1);
    });

    it('should throw error for invalid severity', () => {
        expect(() => calculateHRN(3 as any, 4, 3)).toThrow(/Invalid Severity/);
    });

    it('should throw error for invalid probability', () => {
        expect(() => calculateHRN(8, 3 as any, 3)).toThrow(/Invalid Probability/);
    });

    it('should throw error for invalid frequency', () => {
        expect(() => calculateHRN(8, 4, 4 as any)).toThrow(/Invalid Frequency/);
    });
});

describe('Risk Classification', () => {
    it('should classify < 50 as ACEITAVEL', () => {
        expect(classifyRisk(1)).toBe('ACEITAVEL');
        expect(classifyRisk(49.9)).toBe('ACEITAVEL');
    });

    it('should classify 50-199 as TOLERAVEL', () => {
        expect(classifyRisk(50)).toBe('TOLERAVEL');
        expect(classifyRisk(199)).toBe('TOLERAVEL');
    });

    it('should classify 200-399 as INACEITAVEL', () => {
        expect(classifyRisk(200)).toBe('INACEITAVEL');
        expect(classifyRisk(399)).toBe('INACEITAVEL');
    });

    it('should classify >= 400 as CRITICO', () => {
        expect(classifyRisk(400)).toBe('CRITICO');
        expect(classifyRisk(2500)).toBe('CRITICO');
    });
});

describe('Action Priority', () => {
    it('should return CRITICAL for HRN >= 400', () => {
        expect(getActionPriority(400)).toBe('CRITICAL');
    });

    it('should return LOW for HRN < 50', () => {
        expect(getActionPriority(10)).toBe('LOW');
    });
});
