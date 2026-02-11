
import { supabase } from '../supabase';
import type { Report, Client, Machine } from '../../domain/types';

export const reportRepository = {
    async getAll() {
        const { data, error } = await supabase
            .from('reports')
            .select(`
        *,
        client:clients(name),
        risk_assessments(
          machine:machines(name, tag)
        )
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Map the nested structure to a flatter one for UI
        return data.map((r: any) => ({
            ...r,
            machine: r.risk_assessments?.[0]?.machine
        })) as (Report & { client: { name: string }, machine: { name: string, tag: string } })[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('reports')
            .select(`
        *,
        client:clients(*),
        risk_assessments(
          machine:machines(*)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;

        // Flatten structure for single report too
        const reportData = data as any;
        return {
            ...reportData,
            machine: reportData.risk_assessments?.[0]?.machine
        } as (Report & { client: Client, machine: Machine });
    },

    async create(report: Partial<Report>) {
        const { data, error } = await supabase
            .from('reports')
            .insert(report)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async update(id: string, report: Partial<Report>) {
        const { data, error } = await supabase
            .from('reports')
            .update(report)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async getChecklistVersions() {
        const { data, error } = await supabase
            .from('checklist_versions')
            .select('*')
            .eq('is_active', true)
            .order('version', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getReportStats(reportId: string) {
        // Parallel requests for stats
        const [risks, checklist, actions] = await Promise.all([
            // Get critical risks count
            supabase
                .from('risk_entries')
                .select('risk_level, assessment_id!inner(report_id)')
                .eq('assessment_id.report_id', reportId),

            // Get checklist progress
            supabase
                .from('checklist_responses')
                .select('status')
                .eq('report_id', reportId),

            // Get action items
            supabase
                .from('action_items')
                .select('status, plan_id!inner(report_id)')
                .eq('plan_id.report_id', reportId)
        ]);

        const riskCount = risks.data?.length || 0;
        const criticalRiskCount = risks.data?.filter(r => r.risk_level === 'CRITICO' || r.risk_level === 'INACEITAVEL').length || 0;

        const checklistTotal = checklist.data?.length || 0;
        // Checklist items count
        const checklistConform = checklist.data?.filter(c => c.status === 'C').length || 0;

        const actionTotal = actions.data?.length || 0;
        const actionDone = actions.data?.filter(a => a.status === 'DONE' || a.status === 'VERIFIED').length || 0;

        return {
            riskCount,
            criticalRiskCount,
            checklistTotal,
            checklistConform,
            actionTotal,
            actionDone
        };
    },

    // --- MÉTODOS DE ASSINATURA ---

    async updateStatus(id: string, status: Report['status']) {
        const updateData: Partial<Report> = { status };
        
        // Se está assinando, adiciona timestamp de bloqueio
        if (status === 'SIGNED') {
            updateData.locked_at = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('reports')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async signReport(id: string, signData: {
        artNumber?: string;
        artFileId?: string | null;
        signedPdfFileId?: string | null;
        hashSha256: string;
        signatureMode?: Report['signature_mode'];
        signatureMetadata?: Record<string, any>;
    }) {
        const { data: userData } = await supabase.auth.getUser();
        
        const { data, error } = await supabase
            .from('reports')
            .update({
                status: 'SIGNED',
                art_number: signData.artNumber,
                art_file_id: signData.artFileId,
                signed_pdf_file_id: signData.signedPdfFileId,
                signed_hash_sha256: signData.hashSha256,
                signature_mode: signData.signatureMode || 'EXTERNAL_UPLOAD',
                signature_metadata_json: signData.signatureMetadata,
                signed_at: new Date().toISOString(),
                signed_by: userData.user?.id,
                locked_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async uploadDraftPDF(id: string, fileId: string) {
        const { data, error } = await supabase
            .from('reports')
            .update({ draft_pdf_file_id: fileId })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async setValidity(id: string, validFrom: string, validityMonths: number) {
        const { data, error } = await supabase
            .from('reports')
            .update({
                valid_from: validFrom,
                validity_months: validityMonths
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Report;
    },

    async getExpiringReports(daysAhead: number = 30) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);
        
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                client:clients(name)
            `)
            .eq('status', 'SIGNED')
            .lte('valid_until', futureDate.toISOString())
            .gte('valid_until', new Date().toISOString())
            .order('valid_until', { ascending: true });

        if (error) throw error;
        return data as (Report & { client: { name: string } })[];
    },

    async verifyIntegrity(reportId: string): Promise<{ valid: boolean; message: string }> {
        const { data: report, error } = await supabase
            .from('reports')
            .select('signed_hash_sha256, signed_pdf_file_id, status')
            .eq('id', reportId)
            .single();

        if (error) throw error;
        
        if (report.status !== 'SIGNED') {
            return { valid: false, message: 'Laudo não está assinado' };
        }

        if (!report.signed_hash_sha256) {
            return { valid: false, message: 'Hash de verificação não encontrado' };
        }

        // Aqui poderia fazer download do arquivo e recalcular o hash
        // Por enquanto, apenas verificamos se o hash existe
        return { 
            valid: true, 
            message: 'Hash de integridade presente: ' + report.signed_hash_sha256.substring(0, 16) + '...' 
        };
    }
};
