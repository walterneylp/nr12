import { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Hash, FileCheck, X } from 'lucide-react';
import { reportRepository } from '../../../../infrastructure/repositories/reportRepository';
import type { Report } from '../../../../domain/types';

interface ReportIntegrityBadgeProps {
    report: Report;
}

export function ReportIntegrityBadge({ report }: ReportIntegrityBadgeProps) {
    const [showDetails, setShowDetails] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ valid: boolean; message: string } | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleVerify = async () => {
        setIsVerifying(true);
        try {
            const result = await reportRepository.verifyIntegrity(report.id);
            setVerificationResult(result);
        } catch (error: any) {
            setVerificationResult({ valid: false, message: error.message });
        } finally {
            setIsVerifying(false);
        }
    };

    // Se o laudo não está assinado, não mostra nada
    if (report.status !== 'SIGNED') {
        return (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-600">
                <Shield className="h-4 w-4" />
                <span>Não assinado</span>
            </div>
        );
    }

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setShowDetails(!showDetails);
                    if (!verificationResult && !isVerifying) {
                        handleVerify();
                    }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
            >
                <ShieldCheck className="h-4 w-4" />
                <span>Assinado</span>
                {report.signed_at && (
                    <span className="text-xs opacity-75">
                        em {new Date(report.signed_at).toLocaleDateString('pt-BR')}
                    </span>
                )}
            </button>

            {/* Dropdown de detalhes */}
            {showDetails && (
                <div className="absolute top-full left-0 mt-2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            Verificação de Integridade
                        </h4>
                        <button
                            onClick={() => setShowDetails(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {isVerifying ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                            Verificando...
                        </div>
                    ) : verificationResult ? (
                        <div className="space-y-3">
                            <div className={`flex items-start gap-2 p-2 rounded ${
                                verificationResult.valid 
                                    ? 'bg-green-50 text-green-800' 
                                    : 'bg-red-50 text-red-800'
                            }`}>
                                {verificationResult.valid ? (
                                    <ShieldCheck className="h-5 w-5 flex-shrink-0" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 flex-shrink-0" />
                                )}
                                <span className="text-sm">{verificationResult.message}</span>
                            </div>

                            {report.signed_hash_sha256 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Hash className="h-3 w-3" />
                                        Hash SHA-256 registrado
                                    </div>
                                    <code className="block text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded break-all">
                                        {report.signed_hash_sha256}
                                    </code>
                                </div>
                            )}

                            {report.signed_by && (
                                <p className="text-xs text-gray-500">
                                    Assinado por: {report.signed_by}
                                </p>
                            )}
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
