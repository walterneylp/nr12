import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    X,
    FileText,
    Upload,
    Shield,
    CheckCircle,
    AlertTriangle,
    FileCheck,
    Lock,
    Hash,
    Calendar,
    Loader2
} from 'lucide-react';
import { reportRepository } from '../../../../infrastructure/repositories/reportRepository';
import { supabase } from '../../../../infrastructure/supabase';
import type { Report } from '../../../../domain/types';

interface ReportSigningModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: Report & { client?: { name: string }; machine?: { name: string; tag: string } };
}

// Função para calcular hash SHA-256 do arquivo
async function calculateFileHash(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function ReportSigningModal({ isOpen, onClose, report }: ReportSigningModalProps) {
    const queryClient = useQueryClient();
    const [step, setStep] = useState<'config' | 'upload' | 'confirm'>('config');
    const [artNumber, setArtNumber] = useState(report.art_number || '');
    const [artFile, setArtFile] = useState<File | null>(null);
    const [signedPdfFile, setSignedPdfFile] = useState<File | null>(null);
    const [validityMonths, setValidityMonths] = useState(report.validity_months || 12);
    const [validFrom, setValidFrom] = useState(report.valid_from || new Date().toISOString().split('T')[0]);
    const [uploadProgress, setUploadProgress] = useState<{ art?: number; pdf?: number }>({});
    const [hashSha256, setHashSha256] = useState('');
    
    const artInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef = useRef<HTMLInputElement>(null);

    const signMutation = useMutation({
        mutationFn: async () => {
            if (!signedPdfFile) throw new Error('PDF assinado é obrigatório');

            // Calcular hash primeiro (não depende de storage)
            const hash = await calculateFileHash(signedPdfFile);
            setHashSha256(hash);

            // 1. Tentar upload da ART (se existir)
            let artFileId: string | undefined;
            if (artFile) {
                try {
                    const artPath = `${report.tenant_id}/reports/${report.id}/art/${Date.now()}_${artFile.name}`;
                    const { error: artError } = await supabase.storage
                        .from('documents')
                        .upload(artPath, artFile, {
                            upsert: true
                        });
                    
                    if (!artError) {
                        artFileId = artPath;
                        setUploadProgress(prev => ({ ...prev, art: 100 }));
                    }
                } catch (e) {
                    console.warn('Falha ao upload ART:', e);
                    // Continua mesmo sem a ART
                }
            }

            // 2. Tentar upload do PDF assinado
            let pdfPath: string | undefined;
            try {
                pdfPath = `${report.tenant_id}/reports/${report.id}/signed/${Date.now()}_${signedPdfFile.name}`;
                const { error: pdfError } = await supabase.storage
                    .from('documents')
                    .upload(pdfPath, signedPdfFile, {
                        upsert: true
                    });
                
                if (pdfError) {
                    console.warn('Falha no upload do PDF:', pdfError);
                    pdfPath = undefined; // Continua sem o arquivo
                } else {
                    setUploadProgress(prev => ({ ...prev, pdf: 100 }));
                }
            } catch (e) {
                console.warn('Falha ao upload PDF:', e);
                // Continua mesmo sem o arquivo
            }

            // 3. Atualizar validade
            await reportRepository.setValidity(report.id, validFrom, validityMonths);

            // 4. Assinar o laudo (mesmo sem upload, guarda o hash)
            return reportRepository.signReport(report.id, {
                artNumber: artNumber || undefined,
                artFileId,
                signedPdfFileId: pdfPath,
                hashSha256: hash,
                signatureMode: 'EXTERNAL_UPLOAD',
                signatureMetadata: {
                    originalName: signedPdfFile.name,
                    size: signedPdfFile.size,
                    type: signedPdfFile.type,
                    hashCalculated: true,
                    fileUploaded: !!pdfPath,
                    uploadedAt: new Date().toISOString()
                }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['report', report.id] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
            onClose();
            setStep('config');
            setArtFile(null);
            setSignedPdfFile(null);
            setHashSha256('');
            setUploadProgress({});
        },
        onError: (error: any) => {
            alert('Erro ao assinar laudo: ' + error.message);
        }
    });

    if (!isOpen) return null;

    const canSign = artNumber || artFile; // ART é opcional no MVP, mas recomendada

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    {/* Header */}
                    <div className="bg-indigo-600 px-4 py-3 sm:px-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-white flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Assinatura do Laudo
                            </h3>
                            <button onClick={onClose} className="text-indigo-200 hover:text-white">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <p className="text-indigo-100 text-sm mt-1">
                            {report.title} - {report.client?.name}
                        </p>
                    </div>

                    <div className="px-4 py-5 sm:p-6">
                        {/* Alerta de imutabilidade */}
                        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <div className="flex gap-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                <div>
                                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        Atenção: Ação Irreversível
                                    </h4>
                                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                        Após assinar, o laudo será bloqueado para edição. 
                                        Verifique todos os dados antes de prosseguir.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step indicator */}
                        <div className="flex items-center justify-center mb-6">
                            {[
                                { key: 'config', label: 'Configuração', icon: Calendar },
                                { key: 'upload', label: 'Documentos', icon: Upload },
                                { key: 'confirm', label: 'Confirmação', icon: CheckCircle }
                            ].map((s, idx) => (
                                <div key={s.key} className="flex items-center">
                                    <button
                                        onClick={() => setStep(s.key as any)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            step === s.key
                                                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        <s.icon className="h-4 w-4" />
                                        {s.label}
                                    </button>
                                    {idx < 2 && (
                                        <div className="w-8 h-px bg-gray-300 mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Step Content */}
                        {step === 'config' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Número da ART
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Ex: 1234567890"
                                        value={artNumber}
                                        onChange={(e) => setArtNumber(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Anotação de Responsabilidade Técnica (opcional no MVP)
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Data Início da Validade *
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={validFrom}
                                            onChange={(e) => setValidFrom(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Prazo de Validade (meses) *
                                        </label>
                                        <select
                                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            value={validityMonths}
                                            onChange={(e) => setValidityMonths(Number(e.target.value))}
                                        >
                                            <option value={6}>6 meses</option>
                                            <option value={12}>12 meses</option>
                                            <option value={24}>24 meses</option>
                                            <option value={36}>36 meses</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        <strong>Validade calculada:</strong>{' '}
                                        {new Date(validFrom).toLocaleDateString('pt-BR')} até{' '}
                                        {new Date(new Date(validFrom).setMonth(new Date(validFrom).getMonth() + validityMonths)).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        )}

                        {step === 'upload' && (
                            <div className="space-y-6">
                                {/* Upload da ART */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Arquivo da ART (opcional)
                                    </label>
                                    <div
                                        onClick={() => artInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 transition-colors"
                                    >
                                        {artFile ? (
                                            <div className="flex items-center justify-center gap-2 text-green-600">
                                                <FileCheck className="h-5 w-5" />
                                                <span>{artFile.name}</span>
                                            </div>
                                        ) : (
                                            <>
                                                <FileText className="h-8 w-8 mx-auto text-gray-400" />
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    Clique para anexar a ART
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    PDF, JPG ou PNG (max 10MB)
                                                </p>
                                            </>
                                        )}
                                        <input
                                            ref={artInputRef}
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => setArtFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    {uploadProgress.art && (
                                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${uploadProgress.art}%` }}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Upload do PDF assinado */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        PDF do Laudo Assinado *
                                    </label>
                                    <div
                                        onClick={() => pdfInputRef.current?.click()}
                                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                                            signedPdfFile
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500'
                                        }`}
                                    >
                                        {signedPdfFile ? (
                                            <div className="flex items-center justify-center gap-2 text-green-600">
                                                <FileCheck className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">{signedPdfFile.name}</p>
                                                    <p className="text-xs">
                                                        Hash SHA-256 será calculado automaticamente
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    Clique para fazer upload do PDF assinado
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    Somente PDF (max 50MB)
                                                </p>
                                            </>
                                        )}
                                        <input
                                            ref={pdfInputRef}
                                            type="file"
                                            accept=".pdf"
                                            className="hidden"
                                            onChange={(e) => setSignedPdfFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    {uploadProgress.pdf && (
                                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-green-500 transition-all"
                                                style={{ width: `${uploadProgress.pdf}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step === 'confirm' && (
                            <div className="space-y-4">
                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        Resumo da Assinatura
                                    </h4>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-500">ART:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {artNumber || 'Não informada'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Arquivo ART:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {artFile ? artFile.name : 'Não anexado'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Validade:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {validityMonths} meses a partir de {new Date(validFrom).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">PDF Assinado:</span>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {signedPdfFile?.name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {hashSha256 && (
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                                        <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                                            <Hash className="h-4 w-4" />
                                            <span className="text-sm font-medium">
                                                Hash SHA-256 calculado
                                            </span>
                                        </div>
                                        <code className="block mt-2 text-xs bg-white dark:bg-gray-800 p-2 rounded break-all">
                                            {hashSha256}
                                        </code>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                                    <Lock className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800 dark:text-red-200">
                                        <p className="font-medium">Confirmação de bloqueio</p>
                                        <p className="mt-1">
                                            Ao confirmar, o laudo será permanentemente bloqueado para edições.
                                            Certifique-se de que todos os dados estão corretos.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex justify-between">
                        <button
                            onClick={() => {
                                if (step === 'config') onClose();
                                else if (step === 'upload') setStep('config');
                                else setStep('upload');
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50"
                        >
                            {step === 'config' ? 'Cancelar' : 'Voltar'}
                        </button>

                        {step === 'config' && (
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
                            >
                                Próximo
                            </button>
                        )}

                        {step === 'upload' && (
                            <button
                                onClick={() => setStep('confirm')}
                                disabled={!signedPdfFile}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                                Próximo
                            </button>
                        )}

                        {step === 'confirm' && (
                            <button
                                onClick={() => signMutation.mutate()}
                                disabled={signMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {signMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Assinando...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Confirmar Assinatura
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
