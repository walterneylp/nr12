
import { supabase } from '../supabase';
import type { ActionItem } from '../../domain/types';

export const actionPlanRepository = {
    async getByReportId(reportId: string) {
        // First try to get the existing plan
        const { data, error } = await supabase
            .from('action_plans')
            .select(`
                *,
                items:action_items(*)
            `)
            .eq('report_id', reportId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

        return data; // returns Plan + Items or null
    },

    async createPlan(reportId: string, machineId: string) {
        const { data, error } = await supabase
            .from('action_plans')
            .insert({ report_id: reportId, machine_id: machineId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async createItem(item: Partial<ActionItem>) {
        const { data, error } = await supabase
            .from('action_items')
            .insert(item)
            .select()
            .single();

        if (error) throw error;
        return data as ActionItem;
    },

    async updateItem(id: string, item: Partial<ActionItem>) {
        const { data, error } = await supabase
            .from('action_items')
            .update(item)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ActionItem;
    },

    async deleteItem(id: string) {
        const { error } = await supabase
            .from('action_items')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
