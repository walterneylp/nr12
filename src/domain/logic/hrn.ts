import type { RiskLevel } from '../types';

export const SEVERITY_VALUES = [0.1, 0.5, 1, 2, 4, 8, 15] as const;
export const PROBABILITY_VALUES = [0.033, 1, 1.5, 2.5, 4, 5, 8, 10, 15] as const;
export const FREQUENCY_VALUES = [0.1, 0.2, 1, 1.5, 2.5, 4, 5] as const;

export function calculateHRN(s: number, p: number, f: number): number {
    if (!SEVERITY_VALUES.includes(s as any)) {
        throw new Error(`Invalid Severity value: ${s}`);
    }
    if (!PROBABILITY_VALUES.includes(p as any)) {
        throw new Error(`Invalid Probability value: ${p}`);
    }
    if (!FREQUENCY_VALUES.includes(f as any)) {
        throw new Error(`Invalid Frequency value: ${f}`);
    }

    return s * p * f;
}

export function classifyRisk(hrn: number): RiskLevel {
    if (hrn >= 400) return 'CRITICO';
    if (hrn >= 200) return 'INACEITAVEL';
    if (hrn >= 50) return 'TOLERAVEL';
    return 'ACEITAVEL';
}

export function getActionPriority(hrn: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (hrn >= 400) return 'CRITICAL';
    if (hrn >= 200) return 'HIGH';
    if (hrn >= 50) return 'MEDIUM';
    return 'LOW';
}

export function getStandardDeadlineDays(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): number {
    switch (priority) {
        case 'CRITICAL': return 7;
        case 'HIGH': return 15;
        case 'MEDIUM': return 30;
        case 'LOW': return 60;
    }
}
