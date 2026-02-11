
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Search, Factory, RefreshCw } from 'lucide-react';
import { machineRepository } from '../../../infrastructure/repositories/machineRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { MachineFormModal } from './MachineFormModal';
import { DataLoadingState } from '../../components/DataLoadingState';
import type { Machine } from '../../../domain/types';

export function MachinesListPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [machineToEdit, setMachineToEdit] = useState<Machine | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    const queryClient = useQueryClient();

    const { data: machines, isLoading, error, refetch } = useQuery({
        queryKey: ['machines'],
        queryFn: machineRepository.getAll,
        staleTime: 1000 * 30,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
    });

    const deleteMutation = useMutation({
        mutationFn: machineRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['machines'] });
        },
    });

    const handleCreate = () => {
        setMachineToEdit(null);
        setIsModalOpen(true);
    };

    const handleEdit = (machine: Machine) => {
        setMachineToEdit(machine);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta máquina?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleRetry = () => {
        refetch();
    };

    const filteredMachines = machines?.filter(machine => {
        const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (machine.tag && machine.tag.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesClient = selectedClientId ? machine.client_id === selectedClientId : true;

        return matchesSearch && matchesClient;
    });

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventário de Máquinas</h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Gerencie os equipamentos sujeitos à NR-12.
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
                        Nova Máquina
                    </button>
                </div>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nome ou TAG da máquina..."
                        className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

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
                                <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
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
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
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
                                                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </span>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        </>
                    )}
                </div>
            </div>

            <DataLoadingState
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={handleRetry}
                data={filteredMachines}
                emptyMessage="Nenhuma máquina encontrada. Cadastre a primeira máquina!"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMachines?.map((machine) => (
                        <div
                            key={machine.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden group"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {machine.name}
                                                </h3>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                                    {machine.machine_type || 'Tipo não definido'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mt-4">
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">TAG</p>
                                                    <p className="font-medium text-gray-900 dark:text-white">{machine.tag || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Fabricante</p>
                                                    <p className="font-medium text-gray-900 dark:text-white truncate">{machine.manufacturer || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                                <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Cliente</p>
                                                <p className="font-medium text-gray-900 dark:text-white truncate">{machine.client?.name || 'N/A'}</p>
                                            </div>
                                            {machine.criticality && (
                                                <div className="pt-2">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                        machine.criticality === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                                                        machine.criticality === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                                        machine.criticality === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        Criticidade: {machine.criticality}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2">
                                <button
                                    onClick={() => handleEdit(machine)}
                                    className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-gray-600 rounded-full transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(machine.id)}
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

            <MachineFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['machines'] });
                }}
                machineToEdit={machineToEdit}
            />
        </div>
    );
}
