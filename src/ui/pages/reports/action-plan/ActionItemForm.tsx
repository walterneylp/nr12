
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ActionItem } from '../../../../domain/types';
import { actionPlanRepository } from '../../../../infrastructure/repositories/actionPlanRepository';

interface ActionItemFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    planId: string;
    itemToEdit?: ActionItem | null;
}

export function ActionItemForm({ isOpen, onClose, onSuccess, planId, itemToEdit }: ActionItemFormProps) {
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('HIGH');
    const [discipline, setDiscipline] = useState('MECHANICAL');
    const [dueDays, setDueDays] = useState('30');
    const [what, setWhat] = useState(''); // O que fazer
    const [who, setWho] = useState(''); // Quem fará (texto simples por enquanto)

    // We only have 'description' in schema, so let's combine fields or just use description
    // Schema: description TEXT NOT NULL
    // Let's use description as the main text area.

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (itemToEdit) {
            setDescription(itemToEdit.description);
            setPriority(itemToEdit.priority);
            setDiscipline(itemToEdit.discipline || 'MECHANICAL');
            setDueDays(itemToEdit.due_days?.toString() || '30');
        } else {
            setDescription('');
            setPriority('HIGH');
            setDiscipline('MECHANICAL');
            setDueDays('30');
        }
        setError(null);
    }, [itemToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload: any = {
                plan_id: planId,
                description,
                priority,
                discipline,
                due_days: parseInt(dueDays),
                status: itemToEdit ? itemToEdit.status : 'OPEN'
            };

            if (itemToEdit) {
                await actionPlanRepository.updateItem(itemToEdit.id, payload);
            } else {
                await actionPlanRepository.createItem(payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                    {itemToEdit ? 'Editar Ação' : 'Nova Ação'}
                                </h3>
                                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">O que deve ser feito? (Descrição)</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="Ex: Instalar proteção fixa na correia..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prioridade</label>
                                        <select
                                            value={priority}
                                            onChange={(e) => setPriority(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="CRITICAL">Crítica (Imediato)</option>
                                            <option value="HIGH">Alta</option>
                                            <option value="MEDIUM">Média</option>
                                            <option value="LOW">Baixa</option>
                                            <option value="IMPROVEMENT">Melhoria</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disciplina</label>
                                        <select
                                            value={discipline}
                                            onChange={(e) => setDiscipline(e.target.value)}
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <option value="MECHANICAL">Mecânica</option>
                                            <option value="ELECTRICAL">Elétrica</option>
                                            <option value="AUTOMATION">Automação</option>
                                            <option value="HYDRAULIC">Hidráulica</option>
                                            <option value="PNEUMATIC">Pneumática</option>
                                            <option value="OPERATIONAL">Operacional</option>
                                            <option value="OTHER">Outros</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prazo (Dias)</label>
                                    <input
                                        type="number"
                                        value={dueDays}
                                        onChange={(e) => setDueDays(e.target.value)}
                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        </div>


                        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {loading ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}
