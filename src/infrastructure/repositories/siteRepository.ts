import { supabase } from '../supabase';
import type { UUID } from '../../domain/types';

export interface Site {
    id: UUID;
    tenant_id: UUID;
    client_id: UUID;
    name: string;
    code?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
    city: string;
    state: string;
    zip_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    contact_name?: string;
    notes?: string;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    created_by?: UUID;
    // Joins
    client?: { id: UUID; name: string };
    machines_count?: number;
}

export interface SiteStats {
    total: number;
    active: number;
    inactive: number;
}

export const siteRepository = {
    async getAll(): Promise<Site[]> {
        const { data, error } = await supabase
            .from('sites')
            .select(`
                *,
                client:client_id (id, name)
            `)
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getById(id: UUID): Promise<Site | null> {
        const { data, error } = await supabase
            .from('sites')
            .select(`
                *,
                client:client_id (id, name)
            `)
            .eq('id', id)
            .is('deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    },

    async getByClientId(clientId: UUID): Promise<Site[]> {
        const { data, error } = await supabase
            .from('sites')
            .select(`
                *,
                client:client_id (id, name)
            `)
            .eq('client_id', clientId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');

        if (error) throw error;
        return data || [];
    },

    async create(site: Partial<Site>): Promise<Site> {
        const { data: userData } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('sites')
            .insert({
                ...site,
                created_by: userData.user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: UUID, site: Partial<Site>): Promise<Site> {
        const { data, error } = await supabase
            .from('sites')
            .update(site)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: UUID): Promise<void> {
        // Soft delete
        const { error } = await supabase
            .from('sites')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
    },

    async toggleActive(id: UUID, isActive: boolean): Promise<Site> {
        const { data, error } = await supabase
            .from('sites')
            .update({ is_active: isActive })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getStats(): Promise<SiteStats> {
        const { data: allSites, error } = await supabase
            .from('sites')
            .select('is_active')
            .is('deleted_at', null);

        if (error) throw error;

        const sites = allSites || [];
        return {
            total: sites.length,
            active: sites.filter((s: {is_active: boolean}) => s.is_active).length,
            inactive: sites.filter((s: {is_active: boolean}) => !s.is_active).length
        };
    },

    async getMachinesCount(siteId: UUID): Promise<number> {
        const { count, error } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true })
            .eq('site_id', siteId);

        if (error) throw error;
        return count || 0;
    }
};
