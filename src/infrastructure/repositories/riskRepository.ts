
import { supabase } from '../supabase';
import type { RiskEntry, RiskAssessment } from '../../domain/types';

export const riskRepository = {
    // Get or Create Assessment for a generic report/machine combo? 
    // Usually 1 report has 1 risk assessment.
    async getByReportId(reportId: string) {
        const { data, error } = await supabase
            .from('risk_assessments')
            .select('*')
            .eq('report_id', reportId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
        return data as RiskAssessment | null;
    },

    async createAssessment(assessment: Partial<RiskAssessment>) {
        const { data, error } = await supabase
            .from('risk_assessments')
            .insert(assessment)
            .select()
            .single();

        if (error) throw error;
        return data as RiskAssessment;
    },

    async getEntries(assessmentId: string) {
        const { data, error } = await supabase
            .from('risk_entries')
            .select('*')
            .eq('assessment_id', assessmentId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data as RiskEntry[];
    },

    async addEntry(entry: Partial<RiskEntry>) {
        const { data, error } = await supabase
            .from('risk_entries')
            .insert(entry)
            .select()
            .single();

        if (error) throw error;
        return data as RiskEntry;
    },

    async updateEntry(id: string, entry: Partial<RiskEntry>) {
        const { data, error } = await supabase
            .from('risk_entries')
            .update(entry)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as RiskEntry;
    },

    async deleteEntry(id: string) {
        const { error } = await supabase
            .from('risk_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getCatalog() {
        const { data, error } = await supabase
            .from('risk_catalog')
            .select('*')
            .order('category', { ascending: true })
            .order('description', { ascending: true });

        if (error) throw error;
        return data as { id: string, category: string, description: string }[];
    }
};
