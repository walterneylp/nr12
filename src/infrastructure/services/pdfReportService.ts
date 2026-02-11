
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Report, Client, Machine, RiskEntry, ChecklistResponse, ActionItem } from '../../domain/types';

interface ReportData {
    report: Report & { client: Client; machine: Machine };
    risks: RiskEntry[];
    checklistResponses: (ChecklistResponse & { requirement?: { item: string; description: string; group_name: string } })[];
    actionItems: ActionItem[];
    validations: any[];
}

export const pdfReportService = {
    async generateLaudoPDF(data: ReportData): Promise<Blob> {
        const { report, risks, checklistResponses, actionItems, validations } = data;
        
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = margin;

        // === CAPA ===
        doc.setFontSize(24);
        doc.setTextColor(79, 70, 229); // indigo-600
        doc.text('LAUDO TÉCNICO NR-12', pageWidth / 2, y, { align: 'center' });
        
        y += 15;
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Avaliação de Conformidade em Segurança de Máquinas', pageWidth / 2, y, { align: 'center' });
        
        y += 30;
        doc.setFontSize(12);
        doc.text(`Laudo Nº: ${report.id.substring(0, 8).toUpperCase()}`, margin, y);
        y += 10;
        doc.text(`Data: ${new Date(report.created_at || '').toLocaleDateString('pt-BR')}`, margin, y);
        y += 10;
        doc.text(`Status: ${this.translateStatus(report.status)}`, margin, y);
        
        y += 25;
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text('1. IDENTIFICAÇÃO', margin, y);
        
        y += 10;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Empresa: ${report.client.name}`, margin, y);
        y += 7;
        doc.text(`Máquina: ${report.machine.name}`, margin, y);
        y += 7;
        doc.text(`TAG: ${report.machine.tag || 'N/A'}`, margin, y);
        y += 7;
        doc.text(`Fabricante: ${report.machine.manufacturer || 'N/A'}`, margin, y);
        y += 7;
        doc.text(`Tipo: ${report.machine.machine_type}`, margin, y);
        
        // === NOVA PÁGINA - RESUMO EXECUTIVO ===
        doc.addPage();
        y = margin;
        
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text('2. RESUMO EXECUTIVO', margin, y);
        
        y += 12;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const resumo = this.generateResumo(data);
        const splitResumo = doc.splitTextToSize(resumo, pageWidth - 2 * margin);
        doc.text(splitResumo, margin, y);
        
        // === NOVA PÁGINA - APRECIAÇÃO DE RISCOS ===
        if (risks.length > 0) {
            doc.addPage();
            y = margin;
            
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text('3. APRECIAÇÃO DE RISCOS (ISO 12100)', margin, y);
            
            y += 12;
            
            // Tabela de riscos
            const risksData = risks.map(r => [
                r.hazard.substring(0, 30) + (r.hazard.length > 30 ? '...' : ''),
                r.risk_level,
                r.hrn_number.toString(),
                r.required_category || '-'
            ]);
            
            (doc as any).autoTable({
                startY: y,
                head: [['Perigo', 'Nível', 'HRN', 'Categoria']],
                body: risksData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        }
        
        // === NOVA PÁGINA - CHECKLIST ===
        if (checklistResponses.length > 0) {
            doc.addPage();
            y = margin;
            
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text('4. CHECKLIST NR-12', margin, y);
            
            y += 12;
            
            // Agrupar por status
            const conformes = checklistResponses.filter(r => r.status === 'COMPLIANT');
            const naoConformes = checklistResponses.filter(r => r.status === 'NONCOMPLIANT');
            const naoAplicaveis = checklistResponses.filter(r => r.status === 'NOT_APPLICABLE');
            
            doc.setFontSize(11);
            doc.text(`Conformes: ${conformes.length}`, margin, y);
            y += 7;
            doc.text(`Não Conformes: ${naoConformes.length}`, margin, y);
            y += 7;
            doc.text(`Não Aplicáveis: ${naoAplicaveis.length}`, margin, y);
            
            if (naoConformes.length > 0) {
                y += 12;
                doc.setFontSize(12);
                doc.setTextColor(220, 38, 38); // red-600
                doc.text('Itens Não Conformes:', margin, y);
                y += 8;
                
                doc.setTextColor(0, 0, 0);
                naoConformes.slice(0, 10).forEach((item) => {
                    const desc = item.requirement?.description || item.requirement_id;
                    const line = `- ${desc.substring(0, 60)}${desc.length > 60 ? '...' : ''}`;
                    doc.text(line, margin + 5, y);
                    y += 6;
                });
                
                if (naoConformes.length > 10) {
                    y += 3;
                    doc.text(`... e mais ${naoConformes.length - 10} itens`, margin + 5, y);
                }
            }
        }
        
        // === NOVA PÁGINA - PLANO DE AÇÃO ===
        if (actionItems.length > 0) {
            doc.addPage();
            y = margin;
            
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text('5. PLANO DE AÇÃO', margin, y);
            
            y += 12;
            
            const actionsData = actionItems.map(a => [
                a.description.substring(0, 40) + (a.description.length > 40 ? '...' : ''),
                this.translatePriority(a.priority),
                this.translateStatus(a.status),
                `${a.due_days} dias`
            ]);
            
            (doc as any).autoTable({
                startY: y,
                head: [['Ação', 'Prioridade', 'Status', 'Prazo']],
                body: actionsData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        }
        
        // === NOVA PÁGINA - VALIDAÇÃO ===
        if (validations && validations.length > 0) {
            doc.addPage();
            y = margin;
            
            doc.setFontSize(16);
            doc.setTextColor(79, 70, 229);
            doc.text('6. VALIDAÇÃO E COMISSIONAMENTO', margin, y);
            
            y += 12;
            
            const validationsData = validations.map(v => [
                this.translateTestType(v.test_type),
                v.passed ? 'Aprovado' : 'Reprovado',
                v.tested_by || '-'
            ]);
            
            (doc as any).autoTable({
                startY: y,
                head: [['Teste', 'Resultado', 'Responsável']],
                body: validationsData,
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] },
                styles: { fontSize: 9 },
                margin: { left: margin, right: margin }
            });
        }
        
        // === CONCLUSÃO ===
        doc.addPage();
        y = margin;
        
        doc.setFontSize(16);
        doc.setTextColor(79, 70, 229);
        doc.text('7. CONCLUSÃO', margin, y);
        
        y += 12;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        
        const conclusao = this.generateConclusao(data);
        const splitConclusao = doc.splitTextToSize(conclusao, pageWidth - 2 * margin);
        doc.text(splitConclusao, margin, y);
        
        // === ASSINATURA ===
        const finalY = doc.internal.pageSize.getHeight() - 60;
        
        doc.setFontSize(11);
        doc.text('_'.repeat(50), pageWidth / 2, finalY, { align: 'center' });
        doc.text('Assinatura do Responsável Técnico', pageWidth / 2, finalY + 8, { align: 'center' });
        doc.text('Eng. de Segurança do Trabalho', pageWidth / 2, finalY + 15, { align: 'center' });
        
        return doc.output('blob');
    },
    
    translateStatus(status: string): string {
        const map: Record<string, string> = {
            'DRAFT': 'Rascunho',
            'IN_REVIEW': 'Em Revisão',
            'READY': 'Pronto',
            'SIGNED': 'Assinado',
            'ARCHIVED': 'Arquivado',
            'OPEN': 'Aberto',
            'IN_PROGRESS': 'Em Andamento',
            'DONE': 'Concluído',
            'VERIFIED': 'Verificado'
        };
        return map[status] || status;
    },
    
    translatePriority(priority: string): string {
        const map: Record<string, string> = {
            'CRITICAL': 'Crítica',
            'HIGH': 'Alta',
            'MEDIUM': 'Média',
            'LOW': 'Baixa',
            'IMPROVEMENT': 'Melhoria'
        };
        return map[priority] || priority;
    },
    
    translateTestType(type: string): string {
        const map: Record<string, string> = {
            'EMERGENCY_STOP': 'Parada de Emergência',
            'INTERLOCK': 'Intertravamento',
            'LIGHT_CURTAIN': 'Cortina de Luz',
            'BIMANUAL': 'Comando Bimanual',
            'SCANNER': 'Scanner',
            'OTHERS': 'Outros'
        };
        return map[type] || type;
    },
    
    translateRiskLevel(level: string): string {
        const map: Record<string, string> = {
            'ACEITAVEL': 'Aceitável',
            'TOLERAVEL': 'Tolerável',
            'INACEITAVEL': 'Inaceitável',
            'CRITICO': 'Crítico'
        };
        return map[level] || level;
    },
    
    generateResumo(data: ReportData): string {
        const { report, risks } = data;
        const criticalRisks = risks.filter(r => r.risk_level === 'CRITICO' || r.risk_level === 'INACEITAVEL');
        
        let resumo = `O presente laudo técnico foi elaborado em conformidade com a Norma Regulamentadora nº 12 (NR-12) `;
        resumo += `do Ministério do Trabalho e Emprego, objetivando avaliar a conformidade da máquina `;
        resumo += `"${report.machine.name}" (TAG: ${report.machine.tag || 'N/A'}), `;
        resumo += `localizada nas dependências da empresa ${report.client.name}. `;
        
        if (criticalRisks.length > 0) {
            resumo += `Foram identificados ${criticalRisks.length} riscos classificados como Críticos ou Inaceitáveis, `;
            resumo += `que demandam ações corretivas imediatas.`;
        } else {
            resumo += `Não foram identificados riscos críticos. A máquina apresenta condições adequadas de segurança.`;
        }
        
        return resumo;
    },
    
    generateConclusao(data: ReportData): string {
        const { report, checklistResponses } = data;
        const naoConformes = checklistResponses.filter(r => r.status === 'NONCOMPLIANT');
        
        let conclusao = `Após análise técnica realizada na máquina ${report.machine.name}, `;
        
        if (naoConformes.length === 0) {
            conclusao += `conclui-se que a mesma encontra-se em conformidade com os requisitos da NR-12. `;
            conclusao += `Foi verificado que todos os dispositivos de segurança estão instalados e funcionando corretamente. `;
            conclusao += `Recomenda-se manter as inspeções periódicas conforme estabelecido na norma.`;
        } else {
            conclusao += `identificou-se a necessidade de adequações para plena conformidade com a NR-12. `;
            conclusao += `Foram registrados ${naoConformes.length} itens não conformes que devem ser corrigidos `;
            conclusao += `conforme o Plano de Ação estabelecido. `;
            conclusao += `A operação da máquina deve ser suspensa até a implementação das medidas de segurança obrigatórias.`;
        }
        
        conclusao += `\n\nEste laudo tem validade de ${report.validity_months || 12} meses a partir da data de emissão, `;
        conclusao += `devendo ser reavaliado ao término deste período ou sempre que ocorrerem alterações `;
        conclusao += `significativas na máquina ou em seu modo de operação.`;
        
        return conclusao;
    },
    
    downloadPDF(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
