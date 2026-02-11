import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Briefcase,
    Plus,
    Search,
    Calendar,
    Building,
    User,
    Clock,
    RefreshCw,
    Pencil,
    Trash2,
    ChevronDown,
    Check,
    MoreHorizontal,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    XCircle
} from 'lucide-react';
import { jobRepository, type Job } from '../../../infrastructure/repositories/jobRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { DataLoadingState } from '../../components/DataLoadingState';
import { formatCurrency } from '../../../domain/utils';

const STATUS_CONFIG = {
    PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: PlayCircle },
    COMPLETED: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
};

interface JobCardProps {
    job: Job;
    onEdit: (job: Job) => void;
    onDelete: (id: string) => void;
}

function JobCard({ job, onEdit, onDelete }: JobCardProps) {
    const status = STATUS_CONFIG[job.status];
    const StatusIcon = status.icon;

    const isOverdue = job.due_date && new Date(job.due_date) < new Date() && job.status !== 'COMPLETED';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                        </span>
                        {job.code && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {job.code}
                            </span>
                        )}
                        {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="h-3 w-3" />
                                Atrasado
                            </span>
                        )}
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                        {job.title}
                    </h4>

                    {job.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {job.description}
                        </p>
                    )}

                    <div className="mt-3 space-y-1.5">
                        {job.client && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Building className="h-4 w-4 text-gray-400" />
                                {job.client.name}
                            </div>
                        )}

                        {job.assigned_user && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4 text-gray-400" />
                                {job.assigned_user.name}
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {job.start_date && (
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Início: {new Date(job.start_date).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                            {job.due_date && (
                                <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
                                    <Clock className="h-4 w-4" />
                                    Prazo: {new Date(job.due_date).toLocaleDateString('pt-BR')}
                                </div>
                            )}
                        </div>
                    </div>

                    {job.estimated_value && (
                        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(job.estimated_value)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex items-start gap-2 ml-4">
                    <button
                        onClick={() => onEdit(job)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(job.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

interface JobFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (job: Partial<Job>) => void;
    editingJob?: Job | null;
}

function JobFormModal({ isOpen, onClose, onSave, editingJob }: JobFormModalProps) {
    const [formData, setFormData] = useState<Partial<Job>>({
        title: '',
        description: '',
        client_id: '',
        status: 'PENDING',
        start_date: '',
        end_date: '',
        due_date: '',
        estimated_value: undefined,
        assigned_to: ''
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll
    });

    // Load data when editing
    useState(() => {
        if (editingJob) {
            setFormData({
                title: editingJob.title,
                description: editingJob.description || '',
                client_id: editingJob.client_id,
                status: editingJob.status,
                start_date: editingJob.start_date || '',
                end_date: editingJob.end_date || '',
                due_date: editingJob.due_date || '',
                estimated_value: editingJob.estimated_value,
                assigned_to: editingJob.assigned_to || ''
            });
        }
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Limpar strings vazias para undefined (evitar erro UUID)
        const cleanedData: Partial<Job> = {
            title: formData.title,
            description: formData.description || undefined,
            client_id: formData.client_id || undefined,
            status: formData.status,
            start_date: formData.start_date || undefined,
            end_date: formData.end_date || undefined,
            due_date: formData.due_date || undefined,
            estimated_value: formData.estimated_value ? Number(formData.estimated_value) : undefined,
            assigned_to: formData.assigned_to || undefined
        };
        onSave(cleanedData);
    };

    const statusOptions = [
        { value: 'PENDING', label: 'Pendente' },
        { value: 'IN_PROGRESS', label: 'Em Andamento' },
        { value: 'COMPLETED', label: 'Concluído' },
        { value: 'CANCELLED', label: 'Cancelado' }
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {editingJob ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Título *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Inspeção NR-12 - Máquinas Linha A"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Cliente *
                                    </label>
                                    <select
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.client_id}
                                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
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
                                        Descrição
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Descreva o escopo do trabalho..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Status
                                        </label>
                                        <select
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            {statusOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Valor Estimado (R$)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.estimated_value || ''}
                                            onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value ? Number(e.target.value) : undefined })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Data Início
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.start_date}
                                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Prazo Entrega
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.due_date}
                                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Data Conclusão
                                        </label>
                                        <input
                                            type="date"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.end_date}
                                            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                        />
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
                                {editingJob ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function JobsListPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | Job['status']>('ALL');

    const { data: jobs, isLoading, error, refetch } = useQuery({
        queryKey: ['jobs'],
        queryFn: jobRepository.getAll
    });

    const { data: stats } = useQuery({
        queryKey: ['job-stats'],
        queryFn: jobRepository.getStats
    });

    const createMutation = useMutation({
        mutationFn: jobRepository.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job-stats'] });
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            alert('Erro ao criar: ' + err.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Job> }) =>
            jobRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            setIsModalOpen(false);
            setEditingJob(null);
        },
        onError: (err: any) => {
            alert('Erro ao atualizar: ' + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: jobRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] });
            queryClient.invalidateQueries({ queryKey: ['job-stats'] });
        },
        onError: (err: any) => {
            alert('Erro ao excluir: ' + err.message);
        }
    });

    const filteredJobs = jobs?.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (job.code && job.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (job.client?.name && job.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleSave = (formData: Partial<Job>) => {
        if (editingJob) {
            updateMutation.mutate({ id: editingJob.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (job: Job) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingJob(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta ordem de serviço?')) {
            deleteMutation.mutate(id);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Briefcase className="h-7 w-7 text-indigo-600" />
                        Ordens de Serviço
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie trabalhos e ordens de serviço vinculadas aos clientes
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
                        Nova OS
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-5 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 border border-yellow-100 dark:border-yellow-800">
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">Pendentes</div>
                        <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.pending}</div>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                        <div className="text-sm text-blue-600 dark:text-blue-400">Em Andamento</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.in_progress}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                        <div className="text-sm text-green-600 dark:text-green-400">Concluídos</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.completed}</div>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
                        <div className="text-sm text-red-600 dark:text-red-400">Cancelados</div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.cancelled}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título, código ou cliente..."
                        className="pl-10 w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                statusFilter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {status === 'ALL' ? 'Todos' : 
                             status === 'PENDING' ? 'Pendentes' :
                             status === 'IN_PROGRESS' ? 'Em Andamento' : 'Concluídos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Jobs Grid */}
            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={refetch}
                data={filteredJobs}
                emptyMessage="Nenhuma ordem de serviço encontrada."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredJobs?.map((job) => (
                        <JobCard
                            key={job.id}
                            job={job}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            </DataLoadingState>

            {/* Modal */}
            <JobFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingJob(null);
                }}
                onSave={handleSave}
                editingJob={editingJob}
            />
        </div>
    );
}
