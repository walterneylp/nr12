
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '../../infrastructure/supabase';

// Helper for unique IDs if crypto is not available (rare but safe)
function generateId() {
    return typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface ImageUploadProps {
    value?: string[];
    onChange: (urls: string[]) => void;
    maxFiles?: number;
    bucketName?: string;
}

export function ImageUpload({ value = [], onChange, maxFiles = 3, bucketName = 'photos' }: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        // Validate size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Arquivo muito grande! Máximo 5MB.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${generateId()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            const newUrl = data.publicUrl;
            onChange([...value, newUrl]);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem.');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemove = (urlToRemove: string) => {
        onChange(value.filter(url => url !== urlToRemove));
        // Note: We are not deleting from storage to avoid accidental data loss 
        // if user cancels form edit. A cleanup job implies more complexity.
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {value.map((url, index) => (
                    <div key={index} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                        <img
                            src={url}
                            alt={`Evidência ${index + 1}`}
                            className="object-cover w-full h-full"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(url)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {value.length < maxFiles && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative aspect-square rounded-lg border-2 border-dashed border-gray-300 
                            flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-colors
                            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <span className="text-xs text-gray-500 font-medium">Adicionar Foto</span>
                            </>
                        )}
                    </div>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
            />
        </div>
    );
}
