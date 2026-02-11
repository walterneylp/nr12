
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface DataLoadingStateProps {
    isLoading: boolean;
    error: Error | null;
    onRetry?: () => void;
    children: React.ReactNode;
    emptyMessage?: string;
    data?: any[] | null;
}

export function DataLoadingState({ 
    isLoading, 
    error, 
    onRetry, 
    children, 
    emptyMessage = "Nenhum dado encontrado",
    data 
}: DataLoadingStateProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Carregando dados...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md w-full">
                    <div className="flex items-center gap-3 mb-3">
                        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        <h3 className="text-red-800 dark:text-red-300 font-medium">Erro ao carregar dados</h3>
                    </div>
                    <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                        {error.message || 'Ocorreu um erro inesperado'}
                    </p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tentar novamente
                        </button>
                    )}
                </div>
            </div>
        );
    }

    if (data && data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    return <>{children}</>;
}
