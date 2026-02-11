
import { useQuery } from '@tanstack/react-query';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { DashboardAlerts } from './DashboardAlerts';
import { SafetyDistanceCalculator } from '../../components/SafetyDistanceCalculator';
import { dashboardRepository } from '../../../infrastructure/repositories/dashboardRepository';
import { CheckCircle, TrendingUp, AlertTriangle } from 'lucide-react';

export function DashboardPage() {
    const { data: stats } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => dashboardRepository.getStats(),
        refetchInterval: 5 * 60 * 1000
    });

    // Calcular índice de conformidade
    const totalMachines = stats?.totalMachines || 0;
    const conformMachines = stats?.machinesByRiskLevel.aceitavel || 0;
    const complianceRate = totalMachines > 0 
        ? Math.round((conformMachines / totalMachines) * 100) 
        : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visão Geral</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Acompanhe os indicadores de segurança e performance da sua operação.
                </p>
            </div>

            {/* Stats Principais */}
            <DashboardStats />

            {/* Alertas Prioritários */}
            <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Alertas e Pendências
                    </h2>
                </div>
                <DashboardAlerts />
            </div>

            {/* Grid de 2 colunas para Gráficos e Calculadora */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <DashboardCharts />
                <SafetyDistanceCalculator />
            </div>

            {/* Status Geral de Conformidade */}
            <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Índice de Conformidade NR-12
                        </h3>
                        <p className="text-indigo-100 mt-1">
                            Máquinas avaliadas com risco aceitável vs. total de máquinas
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold">{complianceRate}%</div>
                        <div className="flex items-center gap-1 text-indigo-200 text-sm mt-1">
                            <CheckCircle className="h-4 w-4" />
                            <span>{conformMachines} de {totalMachines} máquinas</span>
                        </div>
                    </div>
                </div>
                <div className="mt-4 bg-white/20 rounded-full h-2">
                    <div 
                        className="bg-white rounded-full h-2 transition-all duration-500" 
                        style={{ width: `${complianceRate}%` }}
                    ></div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-2xl font-bold">{stats?.machinesByRiskLevel.aceitavel || 0}</div>
                        <div className="text-indigo-200 text-xs">Aceitável</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-2xl font-bold">{stats?.machinesByRiskLevel.toleravel || 0}</div>
                        <div className="text-indigo-200 text-xs">Tolerável</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-2xl font-bold">{stats?.machinesByRiskLevel.inaceitavel || 0}</div>
                        <div className="text-indigo-200 text-xs">Inaceitável</div>
                    </div>
                    <div className="bg-white/10 rounded-lg p-2">
                        <div className="text-2xl font-bold">{stats?.machinesByRiskLevel.critico || 0}</div>
                        <div className="text-indigo-200 text-xs">Crítico</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
