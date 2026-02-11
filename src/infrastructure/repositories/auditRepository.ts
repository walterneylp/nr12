import { supabase } from '../supabase';
import type { UUID } from '../../domain/types';

export interface AuditEvent {
    id: UUID;
    tenant_id: UUID;
    actor_user_id?: UUID;
    actor_email?: string;
    actor_name?: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'EXPORT' | 'SIGN' | 'LOGIN' | 'LOGOUT' | 'VIEW' | 'DOWNLOAD' | 'UPLOAD';
    entity_type: string;
    entity_id?: UUID;
    entity_name?: string;
    before_json?: Record<string, any>;
    after_json?: Record<string, any>;
    changes_summary?: string;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
    // View fields
    action_label?: string;
    entity_type_label?: string;
}

export interface AuditFilters {
    entityType?: string;
    action?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
    searchTerm?: string;
}

export const auditRepository = {
    async log(event: Omit<AuditEvent, 'id' | 'tenant_id' | 'created_at'>): Promise<void> {
        const { error } = await supabase
            .from('audit_events')
            .insert({
                ...event,
                tenant_id: (await supabase.auth.getUser()).data.user?.id // Será sobrescrito pelo trigger/RLS
            });

        if (error) {
            console.error('Erro ao registrar auditoria:', error);
            // Não lança erro para não quebrar a operação principal
        }
    },

    async getAll(filters?: AuditFilters, limit: number = 100, offset: number = 0): Promise<AuditEvent[]> {
        let query = supabase
            .from('audit_summary')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (filters?.entityType) {
            query = query.eq('entity_type', filters.entityType);
        }

        if (filters?.action) {
            query = query.eq('action', filters.action);
        }

        if (filters?.userId) {
            query = query.eq('actor_user_id', filters.userId);
        }

        if (filters?.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters?.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        if (filters?.searchTerm) {
            query = query.or(`entity_name.ilike.%${filters.searchTerm}%,actor_email.ilike.%${filters.searchTerm}%,changes_summary.ilike.%${filters.searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data || [];
    },

    async getByEntity(entityType: string, entityId: UUID): Promise<AuditEvent[]> {
        const { data, error } = await supabase
            .from('audit_summary')
            .select('*')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getByUser(userId: UUID, limit: number = 50): Promise<AuditEvent[]> {
        const { data, error } = await supabase
            .from('audit_summary')
            .select('*')
            .eq('actor_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async getStats(): Promise<{
        totalToday: number;
        totalWeek: number;
        totalMonth: number;
        byAction: Record<string, number>;
        byEntityType: Record<string, number>;
    }> {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        const { data, error } = await supabase
            .from('audit_events')
            .select('action, entity_type, created_at');

        if (error) throw error;

        const events = data || [];

        const totalToday = events.filter(e => new Date(e.created_at) >= today).length;
        const totalWeek = events.filter(e => new Date(e.created_at) >= weekAgo).length;
        const totalMonth = events.filter(e => new Date(e.created_at) >= monthAgo).length;

        const byAction: Record<string, number> = {};
        const byEntityType: Record<string, number> = {};

        events.forEach(e => {
            byAction[e.action] = (byAction[e.action] || 0) + 1;
            byEntityType[e.entity_type] = (byEntityType[e.entity_type] || 0) + 1;
        });

        return {
            totalToday,
            totalWeek,
            totalMonth,
            byAction,
            byEntityType
        };
    }
};

// Helper para criar logs de forma simplificada
export async function logAudit(
    action: AuditEvent['action'],
    entityType: string,
    entityId?: UUID,
    entityName?: string,
    before?: Record<string, any>,
    after?: Record<string, any>,
    summary?: string
): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    
    await auditRepository.log({
        action,
        entity_type: entityType,
        entity_id: entityId,
        entity_name: entityName,
        actor_user_id: userData.user?.id,
        actor_email: userData.user?.email,
        before_json: before,
        after_json: after,
        changes_summary: summary
    });
}
