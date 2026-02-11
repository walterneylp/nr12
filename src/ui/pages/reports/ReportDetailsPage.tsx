
import { useState } from 'react';
import { useParams, Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    ClipboardCheck,
    AlertTriangle,
    FileText,
    ListTodo,
    ChevronLeft,
    Printer,
    PenTool,
    Lock,
    ShieldCheck
} from 'lucide-react';
import { reportRepository } from '../../../infrastructure/repositories/reportRepository';
import { GenerateReportPDFButton } from '../../components/GenerateReportPDFButton';
import { ReportSigningModal } from './signing/ReportSigningModal';
import { ReportIntegrityBadge } from './signing/ReportIntegrityBadge';

export function ReportDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);

    const { data: report, isLoading, error } = useQuery({
        queryKey: ['report', id],
        queryFn: () => reportRepository.getById(id!),
        enabled: !!id,
    });

    const isSigned = report?.status === 'SIGNED';
    const isLocked = isSigned || !!report?.locked_at;

    if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg">Erro ao carregar laudo: {String(error)}</div>;
    if (!report) return <div className="p-8 text-gray-500">Laudo não encontrado.</div>;

    const tabs = [
        { name: 'Visão Geral', path: '', icon: FileText },
        { name: 'Riscos', path: 'risks', icon: AlertTriangle },
        { name: 'Checklist', path: 'checklist', icon: ClipboardCheck },
        { name: 'Plano de Ação', path: 'action-plan', icon: ListTodo },
        { name: 'Validação', path: 'validation', icon: ShieldCheck },
    ];

    const currentTab = tabs.find(t =>
        t.path === '' ? location.pathname.endsWith(id!) : location.pathname.includes(t.path)
    ) || tabs[0];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <nav className="flex mb-4" aria-label="Breadcrumb">
                    <ol className="flex items-center space-x-4">
                        <li>
                            <div>
                                <Link to="/reports" className="text-gray-400 hover:text-gray-500">
                                    <ChevronLeft className="flex-shrink-0 h-5 w-5" aria-hidden="true" />
                                    <span className="sr-only">Voltar</span>
                                </Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="text-gray-300">/</span>
                                <Link to="/reports" className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700">Laudos</Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="text-gray-300">/</span>
                                <span className="ml-4 text-sm font-medium text-gray-900 dark:text-gray-100" aria-current="page">{report.title}</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                <div className="md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
                            {report.title}
                        </h2>
                        <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium mr-1">Cliente:</span> {report.client.name}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <span className="font-medium mr-1">Máquina:</span> {report.machine.name} ({report.machine.tag})
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                    ${report.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                                        report.status === 'READY' ? 'bg-yellow-100 text-yellow-800' : 
                                        report.status === 'SIGNED' ? 'bg-green-100 text-green-800' :
                                        'bg-blue-100 text-blue-800'}`}>
                                    {report.status === 'DRAFT' ? 'Rascunho' :
                                     report.status === 'READY' ? 'Pronto para Assinar' :
                                     report.status === 'SIGNED' ? 'Assinado' : report.status}
                                </span>
                                {isLocked && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-100 text-red-800">
                                        <Lock className="h-3 w-3" />
                                        Bloqueado
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                        <ReportIntegrityBadge report={report} />
                        
                        <button
                            type="button"
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                            onClick={() => window.print()}
                        >
                            <Printer className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                            Imprimir
                        </button>
                        
                        <GenerateReportPDFButton reportId={report.id} />
                        
                        {!isSigned && (
                            <button
                                onClick={() => setIsSigningModalOpen(true)}
                                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-green-700"
                            >
                                <PenTool className="-ml-1 mr-2 h-5 w-5" />
                                Assinar Laudo
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = tab.name === currentTab.name;
                        return (
                            <Link
                                key={tab.name}
                                to={tab.path ? tab.path : `.`} // Relative path logic
                                className={`
                  ${isActive
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                `}
                            >
                                <tab.icon className={`
                    ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                    -ml-0.5 mr-2 h-5 w-5
                `} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 min-h-[500px]">
                <Outlet />
            </div>

            {/* Signing Modal */}
            {report && (
                <ReportSigningModal
                    isOpen={isSigningModalOpen}
                    onClose={() => setIsSigningModalOpen(false)}
                    report={report}
                />
            )}
        </div>
    );
}
