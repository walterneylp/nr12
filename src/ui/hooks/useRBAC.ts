import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/supabase';

export type UserRole = 'MASTER' | 'TECHNICIAN' | 'VIEWER';

interface UserPermissions {
    role: UserRole;
    canManageUsers: boolean;
    canCreateEdit: boolean;
    canSign: boolean;
    canView: boolean;
    isMaster: boolean;
    isTechnician: boolean;
    isViewer: boolean;
}

export function useRBAC(): UserPermissions & { isLoading: boolean } {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-role'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (error) throw error;
            return data;
        },
        staleTime: 5 * 60 * 1000 // 5 minutos
    });

    const role = profile?.role as UserRole || 'VIEWER';

    return {
        role,
        canManageUsers: role === 'MASTER',
        canCreateEdit: role === 'MASTER' || role === 'TECHNICIAN',
        canSign: role === 'MASTER',
        canView: true, // Todos podem ver
        isMaster: role === 'MASTER',
        isTechnician: role === 'TECHNICIAN',
        isViewer: role === 'VIEWER',
        isLoading
    };
}

// Hook para verificar uma permissão específica
export function usePermission(permission: 'MANAGE_USERS' | 'CREATE_EDIT' | 'SIGN_REPORT' | 'VIEW'): boolean {
    const { canManageUsers, canCreateEdit, canSign, canView } = useRBAC();
    
    switch (permission) {
        case 'MANAGE_USERS': return canManageUsers;
        case 'CREATE_EDIT': return canCreateEdit;
        case 'SIGN_REPORT': return canSign;
        case 'VIEW': return canView;
        default: return false;
    }
}
