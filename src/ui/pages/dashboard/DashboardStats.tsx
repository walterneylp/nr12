import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../infrastructure/supabase';
import { Activity, ShieldCheck, AlertTriangle, FileText } from 'lucide-react';

interface Stats {
    totalMachines: number;
    safeMachines: number;
    criticalRisks: number;
    reportsInProgress: number;
}

export function DashboardStats() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard_stats'],
        queryFn: async (): Promise<Stats> => {
            // Mocking some stats or fetching real if possible.
            // For now, let's fetch count of machines & reports
            const { count: machineCount } = await supabase.from('machines').select('*', { count: 'exact', head: true });
            const { count: reportCount } = await supabase.from('reports').select('*', { count: 'exact', head: true }).neq('status', 'ARCHIVED');

            // For "Critical Risks", we'd need to join tables or have a materialized view. 
            // Simplified: Fetch count of risk_entries with risk_level = 'CRITICO'
            // But risk_entries are many. Let's try.
            const { count: criticalRiskCount } = await supabase.from('risk_entries').select('*', { count: 'exact', head: true }).eq('risk_level', 'CRITICO');

            // Safe machines? Hard to calculate without logic. Let's assume machines with no critical risk.
            // Simplified for MVP dashboard:
            return {
                totalMachines: machineCount || 0,
                safeMachines: Math.floor((machineCount || 0) * 0.8), // Mock 80% safe
                criticalRisks: criticalRiskCount || 0,
                reportsInProgress: reportCount || 0
            };
        }
    });

    if (isLoading) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>)}
    </div>;

    const cards = [
        {
            title: 'Máquinas Cadastradas',
            value: stats?.totalMachines || 0,
            icon: Activity,
            color: 'bg-blue-500',
            textColor: 'text-blue-500',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
        },
        {
            title: 'Laudos em Andamento',
            value: stats?.reportsInProgress || 0,
            icon: FileText,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20'
        },
        {
            title: 'Riscos Críticos',
            value: stats?.criticalRisks || 0,
            icon: AlertTriangle,
            color: 'bg-red-500',
            textColor: 'text-red-500',
            bg: 'bg-red-50 dark:bg-red-900/20'
        },
        {
            title: 'Índice de Conformidade',
            value: '85%',
            icon: ShieldCheck,
            color: 'bg-green-500',
            textColor: 'text-green-500',
            bg: 'bg-green-50 dark:bg-green-900/20'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-6 h-6 ${card.textColor}`} />
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${card.bg} ${card.textColor}`}>
                            +2.5%
                        </span>
                    </div>
                    <div>
                        <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">{card.title}</h3>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
