import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MapPin,
    Plus,
    Search,
    Building,
    Phone,
    Mail,
    User,
    RefreshCw,
    Pencil,
    Trash2,
    Check,
    X,
    ChevronDown,
    MoreHorizontal,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import { siteRepository, type Site } from '../../../infrastructure/repositories/siteRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { DataLoadingState } from '../../components/DataLoadingState';

const STATUS_CONFIG = {
    active: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' }
};

interface SiteCardProps {
    site: Site;
    onEdit: (site: Site) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, isActive: boolean) => void;
}

function SiteCard({ site, onEdit, onDelete, onToggleActive }: SiteCardProps) {
    const status = site.is_active ? STATUS_CONFIG.active : STATUS_CONFIG.inactive;

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 transition-all hover:shadow-md ${
            !site.is_active ? 'opacity-75 border-gray-200' : 'border-gray-200 dark:border-gray-700'
        }`}>
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                        </span>
                        {site.code && (
                            <span className="text-xs text-gray-500 font-mono">
                                {site.code}
                            </span>
                        )}
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                        {site.name}
                    </h4>

                    {site.client && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {site.client.name}
                        </p>
                    )}

                    <div className="mt-3 space-y-1.5">
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span>
                                {site.address}{site.number && `, ${site.number}`}
                                {site.neighborhood && ` - ${site.neighborhood}`}
                                <br />
                                {site.city} - {site.state}
                                {site.zip_code && `, CEP: ${site.zip_code}`}
                            </span>
                        </div>

                        {site.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {site.phone}
                            </div>
                        )}

                        {site.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Mail className="h-4 w-4 text-gray-400" />
                                {site.email}
                            </div>
                        )}

                        {site.contact_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <User className="h-4 w-4 text-gray-400" />
                                Contato: {site.contact_name}
                            </div>
                        )}
                    </div>

                    {site.notes && (
                        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {site.notes}
                        </p>
                    )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                    <button
                        onClick={() => onToggleActive(site.id, !site.is_active)}
                        className={`p-2 rounded-full transition-colors ${
                            site.is_active 
                                ? 'text-green-600 hover:bg-green-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                        }`}
                        title={site.is_active ? 'Desativar' : 'Ativar'}
                    >
                        {site.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                    <button
                        onClick={() => onEdit(site)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Editar"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => onDelete(site.id)}
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

interface SiteFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (site: Partial<Site>) => void;
    editingSite?: Site | null;
}

function SiteFormModal({ isOpen, onClose, onSave, editingSite }: SiteFormModalProps) {
    const [formData, setFormData] = useState<Partial<Site>>({
        name: '',
        code: '',
        client_id: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        phone: '',
        email: '',
        contact_name: '',
        notes: '',
        is_active: true
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll
    });

    // Load data when editing
    useState(() => {
        if (editingSite) {
            setFormData({
                name: editingSite.name,
                code: editingSite.code || '',
                client_id: editingSite.client_id,
                address: editingSite.address || '',
                number: editingSite.number || '',
                neighborhood: editingSite.neighborhood || '',
                city: editingSite.city,
                state: editingSite.state,
                zip_code: editingSite.zip_code || '',
                phone: editingSite.phone || '',
                email: editingSite.email || '',
                contact_name: editingSite.contact_name || '',
                notes: editingSite.notes || '',
                is_active: editingSite.is_active
            });
        }
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
                
                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                {editingSite ? 'Editar Local' : 'Novo Local'}
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nome do Local *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ex: Matriz, Filial SP, Unidade Industrial"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
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
                                            <option value="">Selecione...</option>
                                            {clients?.map((client) => (
                                                <option key={client.id} value={client.id}>
                                                    {client.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Código
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Ex: MAT, FIL-SP"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Endereço
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Número
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.number}
                                            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Bairro
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.neighborhood}
                                        onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Cidade *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Estado *
                                        </label>
                                        <select
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        >
                                            <option value="">UF</option>
                                            {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            CEP
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="00000-000"
                                            value={formData.zip_code}
                                            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Telefone
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nome do Contato
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
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
                                {editingSite ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export function SitesListPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    const { data: sites, isLoading, error, refetch } = useQuery({
        queryKey: ['sites'],
        queryFn: siteRepository.getAll
    });

    const { data: stats } = useQuery({
        queryKey: ['site-stats'],
        queryFn: siteRepository.getStats
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll
    });

    const createMutation = useMutation({
        mutationFn: siteRepository.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            queryClient.invalidateQueries({ queryKey: ['site-stats'] });
            setIsModalOpen(false);
        },
        onError: (err: any) => {
            alert('Erro ao criar: ' + err.message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Site> }) =>
            siteRepository.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            setIsModalOpen(false);
            setEditingSite(null);
        },
        onError: (err: any) => {
            alert('Erro ao atualizar: ' + err.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: siteRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            queryClient.invalidateQueries({ queryKey: ['site-stats'] });
        },
        onError: (err: any) => {
            alert('Erro ao excluir: ' + err.message);
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            siteRepository.toggleActive(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites'] });
            queryClient.invalidateQueries({ queryKey: ['site-stats'] });
        }
    });

    const filteredSites = sites?.filter(site => {
        const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (site.code && site.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
            site.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (site.client?.name && site.client.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesClient = clientFilter ? site.client_id === clientFilter : true;
        const matchesStatus = statusFilter === 'ALL' ? true :
            statusFilter === 'ACTIVE' ? site.is_active : !site.is_active;
        return matchesSearch && matchesClient && matchesStatus;
    });

    const handleSave = (formData: Partial<Site>) => {
        if (editingSite) {
            updateMutation.mutate({ id: editingSite.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (site: Site) => {
        setEditingSite(site);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingSite(null);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este local?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleToggleActive = (id: string, isActive: boolean) => {
        toggleMutation.mutate({ id, isActive });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <MapPin className="h-7 w-7 text-indigo-600" />
                        Locais/Filiais
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Gerencie os endereços e unidades dos seus clientes
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
                        Novo Local
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                        <div className="text-sm text-green-600 dark:text-green-400">Ativos</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.active}</div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">Inativos</div>
                        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.inactive}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, cidade ou cliente..."
                        className="pl-10 w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={clientFilter}
                    onChange={(e) => setClientFilter(e.target.value)}
                >
                    <option value="">Todos os clientes</option>
                    {clients?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    className="rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                    <option value="ALL">Todos</option>
                    <option value="ACTIVE">Ativos</option>
                    <option value="INACTIVE">Inativos</option>
                </select>
            </div>

            {/* Sites Grid */}
            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={refetch}
                data={filteredSites}
                emptyMessage="Nenhum local cadastrado."
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredSites?.map((site) => (
                        <SiteCard
                            key={site.id}
                            site={site}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onToggleActive={handleToggleActive}
                        />
                    ))}
                </div>
            </DataLoadingState>

            {/* Modal */}
            <SiteFormModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingSite(null);
                }}
                onSave={handleSave}
                editingSite={editingSite}
            />
        </div>
    );
}
