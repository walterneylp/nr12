
import { supabase } from '../supabase';

export interface TrainingRecord {
    id: string;
    tenant_id: string;
    client_id?: string;
    machine_id?: string;
    report_id?: string;
    trainee_name: string;
    trainee_role?: string;
    training_type: 'INITIAL' | 'RECYCLING';
    content_summary?: string;
    duration_hours?: number;
    instructor_name?: string;
    certificate_number?: string;
    valid_until?: string;
    created_at?: string;
}

export const trainingRepository = {
    async getByMachineId(machineId: string) {
        console.log(`[TrainingRepository] Buscando treinamentos da máquina ${machineId}...`);
        
        const { data, error } = await supabase
            .from('training_records')
            .select('*')
            .eq('machine_id', machineId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TrainingRepository] Erro ao buscar treinamentos:', error);
            throw new Error(`Erro ao carregar treinamentos: ${error.message}`);
        }

        console.log(`[TrainingRepository] ${data?.length || 0} treinamentos encontrados`);
        return data as TrainingRecord[];
    },

    async getByReportId(reportId: string) {
        console.log(`[TrainingRepository] Buscando treinamentos do laudo ${reportId}...`);
        
        const { data, error } = await supabase
            .from('training_records')
            .select('*')
            .eq('report_id', reportId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TrainingRepository] Erro ao buscar treinamentos:', error);
            throw new Error(`Erro ao carregar treinamentos: ${error.message}`);
        }

        return data as TrainingRecord[];
    },

    async getAll() {
        console.log('[TrainingRepository] Buscando todos os treinamentos...');
        
        const { data, error } = await supabase
            .from('training_records')
            .select(`
                *,
                machine:machines(name, tag),
                client:clients(name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TrainingRepository] Erro ao buscar treinamentos:', error);
            throw new Error(`Erro ao carregar treinamentos: ${error.message}`);
        }

        return data as (TrainingRecord & { machine?: { name: string; tag: string }; client?: { name: string } })[];
    },

    async getByClientId(clientId: string) {
        console.log(`[TrainingRepository] Buscando treinamentos do cliente ${clientId}...`);
        
        const { data, error } = await supabase
            .from('training_records')
            .select(`
                *,
                machine:machines(name, tag),
                client:clients(name)
            `)
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[TrainingRepository] Erro ao buscar treinamentos:', error);
            throw new Error(`Erro ao carregar treinamentos: ${error.message}`);
        }

        return data as (TrainingRecord & { machine?: { name: string; tag: string }; client?: { name: string } })[];
    },

    async getExpiring(days: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);
        
        const { data, error } = await supabase
            .from('training_records')
            .select(`
                *,
                machine:machines(name, tag),
                client:clients(name)
            `)
            .lte('valid_until', futureDate.toISOString())
            .order('valid_until', { ascending: true });

        if (error) throw error;
        return data as (TrainingRecord & { machine?: { name: string; tag: string }; client?: { name: string } })[];
    },

    async create(record: Omit<TrainingRecord, 'id' | 'created_at'>) {
        console.log('[TrainingRepository] Criando treinamento:', record.trainee_name);
        
        // Limpar campos undefined para null (evita erro de UUID)
        const cleanedRecord: any = { ...record };
        Object.keys(cleanedRecord).forEach(key => {
            if (cleanedRecord[key] === undefined) {
                cleanedRecord[key] = null;
            }
        });
        
        const { data, error } = await supabase
            .from('training_records')
            .insert(cleanedRecord)
            .select()
            .single();

        if (error) {
            console.error('[TrainingRepository] Erro ao criar treinamento:', error);
            throw new Error(`Erro ao criar treinamento: ${error.message}`);
        }

        console.log('[TrainingRepository] Treinamento criado:', data?.id);
        return data as TrainingRecord;
    },

    async update(id: string, record: Partial<TrainingRecord>) {
        console.log(`[TrainingRepository] Atualizando treinamento ${id}...`);
        
        // Limpar campos undefined para null
        const cleanedRecord: any = { ...record };
        Object.keys(cleanedRecord).forEach(key => {
            if (cleanedRecord[key] === undefined) {
                cleanedRecord[key] = null;
            }
        });
        
        const { data, error } = await supabase
            .from('training_records')
            .update(cleanedRecord)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`[TrainingRepository] Erro ao atualizar treinamento ${id}:`, error);
            throw new Error(`Erro ao atualizar treinamento: ${error.message}`);
        }

        return data as TrainingRecord;
    },

    async delete(id: string) {
        console.log(`[TrainingRepository] Deletando treinamento ${id}...`);
        
        const { error } = await supabase
            .from('training_records')
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`[TrainingRepository] Erro ao deletar treinamento ${id}:`, error);
            throw new Error(`Erro ao deletar treinamento: ${error.message}`);
        }
    },

    async getStats() {
        const { data: total, error: totalError } = await supabase
            .from('training_records')
            .select('id', { count: 'exact', head: true });

        const { data: initial, error: initialError } = await supabase
            .from('training_records')
            .select('id', { count: 'exact', head: true })
            .eq('training_type', 'INITIAL');

        const { data: recycling, error: recyclingError } = await supabase
            .from('training_records')
            .select('id', { count: 'exact', head: true })
            .eq('training_type', 'RECYCLING');

        const now = new Date().toISOString();
        const { data: valid, error: validError } = await supabase
            .from('training_records')
            .select('id', { count: 'exact', head: true })
            .gt('valid_until', now);

        return {
            total: total?.length || 0,
            initial: initial?.length || 0,
            recycling: recycling?.length || 0,
            valid: valid?.length || 0
        };
    }
};
