
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText, Calendar, Search, Filter, Check, ChevronDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportRepository } from '../../../infrastructure/repositories/reportRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { CreateReportModal } from './CreateReportModal';

export function ReportsListPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [clientSearchTerm, setClientSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const { data: reports, isLoading, error } = useQuery({
        queryKey: ['reports'],
        queryFn: reportRepository.getAll,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
    });

    const filteredReports = reports?.filter(report => {
        const matchesClient = selectedClientId ? report.client_id === selectedClientId : true;
        const matchesSearch = searchTerm ? report.title.toLowerCase().includes(searchTerm.toLowerCase())
            || report.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
            || report.machine?.name.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        return matchesClient && matchesSearch;
    });

    if (isLoading) return <div className="p-8">Carregando laudos...</div>;
    if (error) return <div className="p-8 text-red-600">Erro ao carregar laudos: {String(error)}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laudos Técnicos</h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Laudo
                </button>
            </div>

            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar laudo por título, cliente ou máquina..."
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
                                {clients?.filter(client => client.name.toLowerCase().includes(clientSearchTerm.toLowerCase())).length === 0 && (
                                    <div className="relative cursor-default select-none py-2 px-4 text-gray-500 text-center">
                                        Nenhum cliente encontrado.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReports?.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-12">
                        {searchTerm || selectedClientId ? 'Nenhum laudo encontrado com os filtros atuais.' : 'Nenhum laudo encontrado. Crie o primeiro!'}
                    </div>
                )}

                {filteredReports?.map((report) => (
                    <Link
                        key={report.id}
                        to={`/reports/${report.id}`}
                        className="block bg-white dark:bg-gray-800 shadow rounded-lg hover:shadow-md transition-shadow"
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`px-2 py-1 text-xs font-semibold rounded-full 
                    ${report.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                        report.status === 'READY' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                    {report.status}
                                </div>
                                <Calendar className="h-4 w-4 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate" title={report.title}>
                                {report.title}
                            </h3>
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <p>Cliente: <span className="font-semibold">{report.client?.name || 'N/A'}</span></p>
                                <p>Máquina: <span className="font-semibold">{report.machine?.name || 'N/A'}</span></p>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-indigo-600 font-medium">
                                <FileText className="h-4 w-4 mr-1" />
                                Ver Detalhes
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <CreateReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
