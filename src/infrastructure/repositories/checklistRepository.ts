
import { supabase } from '../supabase';
import type { ChecklistResponse } from '../../domain/types';

export interface ChecklistEvidence {
    id: string;
    response_id: string;
    file_path: string;
    file_name?: string;
    description?: string;
    photo_type: 'CONTEXT' | 'DETAIL' | 'PLATE' | 'OTHER';
    created_at: string;
}

export const checklistRepository = {
    async getRequirements(checklistVersionId: string) {
        console.log(`[ChecklistRepository] Buscando requisitos da versão ${checklistVersionId}...`);
        
        const { data, error } = await supabase
            .from('checklist_requirements')
            .select('*')
            .eq('checklist_version_id', checklistVersionId)
            .order('sort_order', { ascending: true });

        if (error) {
            console.error('[ChecklistRepository] Erro ao buscar requisitos:', error);
            throw error;
        }
        
        console.log(`[ChecklistRepository] ${data?.length || 0} requisitos encontrados`);
        return data;
    },

    async getResponses(reportId: string, machineId: string) {
        console.log(`[ChecklistRepository] Buscando respostas: report=${reportId}, machine=${machineId}`);
        
        const { data, error } = await supabase
            .from('checklist_responses')
            .select(`
                *,
                evidence:checklist_evidence(*)
            `)
            .eq('report_id', reportId)
            .eq('machine_id', machineId);

        if (error) {
            console.error('[ChecklistRepository] Erro ao buscar respostas:', error);
            throw error;
        }
        
        console.log(`[ChecklistRepository] ${data?.length || 0} respostas encontradas`);
        return data as (ChecklistResponse & { evidence?: ChecklistEvidence[] })[];
    },

    async upsertResponse(response: Partial<ChecklistResponse>) {
        console.log('[ChecklistRepository] Salvando resposta:', response.requirement_id);
        
        const { data, error } = await supabase
            .from('checklist_responses')
            .upsert(response, { onConflict: 'report_id, machine_id, requirement_id' })
            .select()
            .single();

        if (error) {
            console.error('[ChecklistRepository] Erro ao salvar resposta:', error);
            throw error;
        }
        
        console.log('[ChecklistRepository] Resposta salva:', data?.id);
        return data as ChecklistResponse;
    },

    async uploadEvidence(responseId: string, file: File, photoType: string = 'CONTEXT', description?: string) {
        console.log(`[ChecklistRepository] Fazendo upload de evidência: ${file.name}`);
        
        // 1. Upload do arquivo
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `checklist_evidence/${responseId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, file);

        if (uploadError) {
            console.error('[ChecklistRepository] Erro no upload:', uploadError);
            throw new Error(`Erro no upload: ${uploadError.message}`);
        }

        // 2. Registrar no banco
        const { data, error } = await supabase
            .from('checklist_evidence')
            .insert({
                response_id: responseId,
                file_path: filePath,
                file_name: file.name,
                description: description,
                photo_type: photoType
            })
            .select()
            .single();

        if (error) {
            console.error('[ChecklistRepository] Erro ao registrar evidência:', error);
            throw new Error(`Erro ao registrar evidência: ${error.message}`);
        }

        console.log('[ChecklistRepository] Evidência registrada:', data?.id);
        return data as ChecklistEvidence;
    },

    async deleteEvidence(evidenceId: string) {
        console.log(`[ChecklistRepository] Deletando evidência: ${evidenceId}`);
        
        // Buscar o file_path antes de deletar
        const { data: evidence } = await supabase
            .from('checklist_evidence')
            .select('file_path')
            .eq('id', evidenceId)
            .single();

        if (evidence?.file_path) {
            // Deletar do storage
            await supabase.storage
                .from('photos')
                .remove([evidence.file_path]);
        }

        // Deletar do banco
        const { error } = await supabase
            .from('checklist_evidence')
            .delete()
            .eq('id', evidenceId);

        if (error) {
            console.error('[ChecklistRepository] Erro ao deletar evidência:', error);
            throw error;
        }

        console.log('[ChecklistRepository] Evidência deletada');
    },

    async getEvidenceByResponse(responseId: string) {
        const { data, error } = await supabase
            .from('checklist_evidence')
            .select('*')
            .eq('response_id', responseId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as ChecklistEvidence[];
    },

    async createCustomRequirement(payload: {
        checklist_version_id: string;
        report_id: string;
        machine_id: string;
        item: string;
        description: string;
        group_name: string;
        tenant_id: string;
    }) {
        console.log('[ChecklistRepository] Criando requisito customizado:', payload.item);
        
        const { data, error } = await supabase
            .from('checklist_requirements')
            .insert({
                ...payload,
                standard_reference: 'Custom',
                sort_order: 999
            })
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
};
