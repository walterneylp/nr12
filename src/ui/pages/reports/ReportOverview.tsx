


import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportRepository } from '../../../infrastructure/repositories/reportRepository';
import { AlertTriangle, CheckCircle, ClipboardList, ListTodo, ShieldCheck } from 'lucide-react';

export function ReportOverview() {
    const { id } = useParams<{ id: string }>();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['reportStats', id],
        queryFn: () => reportRepository.getReportStats(id!),
        enabled: !!id
    });

    if (isLoading) return <div className="p-4 animate-pulse">Carregando estatísticas...</div>;

    const checklistPercentage = stats?.checklistTotal
        ? Math.round((stats.checklistConform / stats.checklistTotal) * 100)
        : 0;

    const actionPercentage = stats?.actionTotal
        ? Math.round((stats.actionDone / stats.actionTotal) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Visão Geral do Laudo</h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {/* Risks Card */}
                <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg border-l-4 border-red-500">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                        Riscos Totais
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            {stats?.riskCount || 0}
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 px-5 py-3">
                        <div className="text-sm">
                            <span className="font-medium text-red-600 dark:text-red-400">
                                {stats?.criticalRiskCount || 0} Críticos/Inaceitáveis
                            </span>
                        </div>
                    </div>
                </div>

                {/* Checklist Card */}
                <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ClipboardList className="h-6 w-6 text-blue-500" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                        Conformidade
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            {checklistPercentage}%
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 px-5 py-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {stats?.checklistConform || 0} itens conformes
                        </div>
                    </div>
                </div>

                {/* Action Plan Card */}
                <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg border-l-4 border-orange-500">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <ListTodo className="h-6 w-6 text-orange-500" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                        Plano de Ação
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            {stats?.actionTotal || 0} Itens
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 px-5 py-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {actionPercentage}% concluído
                        </div>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white dark:bg-gray-700 overflow-hidden shadow rounded-lg border-l-4 border-green-500">
                    <div className="p-5">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <div className="ml-5 w-0 flex-1">
                                <dl>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                                        Status do Laudo
                                    </dt>
                                    <dd>
                                        <div className="text-lg font-medium text-gray-900 dark:text-white">
                                            Em Andamento
                                        </div>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-600 px-5 py-3">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Pronto para revisar
                        </div>
                    </div>
                </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mt-8">
                <h3 className="text-md font-medium">Instruções</h3>
                <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                    <li>Utilize a aba <strong>Apreciação de Riscos</strong> para cadastrar os perigos identificados e calcular o HRN.</li>
                    <li>Utilize a aba <strong>Checklist</strong> para verificar a conformidade com a NR-12 e anexar evidências fotográficas.</li>
                    <li>Utilize a aba <strong>Plano de Ação</strong> para definir as medidas corretivas necessárias.</li>
                    <li>Utilize a aba <strong>Validação</strong> para registrar os testes de comissionamento dos dispositivos de segurança.</li>
                </ul>
            </div>
        </div>
    )
}
