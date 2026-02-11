import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    History,
    Search,
    RefreshCw,
    User,
    Calendar,
    Filter,
    ChevronDown,
    ChevronUp,
    FileText,
    Plus,
    Pencil,
    Trash2,
    Download,
    Eye,
    LogIn,
    LogOut,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { auditRepository, type AuditEvent, type AuditFilters } from '../../../infrastructure/repositories/auditRepository';
import { DataLoadingState } from '../../components/DataLoadingState';

const ACTION_ICONS: Record<string, React.ElementType> = {
    CREATE: Plus,
    UPDATE: Pencil,
    DELETE: Trash2,
    STATUS_CHANGE: CheckCircle,
    EXPORT: Download,
    SIGN: CheckCircle,
    LOGIN: LogIn,
    LOGOUT: LogOut,
    VIEW: Eye,
    DOWNLOAD: Download,
    UPLOAD: Plus
};

const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    STATUS_CHANGE: 'bg-yellow-100 text-yellow-800',
    EXPORT: 'bg-purple-100 text-purple-800',
    SIGN: 'bg-indigo-100 text-indigo-800',
    LOGIN: 'bg-gray-100 text-gray-800',
    LOGOUT: 'bg-gray-100 text-gray-800',
    VIEW: 'bg-gray-100 text-gray-800',
    DOWNLOAD: 'bg-purple-100 text-purple-800',
    UPLOAD: 'bg-green-100 text-green-800'
};

interface AuditEventRowProps {
    event: AuditEvent;
    isExpanded: boolean;
    onToggle: () => void;
}

function AuditEventRow({ event, isExpanded, onToggle }: AuditEventRowProps) {
    const Icon = ACTION_ICONS[event.action] || FileText;
    const colorClass = ACTION_COLORS[event.action] || 'bg-gray-100 text-gray-800';

    return (
        <div className="border-b border-gray-200 dark:border-gray-700 last:border-0">
            <div
                onClick={onToggle}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
            >
                <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                                {event.action_label}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {event.entity_type_label}
                            </span>
                            {event.entity_name && (
                                <>
                                    <span className="text-gray-400">:</span>
                                    <span className="text-sm text-gray-900 dark:text-gray-200 truncate max-w-xs">
                                        {event.entity_name}
                                    </span>
                                </>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.actor_name || event.actor_email || 'Sistema'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(event.created_at!).toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>

                    <div>
                        {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 pl-16">
                    {event.changes_summary && (
                        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {event.changes_summary}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {event.before_json && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-1">Antes</h4>
                                <pre className="text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(event.before_json, null, 2)}
                                </pre>
                            </div>
                        )}
                        {event.after_json && (
                            <div>
                                <h4 className="text-xs font-medium text-gray-500 mb-1">Depois</h4>
                                <pre className="text-xs bg-green-50 dark:bg-green-900/10 p-2 rounded overflow-auto max-h-40">
                                    {JSON.stringify(event.after_json, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>

                    {event.ip_address && (
                        <div className="mt-3 text-xs text-gray-500">
                            IP: {event.ip_address}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function AuditLogPage() {
    const [filters, setFilters] = useState<AuditFilters>({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    const { data: events, isLoading, error, refetch } = useQuery({
        queryKey: ['audit-events', filters],
        queryFn: () => auditRepository.getAll(filters, 100)
    });

    const { data: stats } = useQuery({
        queryKey: ['audit-stats'],
        queryFn: () => auditRepository.getStats()
    });

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="h-7 w-7 text-indigo-600" />
                        Log de Auditoria
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Histórico completo de todas as ações no sistema
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50"
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filtros
                    </button>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Hoje</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalToday}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Esta Semana</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalWeek}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Este Mês</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalMonth}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Ações Principais</div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {Object.entries(stats.byAction)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 3)
                                .map(([action, count]) => (
                                    <div key={action} className="flex justify-between">
                                        <span>{action}</span>
                                        <span className="text-gray-500">{count}</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Buscar
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Nome, email..."
                                    className="pl-9 w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={filters.searchTerm || ''}
                                    onChange={(e) => setFilters(f => ({ ...f, searchTerm: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Ação
                            </label>
                            <select
                                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={filters.action || ''}
                                onChange={(e) => setFilters(f => ({ ...f, action: e.target.value || undefined }))}
                            >
                                <option value="">Todas</option>
                                <option value="CREATE">Criação</option>
                                <option value="UPDATE">Atualização</option>
                                <option value="DELETE">Exclusão</option>
                                <option value="STATUS_CHANGE">Mudança de Status</option>
                                <option value="SIGN">Assinatura</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Entidade
                            </label>
                            <select
                                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={filters.entityType || ''}
                                onChange={(e) => setFilters(f => ({ ...f, entityType: e.target.value || undefined }))}
                            >
                                <option value="">Todas</option>
                                <option value="client">Cliente</option>
                                <option value="machine">Máquina</option>
                                <option value="report">Laudo</option>
                                <option value="site">Local</option>
                                <option value="training">Treinamento</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Período
                            </label>
                            <select
                                className="w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                onChange={(e) => {
                                    const days = parseInt(e.target.value);
                                    if (days) {
                                        const date = new Date();
                                        date.setDate(date.getDate() - days);
                                        setFilters(f => ({ ...f, startDate: date.toISOString() }));
                                    } else {
                                        setFilters(f => ({ ...f, startDate: undefined }));
                                    }
                                }}
                            >
                                <option value="">Todo período</option>
                                <option value="1">Últimas 24h</option>
                                <option value="7">Últimos 7 dias</option>
                                <option value="30">Últimos 30 dias</option>
                                <option value="90">Últimos 90 dias</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Events List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <DataLoadingState
                    isLoading={isLoading}
                    error={error as Error | null}
                    onRetry={refetch}
                    data={events}
                    emptyMessage="Nenhum evento de auditoria encontrado."
                >
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {events?.map((event) => (
                            <AuditEventRow
                                key={event.id}
                                event={event}
                                isExpanded={expandedId === event.id}
                                onToggle={() => toggleExpand(event.id)}
                            />
                        ))}
                    </div>
                </DataLoadingState>
            </div>
        </div>
    );
}
