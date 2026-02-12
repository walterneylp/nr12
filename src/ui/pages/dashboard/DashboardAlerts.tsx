import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
    AlertTriangle,
    Clock,
    Users,
    FileText,
    AlertOctagon,
    ChevronRight,
    RefreshCw,
    Calendar,
    CheckCircle2
} from 'lucide-react';
import { dashboardRepository, type DashboardAlert } from '../../../infrastructure/repositories/dashboardRepository';

interface AlertCardProps {
    alert: DashboardAlert;
}

function AlertCard({ alert }: AlertCardProps) {
    const severityConfig = {
        CRITICAL: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertOctagon },
        HIGH: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
        MEDIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
        LOW: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 }
    };

    const typeConfig = {
        REPORT_EXPIRING: { label: 'Laudo', icon: FileText, path: '/reports' },
        ACTION_DUE: { label: 'Ação', icon: AlertTriangle, path: '/reports' },
        TRAINING_EXPIRING: { label: 'Treinamento', icon: Users, path: '/training' },
        RISK_CRITICAL: { label: 'Risco', icon: AlertOctagon, path: '/reports' }
    };

    const config = severityConfig[alert.severity];
    const typeInfo = typeConfig[alert.type];
    const Icon = config.icon;
    const TypeIcon = typeInfo.icon;

    const getEntityLink = () => {
        if (alert.entityType === 'report') return `/reports/${alert.entityId}`;
        if (alert.entityType === 'training') return '/training';
        return typeInfo.path;
    };

    return (
        <Link
            to={getEntityLink()}
            className="block p-3 rounded-lg border hover:shadow-md transition-all group"
        >
            <div className={`flex items-start gap-3 ${config.color} border rounded-lg p-3`}>
                <div className="p-2 bg-white/50 rounded-full">
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/50">
                            {typeInfo.label}
                        </span>
                        {alert.daysUntil > 0 && alert.daysUntil < 999 && (
                            <span className="text-xs font-medium">
                                {alert.daysUntil} dias
                            </span>
                        )}
                    </div>
                    <h4 className="text-sm font-semibold truncate">
                        {alert.title}
                    </h4>
                    <p className="text-xs mt-1 opacity-80 truncate">
                        {alert.description}
                    </p>
                    {alert.dueDate && (
                        <p className="text-xs mt-1 flex items-center gap-1 opacity-70">
                            <Calendar className="h-3 w-3" />
                            Vence: {new Date(alert.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                    )}
                </div>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
        </Link>
    );
}

interface AlertSectionProps {
    title: string;
    icon: React.ElementType;
    iconColor: string;
    alerts: DashboardAlert[];
    emptyMessage: string;
    viewAllLink: string;
}

function AlertSection({ title, icon: Icon, iconColor, alerts, emptyMessage, viewAllLink }: AlertSectionProps) {
    if (alerts.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${iconColor} rounded-lg`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 ${iconColor} rounded-lg`}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
                        <span className="text-xs text-gray-500">{alerts.length} alerta(s)</span>
                    </div>
                </div>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                    <AlertCard key={`${alert.type}-${alert.id}`} alert={alert} />
                ))}
            </div>
            {alerts.length > 5 && (
                <Link
                    to={viewAllLink}
                    className="mt-4 w-full py-2 text-sm text-center text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors block"
                >
                    Ver todos ({alerts.length})
                </Link>
            )}
        </div>
    );
}

export function DashboardAlerts() {
    const { data: allAlerts, isLoading, error, refetch } = useQuery({
        queryKey: ['dashboard-alerts'],
        queryFn: () => dashboardRepository.getAllAlerts(),
        refetchInterval: 5 * 60 * 1000 // Recarregar a cada 5 minutos
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-16 bg-gray-100 rounded"></div>
                            <div className="h-16 bg-gray-100 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        // Extrair mensagem de erro do objeto
        const errorMessage = error instanceof Error 
            ? error.message 
            : typeof error === 'object' && error !== null && 'message' in error
                ? String((error as any).message)
                : 'Erro desconhecido ao carregar alertas';
        
        console.error('Erro no DashboardAlerts:', error);
        
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                        <h3 className="font-medium text-red-800 dark:text-red-200">Erro ao carregar alertas</h3>
                        <p className="text-sm text-red-600 dark:text-red-300">{errorMessage}</p>
                    </div>
                </div>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    // Agrupar alertas por tipo
    const expiringReports = allAlerts?.filter(a => a.type === 'REPORT_EXPIRING') || [];
    const pendingActions = allAlerts?.filter(a => a.type === 'ACTION_DUE') || [];
    const expiringTrainings = allAlerts?.filter(a => a.type === 'TRAINING_EXPIRING') || [];
    const criticalRisks = allAlerts?.filter(a => a.type === 'RISK_CRITICAL') || [];

    const criticalCount = allAlerts?.filter(a => a.severity === 'CRITICAL').length || 0;

    return (
        <div className="space-y-6">
            {/* Header com resumo */}
            {criticalCount > 0 && (
                <div className="bg-red-600 rounded-xl p-4 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertOctagon className="h-6 w-6" />
                        <div>
                            <h3 className="font-bold">{criticalCount} alerta(s) crítico(s)</h3>
                            <p className="text-sm text-red-100">Requerem atenção imediata</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        className="p-2 hover:bg-red-700 rounded-lg transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw className="h-5 w-5" />
                    </button>
                </div>
            )}

            {/* Grid de alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                <AlertSection
                    title="Laudos Vencendo"
                    icon={FileText}
                    iconColor="bg-red-100 text-red-600"
                    alerts={expiringReports}
                    emptyMessage="Nenhum laudo próximo ao vencimento"
                    viewAllLink="/reports"
                />

                <AlertSection
                    title="Ações Pendentes"
                    icon={AlertTriangle}
                    iconColor="bg-orange-100 text-orange-600"
                    alerts={pendingActions}
                    emptyMessage="Nenhuma ação pendente"
                    viewAllLink="/reports"
                />

                <AlertSection
                    title="Treinamentos"
                    icon={Users}
                    iconColor="bg-yellow-100 text-yellow-600"
                    alerts={expiringTrainings}
                    emptyMessage="Nenhum treinamento expirando"
                    viewAllLink="/training"
                />

                <AlertSection
                    title="Riscos Críticos"
                    icon={AlertOctagon}
                    iconColor="bg-purple-100 text-purple-600"
                    alerts={criticalRisks}
                    emptyMessage="Nenhum risco crítico identificado"
                    viewAllLink="/reports"
                />
            </div>
        </div>
    );
}
