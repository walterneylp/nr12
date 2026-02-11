
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Pencil, Calendar, AlertTriangle } from 'lucide-react';
import { actionPlanRepository } from '../../../../infrastructure/repositories/actionPlanRepository';
import { reportRepository } from '../../../../infrastructure/repositories/reportRepository';
import { ActionItemForm } from './ActionItemForm';
import type { ActionItem } from '../../../../domain/types';

export function ActionPlanPage() {
    const { id: reportId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState<ActionItem | null>(null);

    // Fetch Report to get machine_id (needed to create plan if it doesn't exist)
    const { data: report } = useQuery({
        queryKey: ['report', reportId],
        queryFn: () => reportRepository.getById(reportId!),
        enabled: !!reportId
    });

    // Fetch Plan & Items
    const { data: planData, isLoading } = useQuery({
        queryKey: ['actionPlan', reportId],
        queryFn: async () => {
            if (!reportId) return null;
            let plan = await actionPlanRepository.getByReportId(reportId);

            // Auto-create plan if missing and report is loaded
            if (!plan && report) {
                console.log('Creating missing Action Plan...');
                plan = await actionPlanRepository.createPlan(reportId, report.machine?.id);
                // Refetch happens naturally or we return the new plan
                return { ...plan, items: [] };
            }
            return plan;
        },
        enabled: !!reportId && !!report
    });

    const deleteMutation = useMutation({
        mutationFn: actionPlanRepository.deleteItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['actionPlan', reportId] });
        }
    });

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta ação?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (item: ActionItem) => {
        setItemToEdit(item);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setItemToEdit(null);
        setIsModalOpen(true);
    };

    if (isLoading) return <div className="p-8">Carregando plano de ação...</div>;

    const items: ActionItem[] = planData?.items || [];
    const planId = planData?.id;

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'CRITICAL': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Crítica</span>;
            case 'HIGH': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Alta</span>;
            case 'MEDIUM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Média</span>;
            case 'LOW': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Baixa</span>;
            case 'IMPROVEMENT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Melhoria</span>;
            default: return priority;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Plano de Ação (5W2H Simplificado)</h2>
                <button
                    onClick={handleCreate}
                    disabled={!planId}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Ação
                </button>
            </div>

            {!planId && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                O plano de ação será criado automaticamente assim que as informações do laudo forem carregadas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {items.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-700 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-gray-500 dark:text-gray-400">Nenhuma ação cadastrada ainda.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-700 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                        {items.map((item) => (
                            <li key={item.id}>
                                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-3 mb-2">
                                            {getPriorityBadge(item.priority)}
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.status === 'DONE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            <p>Prazo: {item.due_days} dias</p>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 text-gray-400 hover:text-indigo-600"
                                        >
                                            <Pencil className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-gray-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {planId && (
                <ActionItemForm
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['actionPlan', reportId] })}
                    planId={planId}
                    itemToEdit={itemToEdit}
                />
            )}
        </div>
    );
}
