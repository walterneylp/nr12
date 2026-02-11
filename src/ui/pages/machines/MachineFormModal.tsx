
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Factory, Settings, MapPin } from 'lucide-react';
import { machineRepository } from '../../../infrastructure/repositories/machineRepository';
import { clientRepository } from '../../../infrastructure/repositories/clientRepository';
import { siteRepository } from '../../../infrastructure/repositories/siteRepository';
import type { Machine, MachineType, EnergySource, NR12Annex, MachineCriticality } from '../../../domain/types';

type TabType = 'basic' | 'technical' | 'location' | 'docs';

interface MachineFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    machineToEdit?: Machine | null;
}

const MACHINE_TYPES = [
    { value: 'CONFORMACAO', label: 'Conformação (Prensas, Dobradeiras)', icon: '🔧' },
    { value: 'ROTATIVA', label: 'Rotativa (Tornos, Fresas)', icon: '⚙️' },
    { value: 'CORTE', label: 'Corte (Serras, Guilhotinas)', icon: '✂️' },
    { value: 'ELEVACAO', label: 'Elevação (Guindastes, Pontes)', icon: '🏗️' },
    { value: 'COZINHA', label: 'Cozinha Industrial', icon: '🍳' },
    { value: 'EMBALAGEM', label: 'Embalagem', icon: '📦' },
    { value: 'INJECAO', label: 'Injeção (Plástico)', icon: '🏭' },
    { value: 'USINAGEM', label: 'Usinagem Geral', icon: '🔩' },
    { value: 'PRENSA', label: 'Prensa Hidráulica/Mecânica', icon: '⚡' },
    { value: 'TRANSPORTADOR', label: 'Transportador/Esteira', icon: '🔀' },
    { value: 'OUTROS', label: 'Outros', icon: '📋' },
];

const ENERGY_SOURCES: { value: EnergySource; label: string }[] = [
    { value: 'ELETRICA', label: 'Elétrica' },
    { value: 'PNEUMATICA', label: 'Pneumática' },
    { value: 'HIDRAULICA', label: 'Hidráulica' },
    { value: 'COMBUSTIVEL', label: 'Combustível' },
    { value: 'MANUAL', label: 'Manual' },
    { value: 'VAPOR', label: 'Vapor' },
];

const CRITICALITY_LEVELS: { value: MachineCriticality; label: string; color: string }[] = [
    { value: 'LOW', label: 'Baixa', color: 'bg-green-100 text-green-800' },
    { value: 'MEDIUM', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'HIGH', label: 'Alta', color: 'bg-orange-100 text-orange-800' },
    { value: 'CRITICAL', label: 'Crítica', color: 'bg-red-100 text-red-800' },
];

const NR12_ANNEXES: { value: NR12Annex; label: string }[] = [
    { value: 'I', label: 'I - Dispositivos de Parada de Emergência' },
    { value: 'II', label: 'II - Dispositivos de Enclausuramento' },
    { value: 'III', label: 'III - Dispositivos de Comando Bimanual' },
    { value: 'IV', label: 'IV - Dispositivos de Acionamento Mantido' },
    { value: 'V', label: 'V - Dispositivos de Acionamento por Dois Manipulos' },
    { value: 'VI', label: 'VI - Dispositivos de Acionamento por Pedal' },
    { value: 'VII', label: 'VII - Dispositivos de Acionamento por Barra' },
    { value: 'VIII', label: 'VIII - Dispositivos de Intertravamento' },
    { value: 'IX', label: 'IX - Dispositivos de Bloqueio' },
    { value: 'X', label: 'X - Dispositivos Sensores de Presença' },
];

export function MachineFormModal({ isOpen, onClose, onSuccess, machineToEdit }: MachineFormModalProps) {
    const [activeTab, setActiveTab] = useState<TabType>('basic');
    
    // Basic Info
    const [clientId, setClientId] = useState('');
    const [siteId, setSiteId] = useState('');
    const [tag, setTag] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [machineType, setMachineType] = useState<MachineType>('OUTROS');
    const [criticality, setCriticality] = useState<MachineCriticality>('MEDIUM');
    
    // Fabricante
    const [manufacturer, setManufacturer] = useState('');
    const [model, setModel] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [year, setYear] = useState('');
    
    // Technical Specs
    const [power, setPower] = useState('');
    const [voltage, setVoltage] = useState('');
    const [frequency, setFrequency] = useState('');
    const [capacity, setCapacity] = useState('');
    const [limits, setLimits] = useState('');
    const [selectedEnergySources, setSelectedEnergySources] = useState<EnergySource[]>([]);
    const [selectedAnnexes, setSelectedAnnexes] = useState<NR12Annex[]>([]);
    
    // Location
    const [plantSector, setPlantSector] = useState('');
    const [productionLine, setProductionLine] = useState('');
    const [location, setLocation] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: clientRepository.getAll,
        enabled: isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const { data: sites } = useQuery({
        queryKey: ['sites', clientId],
        queryFn: () => siteRepository.getByClientId(clientId),
        enabled: !!clientId && isOpen,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (machineToEdit) {
            setClientId(machineToEdit.client_id);
            setSiteId(machineToEdit.site_id || '');
            setTag(machineToEdit.tag || '');
            setName(machineToEdit.name);
            setDescription(machineToEdit.description || '');
            setMachineType(machineToEdit.machine_type || '');
            setCriticality(machineToEdit.criticality || 'MEDIUM');
            
            setManufacturer(machineToEdit.manufacturer || '');
            setModel(machineToEdit.model || '');
            setSerialNumber(machineToEdit.serial_number || '');
            setYear(machineToEdit.year?.toString() || '');
            
            setPower(machineToEdit.power || '');
            setVoltage(machineToEdit.voltage || '');
            setFrequency(machineToEdit.frequency || '');
            setCapacity(machineToEdit.productivity_capacity || '');
            setLimits(machineToEdit.limits || '');
            setSelectedEnergySources(machineToEdit.energy_sources || []);
            setSelectedAnnexes(machineToEdit.applicable_annexes || []);
            
            setPlantSector(machineToEdit.plant_sector || '');
            setProductionLine(machineToEdit.production_line || '');
            setLocation(machineToEdit.location || '');
        } else {
            resetForm();
            setMachineType('OUTROS');
        }
        setError(null);
    }, [machineToEdit, isOpen]);

    const resetForm = () => {
        setClientId('');
        setSiteId('');
        setTag('');
        setName('');
        setDescription('');
        setMachineType('OUTROS');
        setCriticality('MEDIUM');
        setManufacturer('');
        setModel('');
        setSerialNumber('');
        setYear('');
        setPower('');
        setVoltage('');
        setFrequency('');
        setCapacity('');
        setLimits('');
        setSelectedEnergySources([]);
        setSelectedAnnexes([]);
        setPlantSector('');
        setProductionLine('');
        setLocation('');
        setActiveTab('basic');
    };

    const toggleEnergySource = (source: EnergySource) => {
        setSelectedEnergySources(prev =>
            prev.includes(source)
                ? prev.filter(s => s !== source)
                : [...prev, source]
        );
    };

    const toggleAnnex = (annex: NR12Annex) => {
        setSelectedAnnexes(prev =>
            prev.includes(annex)
                ? prev.filter(a => a !== annex)
                : [...prev, annex]
        );
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!clientId) {
            setError('Selecione um cliente.');
            setLoading(false);
            return;
        }

        if (machineType === 'OUTROS' && !machineToEdit) {
            // Tipo OUTROS é permitido, mas podemos alertar
            console.log('Tipo de máquina: OUTROS');
        }

        if (!tag.trim()) {
            setError('Informe a TAG de identificação da máquina.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                client_id: clientId,
                site_id: siteId || undefined,
                tag,
                name,
                description: description || undefined,
                machine_type: machineType,
                criticality,
                manufacturer: manufacturer || undefined,
                model: model || undefined,
                serial_number: serialNumber || undefined,
                year: year ? parseInt(year) : undefined,
                power: power || undefined,
                voltage: voltage || undefined,
                frequency: frequency || undefined,
                productivity_capacity: capacity || undefined,
                limits: limits || undefined,
                energy_sources: selectedEnergySources.length > 0 ? selectedEnergySources : undefined,
                applicable_annexes: selectedAnnexes.length > 0 ? selectedAnnexes : undefined,
                plant_sector: plantSector || undefined,
                production_line: productionLine || undefined,
                location: location || undefined,
            };

            if (machineToEdit) {
                await machineRepository.update(machineToEdit.id, payload);
            } else {
                await machineRepository.create(payload);
            }
            onSuccess();
            onClose();
            resetForm();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Erro ao salvar máquina');
        } finally {
            setLoading(false);
        }
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        { id: 'basic', label: 'Básico', icon: <Factory className="w-4 h-4" /> },
        { id: 'technical', label: 'Técnico', icon: <Settings className="w-4 h-4" /> },
        { id: 'location', label: 'Localização', icon: <MapPin className="w-4 h-4" /> },
    ];

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                </div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white dark:bg-gray-800">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                {machineToEdit ? 'Editar Máquina' : 'Nova Máquina'}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 dark:border-gray-700">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                                    }`}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                            {error && (
                                <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {/* Basic Tab */}
                                {activeTab === 'basic' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Cliente *
                                            </label>
                                            <select
                                                required
                                                value={clientId}
                                                onChange={(e) => {
                                                    setClientId(e.target.value);
                                                    setSiteId(''); // Reset site when client changes
                                                }}
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                            >
                                                <option value="">Selecione um cliente</option>
                                                {clients?.map((client) => (
                                                    <option key={client.id} value={client.id}>{client.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {clientId && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Local/Filial
                                                </label>
                                                <select
                                                    value={siteId}
                                                    onChange={(e) => setSiteId(e.target.value)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Selecione um local (opcional)</option>
                                                    {sites?.map((site) => (
                                                        <option key={site.id} value={site.id}>{site.name} - {site.city}</option>
                                                    ))}
                                                </select>
                                                {sites?.length === 0 && (
                                                    <p className="mt-1 text-xs text-yellow-600">
                                                        Nenhum local cadastrado para este cliente.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    TAG / Identificação *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={tag}
                                                    onChange={(e) => setTag(e.target.value.toUpperCase())}
                                                    placeholder="PLANTA-SETOR-001"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                                <p className="mt-1 text-xs text-gray-500">Ex: MATRIZ-PREN-001</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Nome da Máquina *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Descrição
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={2}
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Tipo da Máquina *
                                                </label>
                                                <select
                                                    required
                                                    value={machineType}
                                                    onChange={(e) => setMachineType(e.target.value as MachineType)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    <option value="">Selecione...</option>
                                                    {MACHINE_TYPES.map(type => (
                                                        <option key={type.value} value={type.value}>
                                                            {type.icon} {type.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Criticidade
                                                </label>
                                                <select
                                                    value={criticality}
                                                    onChange={(e) => setCriticality(e.target.value as MachineCriticality)}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                                >
                                                    {CRITICALITY_LEVELS.map(level => (
                                                        <option key={level.value} value={level.value}>
                                                            {level.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Fabricante</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Fabricante
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={manufacturer}
                                                        onChange={(e) => setManufacturer(e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Modelo
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={model}
                                                        onChange={(e) => setModel(e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Nº de Série
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={serialNumber}
                                                        onChange={(e) => setSerialNumber(e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                        Ano de Fabricação
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1900"
                                                        max={new Date().getFullYear()}
                                                        value={year}
                                                        onChange={(e) => setYear(e.target.value)}
                                                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Technical Tab */}
                                {activeTab === 'technical' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Potência
                                                </label>
                                                <input
                                                    type="text"
                                                    value={power}
                                                    onChange={(e) => setPower(e.target.value)}
                                                    placeholder="Ex: 15 kW / 20 HP"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Tensão (V)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={voltage}
                                                    onChange={(e) => setVoltage(e.target.value)}
                                                    placeholder="Ex: 380/220V"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Frequência (Hz)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={frequency}
                                                    onChange={(e) => setFrequency(e.target.value)}
                                                    placeholder="Ex: 60 Hz"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Capacidade Produtiva
                                            </label>
                                            <input
                                                type="text"
                                                value={capacity}
                                                onChange={(e) => setCapacity(e.target.value)}
                                                placeholder="Ex: 1000 peças/hora, 50 L/min"
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Fontes de Energia
                                            </label>
                                            <div className="flex flex-wrap gap-2">
                                                {ENERGY_SOURCES.map(source => (
                                                    <button
                                                        key={source.value}
                                                        type="button"
                                                        onClick={() => toggleEnergySource(source.value)}
                                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                                            selectedEnergySources.includes(source.value)
                                                                ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-300'
                                                                : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}
                                                    >
                                                        {source.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Limites da Máquina (ISO 12100)
                                            </label>
                                            <textarea
                                                value={limits}
                                                onChange={(e) => setLimits(e.target.value)}
                                                rows={3}
                                                placeholder="Descreva os limites espaciais, temporais, de carga, etc."
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Anexos NR-12 Aplicáveis
                                            </label>
                                            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                                                {NR12_ANNEXES.map(annex => (
                                                    <label key={annex.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 p-1 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAnnexes.includes(annex.value)}
                                                            onChange={() => toggleAnnex(annex.value)}
                                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{annex.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Location Tab */}
                                {activeTab === 'location' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Planta / Unidade
                                                </label>
                                                <input
                                                    type="text"
                                                    value={plantSector}
                                                    onChange={(e) => setPlantSector(e.target.value)}
                                                    placeholder="Ex: Matriz, Filial SP"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Setor / Linha
                                                </label>
                                                <input
                                                    type="text"
                                                    value={productionLine}
                                                    onChange={(e) => setProductionLine(e.target.value)}
                                                    placeholder="Ex: Linha de Prensas, Montagem"
                                                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Localização Específica
                                            </label>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => setLocation(e.target.value)}
                                                placeholder="Ex: Próximo à saída de emergência, Corredor B"
                                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            />
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4 mt-4">
                                            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                                                ID Sugerido
                                            </h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                {plantSector || 'PLANTA'}-{productionLine || 'SETOR'}-{tag || 'MAQ-001'}
                                            </p>
                                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                                Esta identificação será usada para geração do QR Code
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Footer */}
                                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        {activeTab === 'basic' && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('technical')}
                                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                                            >
                                                Próximo: Especificações Técnicas →
                                            </button>
                                        )}
                                        {activeTab === 'technical' && (
                                            <div className="flex gap-4">
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('basic')}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    ← Voltar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('location')}
                                                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                                                >
                                                    Próximo: Localização →
                                                </button>
                                            </div>
                                        )}
                                        {activeTab === 'location' && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveTab('technical')}
                                                className="text-gray-500 hover:text-gray-700"
                                            >
                                                ← Voltar
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Salvando...' : machineToEdit ? 'Atualizar' : 'Cadastrar'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
