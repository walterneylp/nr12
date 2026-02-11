
import { useState, useEffect, useRef } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { riskRepository } from '../../infrastructure/repositories/riskRepository';

interface HazardSelectProps {
    value: string;
    onChange: (value: string) => void;
}

interface CatalogItem {
    id: string;
    category: string;
    description: string;
}

export function HazardSelect({ value, onChange }: HazardSelectProps) {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchCatalog = async () => {
            setLoading(true);
            try {
                const data = await riskRepository.getCatalog();
                setItems(data);
            } catch (err) {
                console.error('Failed to load risk catalog', err);
            } finally {
                setLoading(false);
            }
        };
        fetchCatalog();
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const filteredItems = items.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (description: string) => {
        onChange(description);
        setOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div
                className="w-full flex justify-between items-center border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm py-2 px-3 cursor-pointer sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                onClick={() => setOpen(!open)}
            >
                <span className={!value ? 'text-gray-400' : ''}>
                    {value || 'Selecione ou digite um perigo...'}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>

            {open && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto sm:text-sm">
                    <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b dark:border-gray-700">
                        <input
                            type="text"
                            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md p-1 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Buscar risco..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    {loading && <div className="p-2 text-gray-500">Carregando catálogo...</div>}

                    {!loading && filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 ${value === item.description ? 'text-indigo-600 font-semibold' : 'text-gray-900 dark:text-gray-100'
                                }`}
                            onClick={() => handleSelect(item.description)}
                        >
                            <span className="block truncate">
                                <span className="text-gray-400 text-xs mr-2 border border-gray-200 rounded px-1">{item.category}</span>
                                {item.description}
                            </span>
                            {value === item.description && (
                                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                    <Check className="h-5 w-5" />
                                </span>
                            )}
                        </div>
                    ))}

                    {!loading && searchTerm && !filteredItems.find(i => i.description.toLowerCase() === searchTerm.toLowerCase()) && (
                        <div
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600"
                            onClick={() => handleSelect(searchTerm)}
                        >
                            <div className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                <span>Usar personalizado: "<strong>{searchTerm}</strong>"</span>
                            </div>
                        </div>
                    )}

                    {!loading && filteredItems.length === 0 && !searchTerm && (
                        <div className="p-2 text-gray-500 text-center">Digite para buscar...</div>
                    )}
                </div>
            )}
        </div>
    );
}
