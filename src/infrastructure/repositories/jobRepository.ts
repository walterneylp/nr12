import { supabase } from '../supabase';
import type { UUID } from '../../domain/types';

export interface Job {
    id: UUID;
    tenant_id: UUID;
    client_id: UUID;
    code?: string;
    title: string;
    description?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    start_date?: string;
    end_date?: string;
    due_date?: string;
    assigned_to?: UUID;
    estimated_value?: number;
    created_at?: string;
    updated_at?: string;
    created_by?: UUID;
    // Joins
    client?: { id: UUID; name: string };
    assigned_user?: { id: UUID; name: string; email: string };
}

export interface JobStats {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    cancelled: number;
}

export const jobRepository = {
    async getAll(): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                client:client_id (id, name),
                assigned_user:assigned_to (id, name, email)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: UUID): Promise<Job | null> {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                client:client_id (id, name),
                assigned_user:assigned_to (id, name, email)
            `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    },

    async getByClientId(clientId: UUID): Promise<Job[]> {
        const { data, error } = await supabase
            .from('jobs')
            .select(`
                *,
                client:client_id (id, name),
                assigned_user:assigned_to (id, name, email)
            `)
            .eq('client_id', clientId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async create(job: Partial<Job>): Promise<Job> {
        const { data: userData } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('jobs')
            .insert({
                ...job,
                created_by: userData.user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: UUID, job: Partial<Job>): Promise<Job> {
        const { data, error } = await supabase
            .from('jobs')
            .update(job)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: UUID): Promise<void> {
        // Soft delete
        const { error } = await supabase
            .from('jobs')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async getStats(): Promise<JobStats> {
        const { data: allJobs, error } = await supabase
            .from('jobs')
            .select('status')
            .is('deleted_at', null);

        if (error) throw error;

        const jobs = allJobs || [];
        return {
            total: jobs.length,
            pending: jobs.filter((j: {status: string}) => j.status === 'PENDING').length,
            in_progress: jobs.filter((j: {status: string}) => j.status === 'IN_PROGRESS').length,
            completed: jobs.filter((j: {status: string}) => j.status === 'COMPLETED').length,
            cancelled: jobs.filter((j: {status: string}) => j.status === 'CANCELLED').length
        };
    },

    async generateCode(): Promise<string> {
        const year = new Date().getFullYear();
        
        // Buscar último código do ano
        const { data, error } = await supabase
            .from('jobs')
            .select('code')
            .like('code', `OS-${year}-%`)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;

        let sequence = 1;
        if (data && data.length > 0 && data[0].code) {
            const match = data[0].code.match(/-(\d+)$/);
            if (match) {
                sequence = parseInt(match[1]) + 1;
            }
        }

        return `OS-${year}-${sequence.toString().padStart(3, '0')}`;
    }
};
