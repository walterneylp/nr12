
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Play, 
    FileCheck,
    Trash2,
    ShieldCheck
} from 'lucide-react';
import { validationRepository } from '../../../../infrastructure/repositories/validationRepository';
import type { TestType, ValidationTest } from '../../../../infrastructure/repositories/validationRepository';
import { DataLoadingState } from '../../../components/DataLoadingState';
import { supabase } from '../../../../infrastructure/supabase';

const TEST_TYPES: { value: TestType; label: string; icon: React.ReactNode; description: string }[] = [
    { 
        value: 'EMERGENCY_STOP', 
        label: 'Parada de Emergência', 
        icon: <AlertCircle className="h-5 w-5" />,
        description: 'Teste do botão de emergência e tempo de parada'
    },
    { 
        value: 'INTERLOCK', 
        label: 'Intertravamento', 
        icon: <ShieldCheck className="h-5 w-5" />,
        description: 'Teste de portas com intertravamento elétrico/mecânico'
    },
    { 
        value: 'LIGHT_CURTAIN', 
        label: 'Cortina de Luz', 
        icon: <span className="text-lg">👁</span>,
        description: 'Teste de cortina de luz e cálculo de distância de segurança'
    },
    { 
        value: 'BIMANUAL', 
        label: 'Comando Bimanual', 
        icon: <Play className="h-5 w-5" />,
        description: 'Teste de simultaneidade e anti-repetição'
    },
    { 
        value: 'SCANNER', 
        label: 'Scanner/Área', 
        icon: <span className="text-lg">📡</span>,
        description: 'Teste de scanner a laser ou sensores de área'
    },
    { 
        value: 'OTHERS', 
        label: 'Outros', 
        icon: <FileCheck className="h-5 w-5" />,
        description: 'Outros testes de validação específicos'
    },
];

interface TestCardProps {
    test: ValidationTest;
    onEdit: (test: ValidationTest) => void;
    onDelete: (id: string) => void;
}

function TestCard({ test, onEdit, onDelete }: TestCardProps) {
    const testType = TEST_TYPES.find(t => t.value === test.test_type);

    const getEvidenceUrl = (filePath: string) => {
        const { data } = supabase.storage.from('photos').getPublicUrl(filePath);
        return data.publicUrl;
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 p-5 transition-all hover:shadow-md ${
            test.passed ? 'border-green-500' : 'border-red-500'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${test.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {testType?.icon}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                            {testType?.label || test.test_type}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {test.test_description}
                        </p>
                        
                        <div className="mt-3 space-y-2">
                            <div className="text-sm">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Esperado:</span>
                                <span className="text-gray-700 dark:text-gray-400 ml-1">{test.expected_result}</span>
                            </div>
                            <div className="text-sm">
                                <span className="font-medium text-gray-600 dark:text-gray-300">Obtido:</span>
                                <span className="text-gray-700 dark:text-gray-400 ml-1">{test.actual_result || '-'}</span>
                            </div>
                        </div>

                        {test.notes && (
                            <p className="text-sm text-gray-500 mt-2 italic">
                                Obs: {test.notes}
                            </p>
                        )}

                        {test.evidence_file_id && (
                            <div className="mt-3">
                                <img
                                    src={getEvidenceUrl(test.evidence_file_id)}
                                    alt="Evidência"
                                    className="h-24 w-auto rounded-lg border border-gray-200"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    test.passed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                    {test.passed ? (
                        <><CheckCircle2 className="h-4 w-4" /> OK</>
                    ) : (
                        <><XCircle className="h-4 w-4" /> NOK</>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                    {test.tested_by && <span>Testado por: {test.tested_by}</span>}
                    {test.tested_at && <span className="ml-2">• {new Date(test.tested_at).toLocaleDateString()}</span>}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(test)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        Editar
                    </button>
                    <button
                        onClick={() => onDelete(test.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TestFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (test: Partial<ValidationTest>) => void;
    editingTest?: ValidationTest | null;
    reportId: string;
}

function TestFormModal({ isOpen, onClose, onSave, editingTest, reportId }: TestFormModalProps) {
    const [formData, setFormData] = useState<Partial<ValidationTest> & { report_id?: string }>({
        report_id: reportId,
        test_type: 'EMERGENCY_STOP',
        test_description: '',
        expected_result: '',
        actual_result: '',
        passed: false,
        tested_by: '',
        notes: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {editingTest ? 'Editar Teste' : 'Novo Teste de Validação'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tipo de Teste *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        {TEST_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, test_type: type.value })}
                                                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                                                    formData.test_type === type.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {type.icon}
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {type.label}
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Descrição do Teste *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.test_description}
                                        onChange={(e) => setFormData({ ...formData, test_description: e.target.value })}
                                        placeholder="Ex: Teste de parada de emergência frontal"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Resultado Esperado *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.expected_result}
                                            onChange={(e) => setFormData({ ...formData, expected_result: e.target.value })}
                                            placeholder="Ex: Parada em ≤ 0.5s"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Resultado Obtido *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.actual_result}
                                            onChange={(e) => setFormData({ ...formData, actual_result: e.target.value })}
                                            placeholder="Ex: Parada em 0.4s"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Testado Por
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.tested_by}
                                            onChange={(e) => setFormData({ ...formData, tested_by: e.target.value })}
                                            placeholder="Nome do técnico"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Data do Teste
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.tested_at?.split('T')[0] || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setFormData({ ...formData, tested_at: e.target.value + 'T00:00:00Z' })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Observações
                                    </label>
                                    <textarea
                                        rows={2}
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Observações adicionais..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Resultado Final
                                    </label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, passed: true })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                                                formData.passed
                                                    ? 'border-green-500 bg-green-50 text-green-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-green-300'
                                            }`}
                                        >
                                            <CheckCircle2 className="h-5 w-5" />
                                            Aprovado
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, passed: false })}
                                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-colors ${
                                                !formData.passed
                                                    ? 'border-red-500 bg-red-50 text-red-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-red-300'
                                            }`}
                                        >
                                            <XCircle className="h-5 w-5" />
                                            Reprovado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                {editingTest ? 'Salvar' : 'Registrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function ValidationPage() {
    const { id: reportId } = useParams<{ id: string }>();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<ValidationTest | null>(null);

    const { data: tests, isLoading, error, refetch } = useQuery({
        queryKey: ['validations', reportId],
        queryFn: () => validationRepository.getByReportId(reportId!),
        enabled: !!reportId,
    });

    const { data: stats } = useQuery({
        queryKey: ['validation-stats', reportId],
        queryFn: () => validationRepository.getStats(reportId!),
        enabled: !!reportId,
    });

    const createMutation = useMutation({
        mutationFn: validationRepository.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validations', reportId] });
            queryClient.invalidateQueries({ queryKey: ['validation-stats', reportId] });
            setIsModalOpen(false);
            setEditingTest(null);
        },
        onError: (err: any) => {
            alert('Erro ao salvar: ' + err.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, test }: { id: string; test: Partial<ValidationTest> }) => 
            validationRepository.update(id, test),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validations', reportId] });
            queryClient.invalidateQueries({ queryKey: ['validation-stats', reportId] });
            setIsModalOpen(false);
            setEditingTest(null);
        },
        onError: (err: any) => {
            alert('Erro ao atualizar: ' + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: validationRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['validations', reportId] });
            queryClient.invalidateQueries({ queryKey: ['validation-stats', reportId] });
        },
        onError: (err: any) => {
            alert('Erro ao deletar: ' + err.message);
        }
    });

    const handleSave = (formData: Partial<ValidationTest>) => {
        if (editingTest) {
            updateMutation.mutate({ id: editingTest.id, test: formData });
        } else {
            createMutation.mutate(formData as any);
        }
    };

    const handleEdit = (test: ValidationTest) => {
        setEditingTest(test);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTest(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Remover este teste?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-indigo-600" />
                        Validação e Comissionamento
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Registre os testes de validação dos dispositivos de segurança
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    Novo Teste
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total de Testes</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                        <div className="text-sm text-green-600 dark:text-green-400">Aprovados</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.passed}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                        <div className="text-sm text-red-600 dark:text-red-400">Reprovados</div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.failed}</div>
                    </div>
                </div>
            )}

            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={refetch}
                data={tests}
                emptyMessage="Nenhum teste de validação registrado."
            >
                <div className="space-y-4">
                    {tests?.map((test) => (
                        <TestCard
                            key={test.id}
                            test={test}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </DataLoadingState>

            <TestFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTest(null);
                }}
                onSave={handleSave}
                editingTest={editingTest}
                reportId={reportId!}
            />
        </div>
    );
}
