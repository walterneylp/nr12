
import type { Machine, ChecklistResponse, RiskEntry, ActionItem } from '../types';

/**
 * Gate A: Inventário
 * Validação: Pelo menos 1 máquina vinculada ao laudo
 */
export function validateGateA(machines: Machine[]): { ok: boolean; message?: string } {
    if (machines.length === 0) {
        return { ok: false, message: 'O laudo deve ter pelo menos uma máquina vinculada.' };
    }
    return { ok: true };
}

/**
 * Gate B: Checklist NR-12
 * Validação: Todos os itens obrigatórios respondidos
 */
export function validateGateB(responses: ChecklistResponse[], requiredCount: number): { ok: boolean; message?: string } {
    // Simplificação: Assume que requiredCount é o total de itens obrigatórios para as máquinas do laudo
    // Na prática, precisaria cruzar com checklist_requirements e machines
    if (responses.length < requiredCount) {
        return { ok: false, message: `Checklist incompleto. Respondidos: ${responses.length}/${requiredCount}` };
    }
    return { ok: true };
}

/**
 * Gate C: Apreciação de Risco
 * Validação: HRN calculado para todas as máquinas
 */
export function validateGateC(risks: RiskEntry[], machines: Machine[]): { ok: boolean; message?: string } {
    // Verifica se existe pelo menos uma analise de risco para cada máquina que exige (pode ser complexo)
    // Por enquanto, valida se há riscos cadastrados se houver máquinas
    if (machines.length > 0 && risks.length === 0) {
        // Nota: Nem toda máquina tem risco, mas geralmente NR-12 implica análise. 
        // Se for "Máquina Segura", talvez não tenha riscos a mitigar, mas a apreciação deve existir dizendo "Isento".
        // Assumindo que a lista de risks contém as entradas de risco identificadas.
        return { ok: false, message: 'Nenhuma apreciação de risco registrada.' };
    }

    const invalidHRN = risks.find(r => r.hrn_number === 0 || !r.hrn_number);
    if (invalidHRN) {
        return { ok: false, message: 'Existem riscos com cálculo HRN inválido ou pendente.' };
    }

    return { ok: true };
}

/**
 * Gate E: Plano de Ação
 * Validação: Ações criadas para não conformidades
 */
export function validateGateE(actions: ActionItem[], nonCompliantResponses: ChecklistResponse[]): { ok: boolean; message?: string } {
    // Idealmente, vincularia cada ação a uma não conformidade.
    // Simplificação: Se há não conformidades, deve haver pelo menos uma ação para cada (ou um plano geral).

    if (nonCompliantResponses.length > 0 && actions.length === 0) {
        return { ok: false, message: 'Existem não conformidades sem plano de ação correspondente.' };
    }

    return { ok: true };
}

export function checkAllGates(
    machines: Machine[],
    responses: ChecklistResponse[],
    risks: RiskEntry[],
    actions: ActionItem[],
    requiredChecklistCount: number
): { canSign: boolean; failedGates: string[] } {
    const failedGates: string[] = [];

    if (!validateGateA(machines).ok) failedGates.push('Gate A (Inventário)');
    if (!validateGateB(responses, requiredChecklistCount).ok) failedGates.push('Gate B (Checklist)');
    if (!validateGateC(risks, machines).ok) failedGates.push('Gate C (Riscos)');
    if (!validateGateE(actions, responses.filter(r => r.status === 'NONCOMPLIANT')).ok) failedGates.push('Gate E (Plano de Ação)');

    return {
        canSign: failedGates.length === 0,
        failedGates
    };
}
