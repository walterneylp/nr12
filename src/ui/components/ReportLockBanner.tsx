import { Lock, AlertTriangle, FileCheck } from 'lucide-react';

interface ReportLockBannerProps {
    isSigned: boolean;
    signedAt?: string;
    signedBy?: string;
}

export function ReportLockBanner({ isSigned, signedAt, signedBy }: ReportLockBannerProps) {
    if (!isSigned) return null;

    return (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                    <FileCheck className="h-5 w-5 text-green-600 dark:text-green-300" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-green-900 dark:text-green-200">
                        Laudo Assinado e Bloqueado
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Este laudo foi assinado digitalmente em{' '}
                        {signedAt && new Date(signedAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                        {signedBy && ` por ${signedBy}`}.
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                        O documento está protegido contra alterações. Para modificar, 
                        crie uma nova revisão do laudo.
                    </p>
                </div>
                <div className="flex items-center gap-1 text-green-700 dark:text-green-300 text-sm font-medium">
                    <Lock className="h-4 w-4" />
                    <span>Bloqueado</span>
                </div>
            </div>
        </div>
    );
}

export function ReportReadOnlyIndicator() {
    return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-gray-100 text-gray-600 mb-4">
            <AlertTriangle className="h-3 w-3" />
            <span>Modo somente leitura</span>
        </div>
    );
}
