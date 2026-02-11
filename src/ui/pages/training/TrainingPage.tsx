
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
    Plus, 
    GraduationCap, 
    Calendar, 
    Clock, 
    User, 
    Award,
    AlertTriangle,
    RefreshCw,
    Search,
    Building,
    Trash2,
    Pencil,
    ChevronDown,
    Check,
    X
} from 'lucide-react';
import { trainingRepository } from '../../../infrastructure/repositories/trainingRepository';
import type { TrainingRecord } from '../../../infrastructure/repositories/trainingRepository';
import { machineRepository } from '../../../infrastructure/repositories/machineRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { DataLoadingState } from '../../components/DataLoadingState';

const TRAINING_TYPES = [
    { value: 'INITIAL', label: 'Inicial', color: 'bg-blue-100 text-blue-800', icon: '🎓' },
    { value: 'RECYCLING', label: 'Reciclagem', color: 'bg-green-100 text-green-800', icon: '🔄' }
];

interface TrainingCardProps {
    training: TrainingRecord & { machine?: { name: string; tag: string }; client?: { name: string } };
    onEdit: (training: TrainingRecord) => void;
    onDelete: (id: string) => void;
}

function TrainingCard({ training, onEdit, onDelete }: TrainingCardProps) {
    const isExpiring = training.valid_until && new Date(training.valid_until) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const isExpired = training.valid_until && new Date(training.valid_until) < new Date();
    
    const typeInfo = TRAINING_TYPES.find(t => t.value === training.training_type);

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${
            isExpired ? 'border-red-300 bg-red-50' : isExpiring ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${typeInfo?.color}`}>
                            {typeInfo?.icon} {typeInfo?.label}
                        </span>
                        {(isExpiring || isExpired) && (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                isExpired ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                                <AlertTriangle className="inline h-3 w-3 mr-1" />
                                {isExpired ? 'Expirado' : 'Expira em breve'}
                            </span>
                        )}
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {training.trainee_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {training.trainee_role || 'Operador'}
                    </p>

                    {training.client && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {training.client.name}
                        </p>
                    )}

                    {training.machine && (
                        <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                            {training.machine.name} ({training.machine.tag})
                        </p>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <Clock className="h-4 w-4" />
                            {training.duration_hours}h
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                            <User className="h-4 w-4" />
                            {training.instructor_name || 'N/A'}
                        </div>
                    </div>

                    {training.certificate_number && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Award className="h-4 w-4" />
                            Cert: {training.certificate_number}
                        </div>
                    )}

                    {training.valid_until && (
                        <div className={`mt-3 text-sm ${isExpired ? 'text-red-600' : isExpiring ? 'text-yellow-600' : 'text-gray-500'}`}>
                            <Calendar className="inline h-4 w-4 mr-1" />
                            Válido até: {new Date(training.valid_until).toLocaleDateString('pt-BR')}
                        </div>
                    )}

                    {training.content_summary && (
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {training.content_summary}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => onEdit(training)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(training.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface TrainingFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (training: Partial<TrainingRecord>) => void;
    editingTraining?: TrainingRecord | null;
}

function TrainingFormModal({ isOpen, onClose, onSave, editingTraining }: TrainingFormModalProps) {
    const [formData, setFormData] = useState<Partial<TrainingRecord>>({
        training_type: 'INITIAL',
        trainee_name: '',
        trainee_role: '',
        client_id: '',
        machine_id: '',
        duration_hours: 8,
        instructor_name: '',
        certificate_number: '',
        content_summary: '',
        valid_until: ''
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll
    });

    const { data: machines } = useQuery({
        queryKey: ['machines'],
        queryFn: machineRepository.getAll
    });

    // Carregar dados quando editando
    useEffect(() => {
        if (editingTraining) {
            setFormData({
                training_type: editingTraining.training_type || 'INITIAL',
                trainee_name: editingTraining.trainee_name || '',
                trainee_role: editingTraining.trainee_role || '',
                client_id: editingTraining.client_id || '',
                machine_id: editingTraining.machine_id || '',
                duration_hours: editingTraining.duration_hours || 8,
                instructor_name: editingTraining.instructor_name || '',
                certificate_number: editingTraining.certificate_number || '',
                content_summary: editingTraining.content_summary || '',
                valid_until: editingTraining.valid_until || ''
            });
        } else {
            // Reset quando abrir para novo cadastro
            setFormData({
                training_type: 'INITIAL',
                trainee_name: '',
                trainee_role: '',
                client_id: '',
                machine_id: '',
                duration_hours: 8,
                instructor_name: '',
                certificate_number: '',
                content_summary: '',
                valid_until: ''
            });
        }
    }, [editingTraining, isOpen]);

    // Filtrar máquinas pelo cliente selecionado
    const filteredMachines = machines?.filter(m => 
        !formData.client_id || m.client_id === formData.client_id
    );

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpar campos vazios para undefined
        const cleanedData: Partial<TrainingRecord> = {
            ...formData,
            client_id: formData.client_id || undefined,
            machine_id: formData.machine_id || undefined,
            certificate_number: formData.certificate_number || undefined,
            content_summary: formData.content_summary || undefined,
            instructor_name: formData.instructor_name || undefined,
            trainee_role: formData.trainee_role || undefined,
            valid_until: formData.valid_until || undefined,
        };
        onSave(cleanedData);
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
                                {editingTraining ? 'Editar Treinamento' : 'Novo Treinamento'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tipo de Treinamento *
                                    </label>
                                    <div className="flex gap-2 mt-1">
                                        {TRAINING_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, training_type: type.value as any })}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors ${
                                                    formData.training_type === type.value
                                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                        : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <span>{type.icon}</span>
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Nome do Colaborador *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.trainee_name}
                                            onChange={(e) => setFormData({ ...formData, trainee_name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Função/Cargo
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.trainee_role}
                                            onChange={(e) => setFormData({ ...formData, trainee_role: e.target.value })}
                                            placeholder="Ex: Operador de Máquina"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cliente/Empresa *
                                    </label>
                                    <select
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.client_id}
                                        onChange={(e) => {
                                            const newClientId = e.target.value;
                                            setFormData({ 
                                                ...formData, 
                                                client_id: newClientId,
                                                // Reset machine when client changes
                                                machine_id: '' 
                                            });
                                        }}
                                    >
                                        <option value="">Selecione um cliente...</option>
                                        {clients?.map((client) => (
                                            <option key={client.id} value={client.id}>
                                                {client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Máquina
                                    </label>
                                    <select
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
                                        value={formData.machine_id}
                                        onChange={(e) => setFormData({ ...formData, machine_id: e.target.value })}
                                        disabled={!formData.client_id}
                                    >
                                        <option value="">
                                            {!formData.client_id 
                                                ? 'Selecione um cliente primeiro' 
                                                : 'Selecione uma máquina (opcional)'}
                                        </option>
                                        {filteredMachines?.map((machine) => (
                                            <option key={machine.id} value={machine.id}>
                                                {machine.name} ({machine.tag})
                                            </option>
                                        ))}
                                    </select>
                                    {formData.client_id && filteredMachines?.length === 0 && (
                                        <p className="text-xs text-yellow-600 mt-1">
                                            Este cliente não possui máquinas cadastradas.
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Carga Horária (h)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.duration_hours}
                                            onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Instrutor
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.instructor_name}
                                            onChange={(e) => setFormData({ ...formData, instructor_name: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Nº do Certificado
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.certificate_number}
                                            onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Válido Até *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.valid_until?.split('T')[0] || ''}
                                            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value + 'T00:00:00Z' })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Conteúdo Programático
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.content_summary}
                                        onChange={(e) => setFormData({ ...formData, content_summary: e.target.value })}
                                        placeholder="Descreva o conteúdo do treinamento..."
                                    />
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
                                {editingTraining ? 'Salvar' : 'Cadastrar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function TrainingPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTraining, setEditingTraining] = useState<TrainingRecord | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'INITIAL' | 'RECYCLING'>('ALL');
    
    // Filtro de cliente igual às outras telas
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    const { data: trainings, isLoading, error, refetch } = useQuery({
        queryKey: ['trainings', selectedClientId],
        queryFn: () => selectedClientId 
            ? trainingRepository.getByClientId(selectedClientId)
            : trainingRepository.getAll(),
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
    });

    const { data: stats } = useQuery({
        queryKey: ['training-stats'],
        queryFn: trainingRepository.getStats,
    });

    const createMutation = useMutation({
        mutationFn: trainingRepository.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            queryClient.invalidateQueries({ queryKey: ['training-stats'] });
            setIsModalOpen(false);
            setEditingTraining(null);
        },
        onError: (err: any) => {
            alert('Erro ao salvar: ' + err.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<TrainingRecord> }) => 
            trainingRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            setIsModalOpen(false);
            setEditingTraining(null);
        },
        onError: (err: any) => {
            alert('Erro ao atualizar: ' + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: trainingRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['trainings'] });
            queryClient.invalidateQueries({ queryKey: ['training-stats'] });
        },
        onError: (err: any) => {
            alert('Erro ao deletar: ' + err.message);
        }
    });

    const filteredTrainings = trainings?.filter(t => {
        const matchesSearch = t.trainee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.certificate_number && t.certificate_number.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = filterType === 'ALL' || t.training_type === filterType;
        return matchesSearch && matchesType;
    });

    const handleSave = (formData: Partial<TrainingRecord>) => {
        if (editingTraining) {
            updateMutation.mutate({ id: editingTraining.id, data: formData });
        } else {
            createMutation.mutate(formData as any);
        }
    };

    const handleEdit = (training: TrainingRecord) => {
        setEditingTraining(training);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingTraining(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Remover este treinamento?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <GraduationCap className="h-7 w-7 text-indigo-600" />
                        Treinamentos NR-12
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gestão de capacitação de operadores conforme item 12.135 da NR-12
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Novo Treinamento
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <div className="text-sm text-blue-600 dark:text-blue-400">Iniciais</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.initial}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                        <div className="text-sm text-green-600 dark:text-green-400">Reciclagens</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.recycling}</div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
                        <div className="text-sm text-indigo-600 dark:text-indigo-400">Válidos</div>
                        <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{stats.valid}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou certificado..."
                        className="pl-10 w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Client Dropdown Filter */}
                <div className="relative w-full sm:w-72">
                    <div
                        className="relative w-full cursor-default overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none sm:text-sm"
                    >
                        <div
                            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 dark:text-white cursor-pointer flex items-center justify-between"
                            onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                        >
                            <span className="block truncate">
                                {selectedClientId
                                    ? clients?.find(c => c.id === selectedClientId)?.name
                                    : 'Filtrar por Cliente...'}
                            </span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                            </span>
                        </div>
                    </div>

                    {isClientDropdownOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsClientDropdownOpen(false)}
                            ></div>
                            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 p-2 border-b border-gray-100 dark:border-gray-700">
                                    <input
                                        type="text"
                                        className="w-full p-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 dark:text-white focus:outline-none focus:border-indigo-500"
                                        placeholder="Buscar cliente..."
                                        value={clientSearchTerm}
                                        onChange={(e) => setClientSearchTerm(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div
                                    className={`relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${!selectedClientId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                    onClick={() => {
                                        setSelectedClientId('');
                                        setIsClientDropdownOpen(false);
                                    }}
                                >
                                    <span className={`block truncate ${!selectedClientId ? 'font-medium' : 'font-normal'}`}>
                                        Todos os Clientes
                                    </span>
                                    {!selectedClientId && (
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                            <Check className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                    )}
                                </div>
                                {clients
                                    ?.filter(client => client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()))
                                    .map((client) => (
                                        <div
                                            key={client.id}
                                            className={`relative cursor-default select-none py-2 pl-10 pr-4 text-gray-900 dark:text-gray-100 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${selectedClientId === client.id ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                                            onClick={() => {
                                                setSelectedClientId(client.id);
                                                setIsClientDropdownOpen(false);
                                            }}
                                        >
                                            <span className={`block truncate ${selectedClientId === client.id ? 'font-medium' : 'font-normal'}`}>
                                                {client.name}
                                            </span>
                                            {selectedClientId === client.id && (
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                                    <Check className="h-4 w-4" aria-hidden="true" />
                                                </span>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </>
                    )}
                </div>

                {/* Type Filter */}
                <div className="flex gap-2">
                    {(['ALL', 'INITIAL', 'RECYCLING'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filterType === type
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {type === 'ALL' ? 'Todos' : type === 'INITIAL' ? 'Iniciais' : 'Reciclagens'}
                        </button>
                    ))}
                </div>
            </div>

            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={refetch}
                data={filteredTrainings}
                emptyMessage={selectedClientId 
                    ? "Nenhum treinamento encontrado para este cliente."
                    : "Nenhum treinamento registrado."}
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTrainings?.map((training) => (
                        <TrainingCard
                            key={training.id}
                            training={training}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </DataLoadingState>

            <TrainingFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingTraining(null);
                }}
                onSave={handleSave}
                editingTraining={editingTraining}
            />
        </div>
    );
}
