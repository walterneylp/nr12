
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { riskRepository } from '../../../../infrastructure/repositories/riskRepository';
import { HRNCalculator } from '../../../components/HRNCalculator';
import { ImageUpload } from '../../../components/ImageUpload';
import { HazardSelect } from '../../../components/HazardSelect';
import type { RiskEntry, RiskLevel } from '../../../../domain/types';

interface RiskEntryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    assessmentId: string;
    tenantId: string;
    entryToEdit?: RiskEntry | null;
}

export function RiskEntryFormModal({ isOpen, onClose, onSuccess, assessmentId, tenantId, entryToEdit }: RiskEntryFormModalProps) {
    const [hazard, setHazard] = useState(() => entryToEdit?.hazard || '');
    const [location, setLocation] = useState(() => entryToEdit?.hazard_location || '');
    const [consequence, setConsequence] = useState(() => entryToEdit?.possible_consequence || '');
    const [photos, setPhotos] = useState<string[]>(() => entryToEdit?.photos || []);

    // HRN State
    const [hrnValues, setHrnValues] = useState(() => {
        if (entryToEdit) {
            return {
                severity: entryToEdit.hrn_severity,
                probability: entryToEdit.hrn_probability,
                frequency: entryToEdit.hrn_frequency,
                number_of_persons: 1,
                hrn: entryToEdit.hrn_number,
                riskLevel: entryToEdit.risk_level
            };
        }
        return {
            severity: 0.1,
            probability: 0.033,
            frequency: 0.1,
            number_of_persons: 1,
            hrn: 0.003,
            riskLevel: 'ACEITAVEL' as RiskLevel
        };
    });

    const [safetyCategory, setSafetyCategory] = useState(() => entryToEdit?.safety_category || '');
    const [performanceLevel, setPerformanceLevel] = useState(() => entryToEdit?.performance_level || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Effect only for clearing error when opening (entryToEdit dependency removed as we remount)
    useEffect(() => {
        setError(null);
    }, []);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                assessment_id: assessmentId,
                tenant_id: tenantId,
                hazard,
                hazard_location: location,
                possible_consequence: consequence,
                hrn_severity: hrnValues.severity,
                hrn_probability: hrnValues.probability,
                hrn_frequency: hrnValues.frequency,
                risk_level: hrnValues.riskLevel,
                safety_category: safetyCategory,
                performance_level: performanceLevel,
                photos: photos
            };

            if (entryToEdit) {
                await riskRepository.updateEntry(entryToEdit.id, payload);
            } else {
                await riskRepository.addEntry(payload);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar risco');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                                {entryToEdit ? 'Editar Risco' : 'Adicionar Novo Risco'}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column: Details */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2">Detalhes do Perigo</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Perigo *</label>
                                        <HazardSelect
                                            value={hazard}
                                            onChange={setHazard}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localização / Sistema</label>
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Ex: Zona de prensagem"
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidências Fotográficas</label>
                                        <ImageUpload
                                            value={photos}
                                            onChange={setPhotos}
                                            maxFiles={3}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Consequência Possível</label>
                                        <textarea
                                            rows={3}
                                            value={consequence}
                                            onChange={(e) => setConsequence(e.target.value)}
                                            placeholder="Ex: Amputação de dedos em caso de acesso inadvertido..."
                                            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Right Column: Calculator */}
                                <div className="space-y-4">
                                    <h4 className="font-medium text-gray-900 dark:text-white border-b pb-2">Cálculo HRN</h4>
                                    <HRNCalculator
                                        initialValues={hrnValues}
                                        onChange={(vals) => setHrnValues(vals)}
                                    />
                                </div>
                            </div>

                            <div className="mt-8 sm:flex sm:flex-row-reverse">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                                >
                                    {loading ? 'Salvando...' : 'Salvar Risco'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
