import { supabase } from '../supabase';
import type { UUID } from '../../domain/types';

export interface Notification {
    id: UUID;
    tenant_id: UUID;
    user_id: UUID;
    type: 'REPORT_EXPIRING' | 'ACTION_DUE' | 'TRAINING_EXPIRING' | 'RISK_CRITICAL' | 'REPORT_SIGNED' | 'SYSTEM' | 'MENTION';
    title: string;
    message: string;
    entity_type?: string;
    entity_id?: UUID;
    entity_name?: string;
    link_url?: string;
    is_read: boolean;
    read_at?: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    expires_at?: string;
    created_at?: string;
    // View fields
    type_label?: string;
}

export interface NotificationStats {
    total: number;
    unread: number;
    byPriority: {
        urgent: number;
        high: number;
        normal: number;
        low: number;
    };
}

export const notificationRepository = {
    async getAll(limit: number = 50): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notification_summary')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    },

    async getUnread(): Promise<Notification[]> {
        const { data, error } = await supabase
            .from('notification_summary')
            .select('*')
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getUnreadCount(): Promise<number> {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    async markAsRead(id: UUID): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('id', id);

        if (error) throw error;
    },

    async markAllAsRead(): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .update({ 
                is_read: true, 
                read_at: new Date().toISOString() 
            })
            .eq('is_read', false);

        if (error) throw error;
    },

    async delete(id: UUID): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteAllRead(): Promise<void> {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('is_read', true);

        if (error) throw error;
    },

    async getStats(): Promise<NotificationStats> {
        const { data, error } = await supabase
            .from('notifications')
            .select('is_read, priority');

        if (error) throw error;

        const notifications = data || [];
        const unread = notifications.filter(n => !n.is_read);

        return {
            total: notifications.length,
            unread: unread.length,
            byPriority: {
                urgent: unread.filter(n => n.priority === 'URGENT').length,
                high: unread.filter(n => n.priority === 'HIGH').length,
                normal: unread.filter(n => n.priority === 'NORMAL').length,
                low: unread.filter(n => n.priority === 'LOW').length
            }
        };
    },

    // Criar notificação (usado internamente ou por funções do banco)
    async create(notification: Omit<Notification, 'id' | 'tenant_id' | 'created_at'>): Promise<Notification> {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
