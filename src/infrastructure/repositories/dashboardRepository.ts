import { supabase } from '../supabase';
import type { UUID } from '../../domain/types';

export interface DashboardAlert {
    id: UUID;
    type: 'REPORT_EXPIRING' | 'ACTION_DUE' | 'TRAINING_EXPIRING' | 'RISK_CRITICAL';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    entityId: UUID;
    entityType: string;
    dueDate?: string;
    daysUntil: number;
}

export interface DashboardStats {
    totalClients: number;
    totalMachines: number;
    totalReports: number;
    totalTrainings: number;
    reportsByStatus: {
        draft: number;
        ready: number;
        signed: number;
    };
    machinesByRiskLevel: {
        aceitavel: number;
        toleravel: number;
        inaceitavel: number;
        critico: number;
    };
}

export const dashboardRepository = {
    async getStats(): Promise<DashboardStats> {
        // Buscar contagem de clientes
        const { count: totalClients } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });

        // Buscar contagem de máquinas
        const { count: totalMachines } = await supabase
            .from('machines')
            .select('*', { count: 'exact', head: true });

        // Buscar contagem de laudos por status
        const { data: reportsData } = await supabase
            .from('reports')
            .select('status');

        const reportsByStatus = {
            draft: reportsData?.filter(r => r.status === 'DRAFT').length || 0,
            ready: reportsData?.filter(r => r.status === 'READY').length || 0,
            signed: reportsData?.filter(r => r.status === 'SIGNED').length || 0
        };

        // Buscar contagem de treinamentos
        const { count: totalTrainings } = await supabase
            .from('training_records')
            .select('*', { count: 'exact', head: true });

        // Buscar máquinas por nível de risco
        const { data: machinesData } = await supabase
            .from('machines')
            .select('risk_level');

        const machinesByRiskLevel = {
            aceitavel: machinesData?.filter(m => m.risk_level === 'ACEITAVEL').length || 0,
            toleravel: machinesData?.filter(m => m.risk_level === 'TOLERAVEL').length || 0,
            inaceitavel: machinesData?.filter(m => m.risk_level === 'INACEITAVEL').length || 0,
            critico: machinesData?.filter(m => m.risk_level === 'CRITICO').length || 0
        };

        return {
            totalClients: totalClients || 0,
            totalMachines: totalMachines || 0,
            totalReports: reportsData?.length || 0,
            totalTrainings: totalTrainings || 0,
            reportsByStatus,
            machinesByRiskLevel
        };
    },

    async getExpiringReports(daysThreshold: number = 90): Promise<DashboardAlert[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysThreshold);

        const { data, error } = await supabase
            .from('reports')
            .select(`
                id,
                title,
                valid_until,
                client:client_id(name)
            `)
            .eq('status', 'SIGNED')
            .lte('valid_until', futureDate.toISOString())
            .gte('valid_until', new Date().toISOString())
            .order('valid_until', { ascending: true })
            .limit(10);

        if (error) throw error;

        return (data || []).map((report: any) => {
            const daysUntil = Math.ceil(
                (new Date(report.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            
            return {
                id: report.id,
                type: 'REPORT_EXPIRING',
                severity: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
                title: `Laudo vencendo: ${report.title}`,
                description: `Cliente: ${report.client?.name || 'N/A'}`,
                entityId: report.id,
                entityType: 'report',
                dueDate: report.valid_until,
                daysUntil
            };
        });
    },

    async getPendingActions(): Promise<DashboardAlert[]> {
        const { data, error } = await supabase
            .from('action_items')
            .select(`
                id,
                description,
                due_date,
                priority,
                plan:plan_id(
                    report:report_id(
                        title,
                        client:client_id(name)
                    )
                )
            `)
                .in('status', ['OPEN', 'IN_PROGRESS'])
            .order('due_date', { ascending: true })
            .limit(10);

        if (error) throw error;

        return (data || []).map((action: any) => {
            const daysUntil = action.due_date 
                ? Math.ceil((new Date(action.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : 999;

            const severityMap: Record<string, 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'> = {
                'CRITICAL': 'CRITICAL',
                'HIGH': 'HIGH',
                'MEDIUM': 'MEDIUM',
                'LOW': 'LOW'
            };

            return {
                id: action.id,
                type: 'ACTION_DUE',
                severity: severityMap[action.priority] || 'MEDIUM',
                title: `Ação pendente: ${action.description.substring(0, 50)}...`,
                description: `Laudo: ${action.plan?.report?.title || 'N/A'}`,
                entityId: action.id,
                entityType: 'action_item',
                dueDate: action.due_date,
                daysUntil
            };
        });
    },

    async getExpiringTrainings(daysThreshold: number = 90): Promise<DashboardAlert[]> {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysThreshold);

        const { data, error } = await supabase
            .from('training_records')
            .select(`
                id,
                trainee_name,
                valid_until,
                machine:machine_id(name)
            `)
            .lte('valid_until', futureDate.toISOString())
            .gte('valid_until', new Date().toISOString())
            .order('valid_until', { ascending: true })
            .limit(10);

        if (error) throw error;

        return (data || []).map((training: any) => {
            const daysUntil = Math.ceil(
                (new Date(training.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return {
                id: training.id,
                type: 'TRAINING_EXPIRING',
                severity: daysUntil <= 30 ? 'CRITICAL' : daysUntil <= 60 ? 'HIGH' : 'MEDIUM',
                title: `Treinamento expirando: ${training.trainee_name}`,
                description: `Máquina: ${training.machine?.name || 'N/A'}`,
                entityId: training.id,
                entityType: 'training',
                dueDate: training.valid_until,
                daysUntil
            };
        });
    },

    async getCriticalRisks(): Promise<DashboardAlert[]> {
        const { data, error } = await supabase
            .from('risk_entries')
            .select(`
                id,
                hazard,
                hrn_number,
                risk_level,
                assessment:assessment_id(
                    report:report_id(
                        title,
                        client:client_id(name)
                    ),
                    machine:machine_id(name)
                )
            `)
            .in('risk_level', ['INACEITAVEL', 'CRITICO'])
            .order('hrn_number', { ascending: false })
            .limit(10);

        if (error) throw error;

        return (data || []).map((risk: any) => ({
            id: risk.id,
            type: 'RISK_CRITICAL',
            severity: risk.risk_level === 'CRITICO' ? 'CRITICAL' : 'HIGH',
            title: `Risco ${risk.risk_level}: ${risk.hazard?.substring(0, 40)}...`,
            description: `Máquina: ${risk.assessment?.machine?.name || 'N/A'} | HRN: ${risk.hrn_number}`,
            entityId: risk.id,
            entityType: 'risk_entry',
            daysUntil: 0
        }));
    },

    async getAllAlerts(): Promise<DashboardAlert[]> {
        const [expiringReports, pendingActions, expiringTrainings, criticalRisks] = await Promise.all([
            this.getExpiringReports(),
            this.getPendingActions(),
            this.getExpiringTrainings(),
            this.getCriticalRisks()
        ]);

        // Combinar e ordenar por severidade e dias
        const allAlerts = [
            ...expiringReports,
            ...pendingActions,
            ...expiringTrainings,
            ...criticalRisks
        ];

        // Ordenar: CRITICAL primeiro, depois por dias até vencer
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return allAlerts.sort((a, b) => {
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) return severityDiff;
            return a.daysUntil - b.daysUntil;
        });
    }
};
