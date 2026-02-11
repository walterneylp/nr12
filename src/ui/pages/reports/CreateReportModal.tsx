
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, ChevronRight, Check } from 'lucide-react';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { machineRepository } from '../../../infrastructure/repositories/machineRepository';
import { reportRepository } from '../../../infrastructure/repositories/reportRepository';
import { riskRepository } from '../../../infrastructure/repositories/riskRepository';
import { jobRepository } from '../../../infrastructure/repositories/jobRepository';

const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' }
};

interface CreateReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateReportModal({ isOpen, onClose }: CreateReportModalProps) {
    const [step, setStep] = useState(1);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedMachineId, setSelectedMachineId] = useState('');
    const [selectedChecklistVersionId, setSelectedChecklistVersionId] = useState('');
    const [title, setTitle] = useState('');

    const queryClient = useQueryClient();

    // Data Fetching
    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
        enabled: isOpen && step === 1,
    });

    const { data: jobs } = useQuery({
        queryKey: ['jobs', selectedClientId],
        queryFn: () => jobRepository.getByClientId(selectedClientId),
        enabled: !!selectedClientId && step === 2,
    });

    const { data: machines } = useQuery({
        queryKey: ['machines', selectedClientId],
        queryFn: () => machineRepository.getByClientId(selectedClientId),
        enabled: !!selectedClientId && step === 3,
    });

    const { data: checklistVersions } = useQuery({
        queryKey: ['checklistVersions'],
        queryFn: reportRepository.getChecklistVersions,
        enabled: step === 3,
    });

    // Mutation
    const createReportMutation = useMutation({
        mutationFn: async () => {
            // 1. Create Report
            const report = await reportRepository.create({
                client_id: selectedClientId,
                job_id: selectedJobId || undefined,
                title: title || `Laudo Técnico - ${machines?.find(m => m.id === selectedMachineId)?.name}`,
                checklist_version_id: selectedChecklistVersionId,
            });

            // 2. Create Risk Assessment linked to Report and Machine
            await riskRepository.createAssessment({
                report_id: report.id,
                machine_id: selectedMachineId,
                tenant_id: report.tenant_id,
            });

            return report;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            onClose();
            // Reset state
            setStep(1);
            setSelectedClientId('');
            setSelectedJobId('');
            setSelectedMachineId('');
            setSelectedChecklistVersionId('');
            setTitle('');
        },
    });

    const handleNext = () => {
        if (step === 1 && selectedClientId) setStep(2);
        else if (step === 2) setStep(3); // Job is optional, can proceed without
        else if (step === 3 && selectedMachineId) setStep(4);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                Novo Laudo - Passo {step} de 4
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="mt-4">
                            {step === 1 && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione o Cliente</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={selectedClientId}
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Ordem de Serviço (Opcional)
                                    </label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={selectedJobId}
                                        onChange={(e) => setSelectedJobId(e.target.value)}
                                    >
                                        <option value="">Nenhuma (criar laudo avulso)</option>
                                        {jobs?.map(j => (
                                            <option key={j.id} value={j.id}>
                                                {j.code || 'OS sem código'} - {j.title} ({STATUS_CONFIG[j.status].label})
                                            </option>
                                        ))}
                                    </select>
                                    {jobs && jobs.length > 0 && (
                                        <p className="text-xs text-gray-500">
                                            Vincular este laudo a uma ordem de serviço existente ajuda no controle de trabalhos.
                                        </p>
                                    )}
                                    {(!jobs || jobs.length === 0) && (
                                        <p className="text-sm text-yellow-600">
                                            Nenhuma ordem de serviço cadastrada para este cliente. Você pode criar um laudo avulso ou cadastrar uma OS primeiro.
                                        </p>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selecione a Máquina</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={selectedMachineId}
                                        onChange={(e) => setSelectedMachineId(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {machines?.map(m => <option key={m.id} value={m.id}>{m.name} ({m.tag})</option>)}
                                    </select>
                                    {machines?.length === 0 && <p className="text-sm text-yellow-600">Nenhuma máquina cadastrada para este cliente.</p>}
                                </div>
                            )}

                            {step === 4 && (
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Versão do Checklist</label>
                                    <select
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                        value={selectedChecklistVersionId}
                                        onChange={(e) => setSelectedChecklistVersionId(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                        {checklistVersions?.map((v: any) => <option key={v.id} value={v.id}>{v.name} ({v.version})</option>)}
                                    </select>

                                    <div className="mt-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título do Laudo (Opcional)</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="Ex: Laudo Técnico - Prensas"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-between">
                            {step > 1 ? (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                                >
                                    Voltar
                                </button>
                            ) : <div></div>}

                            {step < 4 ? (
                                <button
                                    onClick={handleNext}
                                    disabled={(step === 1 && !selectedClientId) || (step === 3 && !selectedMachineId)}
                                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50 sm:text-sm"
                                >
                                    Próximo <ChevronRight className="ml-2 h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => createReportMutation.mutate()}
                                    disabled={!selectedChecklistVersionId || createReportMutation.isPending}
                                    className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none disabled:opacity-50 sm:text-sm"
                                >
                                    {createReportMutation.isPending ? 'Criando...' : 'Criar Laudo'} <Check className="ml-2 h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
