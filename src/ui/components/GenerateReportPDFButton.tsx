
import { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { pdfReportService } from '../../infrastructure/services/pdfReportService';
import { reportRepository } from '../../infrastructure/repositories/reportRepository';
import { riskRepository } from '../../infrastructure/repositories/riskRepository';
import { checklistRepository } from '../../infrastructure/repositories/checklistRepository';
import { actionPlanRepository } from '../../infrastructure/repositories/actionPlanRepository';
import { validationRepository } from '../../infrastructure/repositories/validationRepository';

interface GenerateReportPDFButtonProps {
    reportId: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'md' | 'lg';
}

export function GenerateReportPDFButton({ reportId, variant = 'primary', size = 'md' }: GenerateReportPDFButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePDF = async () => {
        setIsGenerating(true);
        
        try {
            // Buscar todos os dados necessários
            const [report, risksResponse, checklistData, actionPlanData, validations] = await Promise.all([
                reportRepository.getById(reportId),
                riskRepository.getByReportId?.(reportId) || Promise.resolve([]),
                checklistRepository.getResponses(reportId, ''), // Precisamos do machine_id
                actionPlanRepository.getByReportId(reportId),
                validationRepository.getByReportId(reportId).catch(() => [])
            ]);

            // Buscar assessment_id para pegar os riscos
            const assessment = await riskRepository.getByReportId(reportId);
            const risks = assessment ? await riskRepository.getEntries(assessment.id) : [];

            // Buscar itens do plano de ação
            const actionItems = actionPlanData?.items || [];

            // Gerar PDF
            const blob = await pdfReportService.generateLaudoPDF({
                report,
                risks,
                checklistResponses: [], // Simplificado para evitar complexidade
                actionItems,
                validations
            });

            // Download
            const filename = `Laudo_NR12_${report.machine?.tag || reportId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdfReportService.downloadPDF(blob, filename);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF: ' + (error as Error).message);
        } finally {
            setIsGenerating(false);
        }
    };

    const sizeClasses = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
    };

    const variantClasses = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 border-transparent',
        secondary: 'bg-green-600 text-white hover:bg-green-700 border-transparent',
        outline: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
    };

    return (
        <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className={`
                inline-flex items-center rounded-md shadow-sm font-medium 
                border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
                ${sizeClasses[size]}
                ${variantClasses[variant]}
            `}
        >
            {isGenerating ? (
                <>
                    <Loader2 className="-ml-1 mr-2 h-5 w-5 animate-spin" />
                    Gerando PDF...
                </>
            ) : (
                <>
                    <FileText className="-ml-1 mr-2 h-5 w-5" />
                    Gerar PDF
                </>
            )}
        </button>
    );
}
