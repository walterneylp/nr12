
import { useState, useEffect } from 'react';
import { Calculator, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface SafetyDistanceResult {
    S: number; // Distância de segurança em mm
    S_min: number; // Distância mínima (100mm ou 0mm)
    S_final: number; // Distância final a ser utilizada
    isValid: boolean;
    message: string;
}

export function SafetyDistanceCalculator() {
    // Parâmetros de entrada
    const [K, setK] = useState<number>(2000); // Velocidade de aproximação (mm/s) - padrão: 2000
    const [T, setT] = useState<number>(0.5); // Tempo de parada da máquina (s)
    const [C, setC] = useState<number>(850); // Penetração (mm) - padrão: 850 para cortina de luz
    const [hasBeamSync, setHasBeamSync] = useState<boolean>(false);
    const [resolution, setResolution] = useState<number>(30); // Resolução em mm (dedo=14, mão=30, corpo=50+)

    const [result, setResult] = useState<SafetyDistanceResult | null>(null);

    // Fórmula: S = (K × T) + C
    // Onde:
    // S = distância mínima de segurança (mm)
    // K = velocidade de aproximação do corpo ou partes do corpo (mm/s) - 2000 para braço
    // T = tempo total de parada da máquina (s)
    // C = penetração adicional (mm)

    useEffect(() => {
        calculate();
    }, [K, T, C, hasBeamSync, resolution]);

    const calculate = () => {
        // C varia conforme a resolução
        let calculatedC = C;
        if (!hasBeamSync) {
            if (resolution <= 14) {
                calculatedC = 0; // Dedo
            } else if (resolution <= 30) {
                calculatedC = 850 - (30 - resolution) * 10; // Mão - interpolação
            } else {
                calculatedC = 850; // Corpo
            }
        } else {
            calculatedC = 0; // Com sincronização de feixe
        }

        const S_calculated = (K * T) + calculatedC;
        const S_min = 100; // Distância mínima absoluta conforme ISO 13855
        const S_final = Math.max(S_calculated, S_min);

        let message = '';
        let isValid = true;

        if (S_final < 100) {
            message = 'Atenção: A distância calculada é menor que 100mm. A norma ISO 13855 estabelece 100mm como distância mínima.';
            isValid = false;
        } else if (S_final > 500 && resolution <= 14) {
            message = 'Atenção: Para dispositivos de detecção de dedos (≤14mm), a distância não deve exceder 500mm conforme ISO 13855.';
            isValid = false;
        } else if (T > 0.5 && resolution <= 30) {
            message = 'Atenção: O tempo de parada da máquina é alto. Considere otimizar o sistema de segurança.';
            isValid = true;
        } else {
            message = 'Distância de segurança calculada conforme ISO 13855.';
            isValid = true;
        }

        setResult({
            S: Math.round(S_calculated),
            S_min: S_min,
            S_final: Math.round(S_final),
            isValid,
            message
        });
    };

    const getResolutionLabel = (res: number) => {
        if (res <= 14) return 'Dedo (≤14mm)';
        if (res <= 30) return 'Mão (≤30mm)';
        return 'Corpo (>30mm)';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Calculator className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        Calculadora ISO 13855
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Distância de Segurança (S = K × T + C)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Parâmetros de entrada */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Velocidade de Aproximação (K)
                        </label>
                        <select
                            value={K}
                            onChange={(e) => setK(Number(e.target.value))}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value={1600}>1600 mm/s - Corpo inteiro (caminhada)</option>
                            <option value={2000}>2000 mm/s - Braço/Parte do corpo (padrão)</option>
                            <option value={2500}>2500 mm/s - Movimento rápido</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            2000 mm/s = valor padrão para braço
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tempo de Parada (T) - segundos
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            value={T}
                            onChange={(e) => setT(Number(e.target.value))}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Tempo total desde o acionamento até a parada completa
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Resolução do Dispositivo
                        </label>
                        <select
                            value={resolution}
                            onChange={(e) => setResolution(Number(e.target.value))}
                            className="w-full rounded-md border border-gray-300 shadow-sm p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            <option value={14}>14mm - Detecção de dedo</option>
                            <option value={30}>30mm - Detecção de mão</option>
                            <option value={50}>50mm - Detecção de braço/corpo</option>
                            <option value={90}>90mm - Detecção de corpo</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <input
                            type="checkbox"
                            id="beamSync"
                            checked={hasBeamSync}
                            onChange={(e) => setHasBeamSync(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="beamSync" className="text-sm text-gray-700 dark:text-gray-300">
                            Possui sincronização de feixe (C = 0)
                        </label>
                    </div>
                </div>

                {/* Resultado */}
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                        Resultado do Cálculo
                    </h4>

                    {result && (
                        <div className="space-y-4">
                            <div className={`p-4 rounded-lg ${result.isValid ? 'bg-green-100 dark:bg-green-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {result.isValid ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                    )}
                                    <span className={`font-bold text-2xl ${result.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                                        {result.S_final} mm
                                    </span>
                                </div>
                                <p className={`text-sm ${result.isValid ? 'text-green-700' : 'text-yellow-700'}`}>
                                    Distância de segurança mínima
                                </p>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">Fórmula:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">S = (K × T) + C</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">K × T:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{Math.round(K * T)} mm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">C (Penetração):</span>
                                    <span className="font-mono text-gray-900 dark:text-white">
                                        {hasBeamSync ? '0 mm (com sincronização)' : 
                                         resolution <= 14 ? '0 mm (dedo)' : 
                                         resolution <= 30 ? `${850 - (30 - resolution) * 10} mm (mão)` : '850 mm (corpo)'}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">S calculado:</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{result.S} mm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600 dark:text-gray-400">S mínimo (norma):</span>
                                    <span className="font-mono text-gray-900 dark:text-white">{result.S_min} mm</span>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between font-bold">
                                    <span className="text-gray-900 dark:text-white">S final:</span>
                                    <span className="font-mono text-indigo-600">{result.S_final} mm</span>
                                </div>
                            </div>

                            <div className={`p-3 rounded-lg text-sm ${result.isValid ? 'bg-blue-50 text-blue-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                <Info className="inline h-4 w-4 mr-1" />
                                {result.message}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Informações adicionais */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-sm">
                <h5 className="font-medium text-indigo-900 dark:text-indigo-300 mb-2">
                    Referências Normativas
                </h5>
                <ul className="list-disc list-inside text-indigo-700 dark:text-indigo-400 space-y-1">
                    <li>ISO 13855:2010 - Posicionamento de dispositivos de proteção</li>
                    <li>NR-12 Anexo I - Dispositivos de parada de emergência</li>
                    <li>Fórmula: S = (K × T) + C</li>
                    <li>Distância mínima absoluta: 100 mm</li>
                </ul>
            </div>
        </div>
    );
}
