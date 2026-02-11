
import { supabase } from '../supabase';
import type { ValidationRecord } from '../../domain/types';

export type TestType = 'EMERGENCY_STOP' | 'INTERLOCK' | 'LIGHT_CURTAIN' | 'BIMANUAL' | 'SCANNER' | 'OTHERS';

export interface ValidationTest {
    id: string;
    test_type: TestType;
    test_description: string;
    expected_result: string;
    actual_result?: string;
    passed: boolean;
    tested_by?: string;
    tested_at?: string;
    evidence_file_id?: string;
    notes?: string;
}

export const validationRepository = {
    async getByReportId(reportId: string) {
        console.log(`[ValidationRepository] Buscando validações do laudo ${reportId}...`);
        
        const { data, error } = await supabase
            .from('validation_records')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('[ValidationRepository] Erro ao buscar validações:', error);
            throw new Error(`Erro ao carregar validações: ${error.message}`);
        }

        console.log(`[ValidationRepository] ${data?.length || 0} validações encontradas`);
        return data as ValidationTest[];
    },

    async create(test: Omit<ValidationTest, 'id'>) {
        console.log('[ValidationRepository] Criando teste de validação:', test.test_type);
        
        const { data, error } = await supabase
            .from('validation_records')
            .insert(test)
            .select()
            .single();

        if (error) {
            console.error('[ValidationRepository] Erro ao criar validação:', error);
            throw new Error(`Erro ao criar teste: ${error.message}`);
        }

        console.log('[ValidationRepository] Teste criado:', data?.id);
        return data as ValidationTest;
    },

    async update(id: string, test: Partial<ValidationTest>) {
        console.log(`[ValidationRepository] Atualizando teste ${id}...`);
        
        const { data, error } = await supabase
            .from('validation_records')
            .update(test)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[ValidationRepository] Erro ao atualizar teste ${id}:`, error);
            throw new Error(`Erro ao atualizar teste: ${error.message}`);
        }

        console.log('[ValidationRepository] Teste atualizado:', data?.id);
        return data as ValidationTest;
    },

    async delete(id: string) {
        console.log(`[ValidationRepository] Deletando teste ${id}...`);
        
        const { error } = await supabase
            .from('validation_records')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[ValidationRepository] Erro ao deletar teste ${id}:`, error);
            throw new Error(`Erro ao deletar teste: ${error.message}`);
        }

        console.log('[ValidationRepository] Teste deletado');
    },

    async getStats(reportId: string) {
        const { data, error } = await supabase
            .from('validation_records')
            .select('passed')
            .eq('report_id', reportId);

        if (error) throw error;

        const total = data?.length || 0;
        const passed = data?.filter(t => t.passed).length || 0;
        const failed = total - passed;

        return { total, passed, failed };
    }
};
