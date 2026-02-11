
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Ban, Plus, Save, Camera, X, ChevronDown, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { checklistRepository } from '../../../../infrastructure/repositories/checklistRepository';
import type { ChecklistEvidence } from '../../../../infrastructure/repositories/checklistRepository';
import { reportRepository } from '../../../../infrastructure/repositories/reportRepository';
import { supabase } from '../../../../infrastructure/supabase';
import type { ChecklistResponse, Requirement, ChecklistStatus } from '../../../../domain/types';
import { ReportLockBanner, ReportReadOnlyIndicator } from '../../../components/ReportLockBanner';

interface ChecklistItemProps {
    requirement: Requirement;
    response?: ChecklistResponse & { evidence?: ChecklistEvidence[] };
    onResponse: (status: ChecklistStatus, observation?: string) => void;
    onUploadEvidence: (file: File, type: 'CONTEXT' | 'DETAIL' | 'PLATE') => void;
    onDeleteEvidence: (evidenceId: string) => void;
    isUploading: boolean;
    isLocked?: boolean;
}

const PHOTO_TYPES = [
    { value: 'CONTEXT', label: 'Contexto', desc: 'Visão geral da área' },
    { value: 'DETAIL', label: 'Detalhe', desc: 'Close do problema' },
    { value: 'PLATE', label: 'Placa/ID', desc: 'Identificação da máquina' },
];

function ChecklistItem({ requirement, response, onResponse, onUploadEvidence, onDeleteEvidence, isUploading, isLocked }: ChecklistItemProps) {
    const [observation, setObservation] = useState(response?.observation || '');
    const [selectedPhotoType, setSelectedPhotoType] = useState<'CONTEXT' | 'DETAIL' | 'PLATE'>('CONTEXT');
    const fileInputRef = useState<HTMLInputElement | null>(null);

    useEffect(() => {
        setObservation(response?.observation || '');
    }, [response]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo 5MB.');
            return;
        }
        
        onUploadEvidence(file, selectedPhotoType);
        e.target.value = '';
    };

    const getEvidenceUrl = (filePath: string) => {
        const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
        return data.publicUrl;
    };

    return (
        <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center mb-1 flex-wrap gap-2">
                        <span className="text-xs font-bold text-gray-400 min-w-[40px]">{requirement.item}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${requirement.standard_reference === 'Custom' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                            {requirement.standard_reference || 'N/A'}
                        </span>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">{requirement.description}</h4>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onResponse('COMPLIANT')}
                        disabled={isLocked}
                        className={`flex flex-col items-center p-2 rounded-lg border w-12 h-12 justify-center transition-all ${response?.status === 'COMPLIANT'
                            ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isLocked ? 'Laudo bloqueado' : 'Conforme'}
                    >
                        <CheckCircle2 className={`h-6 w-6 ${response?.status === 'COMPLIANT' ? 'fill-green-100' : ''}`} />
                    </button>
                    <button
                        onClick={() => onResponse('NONCOMPLIANT')}
                        disabled={isLocked}
                        className={`flex flex-col items-center p-2 rounded-lg border w-12 h-12 justify-center transition-all ${response?.status === 'NONCOMPLIANT'
                            ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isLocked ? 'Laudo bloqueado' : 'Não Conforme'}
                    >
                        <AlertCircle className={`h-6 w-6 ${response?.status === 'NONCOMPLIANT' ? 'fill-red-100' : ''}`} />
                    </button>
                    <button
                        onClick={() => onResponse('NOT_APPLICABLE')}
                        disabled={isLocked}
                        className={`flex flex-col items-center p-2 rounded-lg border w-12 h-12 justify-center transition-all ${response?.status === 'NOT_APPLICABLE'
                            ? 'bg-gray-100 border-gray-400 text-gray-700 ring-1 ring-gray-400'
                            : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600'} ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isLocked ? 'Laudo bloqueado' : 'Não Aplicável'}
                    >
                        <Ban className="h-6 w-6" />
                    </button>
                </div>
            </div>

            {/* Observation Input */}
            <div className="mt-3">
                <textarea
                    className="w-full mt-1 p-2 border border-gray-200 rounded-md text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700/50 dark:border-gray-600 dark:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    rows={2}
                    placeholder={isLocked ? 'Laudo bloqueado - não é possível editar' : 'Adicione observações...'}
                    value={observation}
                    disabled={isLocked}
                    onChange={(e) => setObservation(e.target.value)}
                    onBlur={() => {
                        if (!isLocked && observation !== response?.observation) {
                            if (response?.status) {
                                onResponse(response.status, observation);
                            }
                        }
                    }}
                />
            </div>

            {/* Evidence Photos Section */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Evidências Fotográficas
                        {response?.evidence && response.evidence.length > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                                {response.evidence.length}
                            </span>
                        )}
                    </h5>
                </div>

                {/* Photo Type Selector */}
                <div className="flex gap-2 mb-3">
                    {PHOTO_TYPES.map((type) => (
                        <button
                            key={type.value}
                            onClick={() => setSelectedPhotoType(type.value as any)}
                            className={`flex-1 text-xs p-2 rounded-md border transition-colors ${
                                selectedPhotoType === type.value
                                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <span className="font-medium">{type.label}</span>
                            <span className="block text-[10px] opacity-70">{type.desc}</span>
                        </button>
                    ))}
                </div>

                {/* Evidence Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {response?.evidence?.map((evidence) => (
                        <div key={evidence.id} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                                src={getEvidenceUrl(evidence.file_path)}
                                alt={evidence.photo_type}
                                className="object-cover w-full h-full"
                            />
                            <div className="absolute top-1 left-1">
                                <span className="text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
                                    {evidence.photo_type === 'CONTEXT' ? 'C' : evidence.photo_type === 'DETAIL' ? 'D' : 'P'}
                                </span>
                            </div>
                            {!isLocked && (
                                <button
                                    onClick={() => onDeleteEvidence(evidence.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover foto"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Add Photo Button - só aparece se não estiver bloqueado */}
                    {!isLocked && (
                        <label className={`relative aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-colors ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileSelect}
                                disabled={isUploading}
                            />
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent" />
                            ) : (
                                <>
                                    <Camera className="h-6 w-6 text-gray-400 mb-1" />
                                    <span className="text-[10px] text-gray-500">{selectedPhotoType === 'CONTEXT' ? 'Contexto' : selectedPhotoType === 'DETAIL' ? 'Detalhe' : 'Placa'}</span>
                                </>
                            )}
                        </label>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ChecklistGroupProps {
    groupName: string;
    requirements: Requirement[];
    responses: (ChecklistResponse & { evidence?: ChecklistEvidence[] })[] | undefined;
    onResponse: (reqId: string, status: ChecklistStatus, obs?: string) => void;
    onUploadEvidence: (reqId: string, file: File, type: 'CONTEXT' | 'DETAIL' | 'PLATE') => void;
    onDeleteEvidence: (evidenceId: string) => void;
    uploadingItemId: string | null;
    isLocked?: boolean;
}

function ChecklistGroup({ groupName, requirements, responses, onResponse, onUploadEvidence, onDeleteEvidence, uploadingItemId, isLocked }: ChecklistGroupProps) {
    const [isOpen, setIsOpen] = useState(false);

    const answeredCount = requirements.filter(req =>
        responses?.some(res => res.requirement_id === req.id)
    ).length;
    const totalCount = requirements.length;
    const isComplete = answeredCount === totalCount && totalCount > 0;

    return (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 text-left">
                        {groupName}
                    </h3>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`text-sm font-medium ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                        {answeredCount} / {totalCount}
                    </span>
                    {isComplete && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                </div>
            </button>

            {isOpen && (
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/10 space-y-4">
                    {requirements.map(req => {
                        const response = responses?.find((r: any) => r.requirement_id === req.id);
                        return (
                            <ChecklistItem
                                key={req.id}
                                requirement={req}
                                response={response}
                                onResponse={(status, obs) => onResponse(req.id, status, obs)}
                                onUploadEvidence={(file, type) => onUploadEvidence(req.id, file, type)}
                                onDeleteEvidence={onDeleteEvidence}
                                isUploading={uploadingItemId === req.id}
                                isLocked={isLocked}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export function ChecklistExecution() {
    const { id: reportId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newItemDescription, setNewItemDescription] = useState('');
    const [newItemType, setNewItemType] = useState('Geral');
    const [isAdding, setIsAdding] = useState(false);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);

    const { data: report } = useQuery({
        queryKey: ['report', reportId],
        queryFn: () => reportRepository.getById(reportId!),
        enabled: !!reportId
    });

    // Verificar se o laudo está bloqueado
    const isLocked = report?.status === 'SIGNED' || !!report?.locked_at;

    const { data: requirements, isLoading: isLoadingReqs } = useQuery({
        queryKey: ['requirements', report?.checklist_version_id],
        queryFn: () => checklistRepository.getRequirements(report!.checklist_version_id),
        enabled: !!report?.checklist_version_id
    });

    const machineId = report?.machine?.id;

    const { data: responses, isLoading: isLoadingRes } = useQuery({
        queryKey: ['responses', reportId, machineId],
        queryFn: () => checklistRepository.getResponses(reportId!, machineId!),
        enabled: !!reportId && !!machineId
    });

    const upsertMutation = useMutation({
        mutationFn: checklistRepository.upsertResponse,
        onMutate: async (newResponse) => {
            await queryClient.cancelQueries({ queryKey: ['responses', reportId, machineId] });
            const previousResponses = queryClient.getQueryData<(ChecklistResponse & { evidence?: ChecklistEvidence[] })[]>(['responses', reportId, machineId]);

            queryClient.setQueryData<(ChecklistResponse & { evidence?: ChecklistEvidence[] })[]>(['responses', reportId, machineId], (old) => {
                if (!old) return [];
                const existingIndex = old.findIndex(r => r.requirement_id === newResponse.requirement_id);
                if (existingIndex > -1) {
                    const updated = [...old];
                    updated[existingIndex] = { ...updated[existingIndex], ...newResponse } as any;
                    return updated;
                } else {
                    return [...old, { ...newResponse, id: 'temp-id', evidence: [] } as any];
                }
            });

            return { previousResponses };
        },
        onError: (err, newResponse, context) => {
            if (context?.previousResponses) {
                queryClient.setQueryData(['responses', reportId, machineId], context.previousResponses);
            }
            console.error(err);
            alert("Erro ao salvar resposta: " + (err instanceof Error ? err.message : JSON.stringify(err)));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['responses', reportId, machineId] });
        },
    });

    const uploadEvidenceMutation = useMutation({
        mutationFn: async ({ requirementId, file, photoType }: { requirementId: string; file: File; photoType: 'CONTEXT' | 'DETAIL' | 'PLATE' }) => {
            // First, ensure we have a response to attach the evidence to
            let response = responses?.find(r => r.requirement_id === requirementId);
            
            if (!response) {
                // Create a response first
                const newResponse = await checklistRepository.upsertResponse({
                    report_id: reportId!,
                    machine_id: machineId!,
                    requirement_id: requirementId,
                    status: 'NONCOMPLIANT', // Default status when adding evidence
                    tenant_id: report!.tenant_id
                });
                response = { ...newResponse, evidence: [] };
                
                // Update cache with new response
                queryClient.setQueryData<(ChecklistResponse & { evidence?: ChecklistEvidence[] })[]>(['responses', reportId, machineId], (old) => {
                    if (!old) return [response!];
                    return [...old, response!];
                });
            }

            return checklistRepository.uploadEvidence(response.id, file, photoType);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['responses', reportId, machineId] });
        },
        onError: (err) => {
            console.error('Erro ao upload:', err);
            alert('Erro ao fazer upload da imagem: ' + (err as Error).message);
        }
    });

    const deleteEvidenceMutation = useMutation({
        mutationFn: checklistRepository.deleteEvidence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['responses', reportId, machineId] });
        },
        onError: (err) => {
            console.error('Erro ao deletar:', err);
            alert('Erro ao remover imagem');
        }
    });

    const createRequirementMutation = useMutation({
        mutationFn: checklistRepository.createCustomRequirement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requirements', report?.checklist_version_id] });
            setIsAddModalOpen(false);
            setNewItemDescription('');
            setIsAdding(false);
        },
        onError: (err) => {
            alert('Erro ao criar item: ' + err);
            setIsAdding(false);
        }
    });

    const handleResponse = (requirementId: string, status: ChecklistStatus, observation?: string) => {
        if (!report || !machineId) return;

        upsertMutation.mutate({
            report_id: report.id,
            machine_id: machineId,
            requirement_id: requirementId,
            status,
            observation,
            tenant_id: report.tenant_id
        });
    };

    const handleUploadEvidence = (requirementId: string, file: File, photoType: 'CONTEXT' | 'DETAIL' | 'PLATE') => {
        setUploadingItemId(requirementId);
        uploadEvidenceMutation.mutate(
            { requirementId, file, photoType },
            {
                onSettled: () => setUploadingItemId(null)
            }
        );
    };

    const handleDeleteEvidence = (evidenceId: string) => {
        if (confirm('Remover esta foto?')) {
            deleteEvidenceMutation.mutate(evidenceId);
        }
    };

    const handleAddItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemDescription.trim() || !report || !machineId) return;

        setIsAdding(true);
        const count = requirements ? requirements.length + 1 : 99;

        createRequirementMutation.mutate({
            checklist_version_id: report.checklist_version_id,
            report_id: report.id,
            machine_id: machineId,
            item: `C-${count}`,
            description: newItemDescription,
            group_name: newItemType,
            tenant_id: report.tenant_id
        });
    };

    if (isLoadingReqs || isLoadingRes) return <div className="p-8 text-center text-gray-500">Carregando checklist...</div>;
    if (!requirements) return <div>Nenhum requisito encontrado.</div>;
    if (!machineId) return <div>Erro: Máquina não identificada no laudo.</div>;

    const relevantRequirements = requirements.filter((r: any) => !r.report_id || r.report_id === reportId);

    const groups: Record<string, Requirement[]> = {};
    relevantRequirements.forEach((req: any) => {
        const g = req.group_name || 'Geral';
        if (!groups[g]) groups[g] = [];
        groups[g].push(req);
    });

    return (
        <div className="max-w-5xl mx-auto">
            {/* Banner de laudo bloqueado */}
            {report && (
                <ReportLockBanner 
                    isSigned={report.status === 'SIGNED'} 
                    signedAt={report.signed_at}
                    signedBy={report.signed_by}
                />
            )}

            {isLocked && <ReportReadOnlyIndicator />}

            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Checklist NR-12</h2>
                    <p className="text-sm text-gray-500">
                        {responses?.length || 0} de {relevantRequirements.length} itens verificados
                        {responses?.some(r => r.evidence && r.evidence.length > 0) && (
                            <span className="ml-2 text-indigo-600">
                                • {responses.reduce((acc, r) => acc + (r.evidence?.length || 0), 0)} fotos
                            </span>
                        )}
                    </p>
                </div>
                {!isLocked && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Adicionar Item Extra
                    </button>
                )}
            </div>

            {Object.entries(groups).map(([groupName, reqs]) => (
                <ChecklistGroup
                    key={groupName}
                    groupName={groupName}
                    requirements={reqs}
                    responses={responses}
                    onResponse={handleResponse}
                    onUploadEvidence={handleUploadEvidence}
                    onDeleteEvidence={handleDeleteEvidence}
                    uploadingItemId={uploadingItemId}
                    isLocked={isLocked}
                />
            ))}

            <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">Conclusão da Inspeção</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {responses?.length === relevantRequirements.length
                            ? '✅ Todos os itens foram respondidos.'
                            : `⚠️ Pendente: faltam ${relevantRequirements.length - (responses?.length || 0)} itens.`}
                    </p>
                </div>
                {!isLocked && (
                    <button
                        onClick={() => {
                            if (confirm('Deseja concluir o checklist e marcar o laudo como PRONTO?')) {
                                reportRepository.update(report!.id, { status: 'READY' })
                                    .then(() => {
                                        queryClient.invalidateQueries({ queryKey: ['report', reportId] });
                                        alert('Laudo atualizado para PRONTO!');
                                    });
                            }
                        }}
                        disabled={(responses?.length || 0) < relevantRequirements.length}
                        className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="-ml-1 mr-2 h-5 w-5" />
                        Finalizar Checklist
                    </button>
                )}
            </div>

            {/* Add Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" onClick={() => setIsAddModalOpen(false)}>
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <form onSubmit={handleAddItem}>
                                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <Plus className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                                Adicionar Item Personalizado
                                            </h3>
                                            <div className="mt-4 space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grupo / Categoria</label>
                                                    <select
                                                        value={newItemType}
                                                        onChange={(e) => setNewItemType(e.target.value)}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                    >
                                                        {Object.keys(groups).map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                        <option value="Outros">Outros</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição do Item</label>
                                                    <textarea
                                                        required
                                                        rows={3}
                                                        className="mt-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                        placeholder="Ex: Verificar vedação da tampa traseira..."
                                                        value={newItemDescription}
                                                        onChange={(e) => setNewItemDescription(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        disabled={isAdding}
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        {isAdding ? 'Adicionando...' : 'Adicionar Item'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
