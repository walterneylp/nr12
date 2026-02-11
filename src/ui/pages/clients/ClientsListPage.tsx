
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Building2, Users, RefreshCw } from 'lucide-react';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { ClientFormModal } from './ClientFormModal';
import { DataLoadingState } from '../../components/DataLoadingState';
import type { Client } from '../../../domain/types';

export function ClientsListPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const queryClient = useQueryClient();

    const { data: clients, isLoading, error, refetch } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
        staleTime: 1000 * 30, // 30 segundos
    });

    const deleteMutation = useMutation({
        mutationFn: clientRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
    });

    const handleCreate = () => {
        setClientToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (client: Client) => {
        setClientToEdit(client);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleRetry = () => {
        refetch();
    };

    const filteredClients = clients?.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.cnpj && client.cnpj.includes(searchTerm))
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciamento de Clientes</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Cadastre e gerencie as empresas para os laudos.
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Novo Cliente
                    </button>
                </div>
            </div>

            <div className="mb-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Buscar por nome ou CNPJ..."
                    className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={handleRetry}
                data={filteredClients}
                emptyMessage="Nenhum cliente encontrado. Cadastre o primeiro cliente!"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients?.map((client) => (
                        <div
                            key={client.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                                <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {client.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {client.trade_name || 'Razão Social'}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 space-y-2">
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-medium mr-2">CNPJ:</span>
                                                {client.cnpj || 'Não informado'}
                                            </div>
                                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                <span className="font-medium mr-2">Local:</span>
                                                {client.city ? `${client.city}/${client.state}` : '-'}
                                            </div>
                                            {(client.phone || client.email) && (
                                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                                                    {client.phone && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                                            <span className="font-medium mr-2">Tel:</span>
                                                            {client.phone}
                                                        </div>
                                                    )}
                                                    {client.email && (
                                                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 truncate" title={client.email}>
                                                            <span className="font-medium mr-2">Email:</span>
                                                            <span className="truncate">{client.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(client)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(client.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </DataLoadingState>

            <ClientFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['clients'] });
                }}
                clientToEdit={clientToEdit}
            />
        </div>
    );
}
