
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Plus, Edit2 } from 'lucide-react';
import { riskRepository } from '../../../../infrastructure/repositories/riskRepository';
import { RiskEntryFormModal } from './RiskEntryFormModal';
import type { RiskEntry } from '../../../../domain/types';

export function ShortHRNDisplay({ entry }: { entry: RiskEntry }) {
    const color = (level: string) => {
        switch (level) {
            case 'ACEITAVEL': return 'bg-green-100 text-green-800';
            case 'TOLERAVEL': return 'bg-yellow-100 text-yellow-800';
            case 'INACEITAVEL': return 'bg-orange-100 text-orange-800';
            case 'CRITICO': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color(entry.risk_level)}`}>
            HRN {(entry.hrn_number || 0).toFixed(1)} - {entry.risk_level || 'N/A'}
        </span>
    );
}

export function RiskAssessmentList() {
    const { id: reportId } = useParams<{ id: string }>();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<RiskEntry | null>(null);
    const queryClient = useQueryClient();

    // 1. Get Risk Assessment ID from Report? 
    // Repo has getByReportId
    const { data: assessment, isLoading: isLoadingAss, error: errorAss } = useQuery({
        queryKey: ['riskAssessment', reportId],
        queryFn: () => riskRepository.getByReportId(reportId!),
        enabled: !!reportId,
    });

    // 2. Get Entries
    const { data: entries } = useQuery({
        queryKey: ['riskEntries', assessment?.id],
        queryFn: () => riskRepository.getEntries(assessment!.id),
        enabled: !!assessment,
    });

    console.log('RiskAssessmentList Debug:', { reportId, assessment, entries, errorAss, isLoadingAss });

    const handleNewEntry = () => {
        setEntryToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditEntry = (entry: RiskEntry) => {
        setEntryToEdit(entry);
        setIsModalOpen(true);
    };

    if (isLoadingAss) return <div className="p-4 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (errorAss) return <div className="p-4 text-red-600">Erro ao carregar avaliação: {String(errorAss)}</div>;
    if (!assessment) return <div className="p-4 text-gray-500">Avaliação de risco não encontrada.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Riscos Identificados</h2>
                <button
                    onClick={handleNewEntry}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Risco
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {entries?.length === 0 && (
                        <li className="px-4 py-8 text-center text-gray-500">
                            Nenhum perigo identificado ainda. Clique em "Adicionar Risco" para começar.
                        </li>
                    )}
                    {entries?.map((entry: RiskEntry) => (
                        <li key={entry.id}>
                            <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center mb-2">
                                            <p className="text-sm font-medium text-indigo-600 truncate mr-2">{entry.hazard}</p>
                                            <ShortHRNDisplay entry={entry} />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">Consequência:</span> {entry.possible_consequence}
                                                </p>
                                                {entry.hazard_location && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">Local:</span> {entry.hazard_location}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Photos Thumbnails */}
                                            {Array.isArray(entry.photos) && entry.photos.length > 0 && (
                                                <div className="flex gap-2 mt-2 md:mt-0">
                                                    {entry.photos.map((photo, idx) => (
                                                        <img
                                                            key={idx}
                                                            src={photo}
                                                            alt="Evidência"
                                                            className="h-16 w-16 object-cover rounded-md border border-gray-200 dark:border-gray-600"
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-4 flex-shrink-0 flex items-start">
                                        <button
                                            onClick={() => handleEditEntry(entry)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {isModalOpen && (
                <RiskEntryFormModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => queryClient.invalidateQueries({ queryKey: ['riskEntries', assessment.id] })}
                    assessmentId={assessment.id}
                    tenantId={assessment.tenant_id}
                    entryToEdit={entryToEdit}
                />
            )}
        </div>
    );
}
