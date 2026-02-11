import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Pencil, Trash2, AlertCircle, Shield, User, Eye } from 'lucide-react';
import { supabase } from '../../infrastructure/supabase';
import { RBACGuard, ProtectedButton, RoleBadge, PermissionInfo } from './RBACGuard';
import type { UserRole } from '../hooks/useRBAC';

interface UserData {
    id: string;
    email: string;
    name?: string;
    role: UserRole;
    created_at?: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
    { 
        value: 'MASTER', 
        label: 'Administrador',
        description: 'Acesso total - pode gerenciar usuários, assinar laudos e configurar o sistema'
    },
    { 
        value: 'TECHNICIAN', 
        label: 'Técnico',
        description: 'Pode criar e editar dados, mas não pode assinar laudos ou gerenciar usuários'
    },
    { 
        value: 'VIEWER', 
        label: 'Visualizador',
        description: 'Apenas visualização - não pode criar, editar ou assinar'
    }
];

export function UserManagement() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [selectedRole, setSelectedRole] = useState<UserRole>('TECHNICIAN');

    const { data: users, isLoading, error, refetch } = useQuery({
        queryKey: ['tenant-users'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, name, role, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return (data || []) as UserData[];
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
            const { error } = await supabase
                .from('profiles')
                .update({ role })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
            setIsModalOpen(false);
            setEditingUser(null);
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            // Soft delete - marcar como deleted_at
            const { error } = await supabase
                .from('profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
        }
    });

    const handleEdit = (user: UserData) => {
        setEditingUser(user);
        setSelectedRole(user.role);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (editingUser) {
            updateRoleMutation.mutate({ userId: editingUser.id, role: selectedRole });
        }
    };

    const handleDelete = (userId: string) => {
        if (confirm('Tem certeza que deseja remover este usuário?')) {
            deleteUserMutation.mutate(userId);
        }
    };

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'MASTER': return <Shield className="h-4 w-4 text-purple-600" />;
            case 'TECHNICIAN': return <User className="h-4 w-4 text-blue-600" />;
            case 'VIEWER': return <Eye className="h-4 w-4 text-gray-600" />;
        }
    };

    const getRoleLabel = (role: UserRole) => {
        return ROLE_OPTIONS.find(r => r.value === role)?.label || role;
    };

    return (
        <div className="mt-8">
            <PermissionInfo />

            <RBACGuard permission="MANAGE_USERS">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                        Usuários do Sistema
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Gerencie permissões e acessos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-600">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            Erro ao carregar usuários
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users?.map((user) => (
                                <div 
                                    key={user.id} 
                                    className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                                            {getRoleIcon(user.role)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {user.name || user.email}
                                            </p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                            <span className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-0.5 rounded-full ${
                                                user.role === 'MASTER' ? 'bg-purple-100 text-purple-800' :
                                                user.role === 'TECHNICIAN' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                            title="Editar permissão"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            title="Remover usuário"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </RBACGuard>

            {/* Modal de edição */}
            {isModalOpen && editingUser && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 opacity-75" onClick={() => setIsModalOpen(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                        
                        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                    Editar Permissão
                                </h3>
                                
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Usuário: <strong>{editingUser.email}</strong>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {ROLE_OPTIONS.map((option) => (
                                        <label
                                            key={option.value}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                selectedRole === option.value
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={option.value}
                                                checked={selectedRole === option.value}
                                                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {option.label}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={updateRoleMutation.isPending}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {updateRoleMutation.isPending ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
