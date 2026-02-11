
import { useState, useEffect } from 'react';
import { calculateHRN, classifyRisk } from '../../domain/logic/hrn';
import type { RiskLevel } from '../../domain/types';

interface HRNCalculatorProps {
    initialValues?: {
        severity: number;
        probability: number;
        frequency: number;
        number_of_persons: number;
    };
    onChange: (values: {
        severity: number;
        probability: number;
        frequency: number;
        number_of_persons: number;
        hrn: number;
        riskLevel: RiskLevel;
    }) => void;
    readOnly?: boolean;
}

export function HRNCalculator({ initialValues, onChange, readOnly = false }: HRNCalculatorProps) {
    const [severity, setSeverity] = useState(initialValues?.severity || 0.1);
    const [probability, setProbability] = useState(initialValues?.probability || 0.033);
    const [frequency, setFrequency] = useState(initialValues?.frequency || 0.1);
    const [numberOfPersons, setNumberOfPersons] = useState(initialValues?.number_of_persons || 1);

    useEffect(() => {
        if (initialValues) {
            setSeverity(initialValues.severity);
            setProbability(initialValues.probability);
            setFrequency(initialValues.frequency);
            setNumberOfPersons(initialValues.number_of_persons);
        }
    }, [initialValues]);

    useEffect(() => {
        // Domain Logic 'calculateHRN' takes (s, p, f). ignoring np for now as per hrn.ts implementation.

        const hrn = calculateHRN(severity, probability, frequency);
        const riskLevel = classifyRisk(hrn);

        onChange({
            severity,
            probability,
            frequency,
            number_of_persons: numberOfPersons,
            hrn,
            riskLevel
        });
    }, [severity, probability, frequency, numberOfPersons]);

    const riskColor = (level: RiskLevel) => {
        switch (level) {
            case 'ACEITAVEL': return 'bg-green-100 text-green-800 border-green-200';
            case 'TOLERAVEL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'INACEITAVEL': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'CRITICO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const currentHRN = calculateHRN(severity, probability, frequency);
    const currentRiskLevel = classifyRisk(currentHRN);

    if (readOnly) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Classificação HRN</h4>
                <div className={`p-3 rounded border text-center font-bold ${riskColor(currentRiskLevel)}`}>
                    <div className="text-lg">{currentRiskLevel}</div>
                    <div className="text-xs font-normal opacity-80">HRN: {currentHRN.toFixed(2)}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>Sev: {severity}</div>
                    <div>Prob: {probability}</div>
                    <div>Freq: {frequency}</div>
                    <div>NP: {numberOfPersons}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Calculadora HRN</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Severity (DPH) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Severidade (DPH)
                    </label>
                    <select
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm text-sm"
                        value={severity}
                        onChange={(e) => setSeverity(Number(e.target.value))}
                    >
                        <option value={0.1}>0.1 - Arranhão/Contusão leve</option>
                        <option value={0.5}>0.5 - Dilaceração/Corte (Primeiros socorros)</option>
                        <option value={1}>1 - Fratura menor (Médico)</option>
                        <option value={2}>2 - Fratura maior/Perda de dedo (Hospital)</option>
                        <option value={4}>4 - Amputação de mão/membro ou Perda de olho</option>
                        <option value={8}>8 - Amputação de 2 membros/Fatalidade</option>
                        <option value={15}>15 - Fatalidade (Múltiplas)</option>
                    </select>
                </div>

                {/* Probability (LO) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Probabilidade (LO)
                    </label>
                    <select
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm text-sm"
                        value={probability}
                        onChange={(e) => setProbability(Number(e.target.value))}
                    >
                        <option value={0.033}>0.033 - Quase impossível</option>
                        <option value={1}>1 - Altamente improvável</option>
                        <option value={1.5}>1.5 - Improvável</option>
                        <option value={2.5}>2.5 - Possível</option>
                        <option value={4}>4 - Provável</option>
                        <option value={5}>5 - Muito provável</option>
                        <option value={8}>8 - Certo</option>
                        <option value={10}>10 - Inevitável</option>
                        <option value={15}>15 - Certo (se exposto)</option>
                    </select>
                </div>

                {/* Frequency (FE) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Frequência (FE)
                    </label>
                    <select
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm text-sm"
                        value={frequency}
                        onChange={(e) => setFrequency(Number(e.target.value))}
                    >
                        <option value={0.1}>0.1 - Infrequente (Anual)</option>
                        <option value={0.2}>0.2 - Mensal</option>
                        <option value={1}>1 - Semanal</option>
                        <option value={1.5}>1.5 - Diário</option>
                        <option value={2.5}>2.5 - Por hora</option>
                        <option value={4}>4 - Constante (&gt; 10min)</option>
                        <option value={5}>5 - Constante (Toda operação)</option>
                    </select>
                </div>

                {/* Number of Persons (NP) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nº Pessoas (NP)
                    </label>
                    <select
                        className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm text-sm"
                        value={numberOfPersons}
                        onChange={(e) => setNumberOfPersons(Number(e.target.value))}
                    >
                        <option value={1}>1 - 1-2 pessoas</option>
                        <option value={2}>2 - 3-7 pessoas</option>
                        <option value={4}>4 - 8-15 pessoas</option>
                        <option value={8}>8 - 16-50 pessoas</option>
                        <option value={12}>12 - 50+ pessoas</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">*Não utilizado no cálculo HRN padrão desta versão</p>
                </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                    <span className="text-gray-500 text-sm">Resultado HRN:</span>
                    <span className="ml-2 text-xl font-bold text-gray-800 dark:text-white">{currentHRN.toFixed(2)}</span>
                </div>
                <div className={`px-4 py-2 rounded font-bold border ${riskColor(currentRiskLevel)}`}>
                    {currentRiskLevel}
                </div>
            </div>
        </div>
    );
}
