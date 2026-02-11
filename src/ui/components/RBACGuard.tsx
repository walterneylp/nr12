import { useRBAC, type UserRole } from '../hooks/useRBAC';
import { Lock, AlertCircle } from 'lucide-react';

interface RBACGuardProps {
    children: React.ReactNode;
    permission?: 'MANAGE_USERS' | 'CREATE_EDIT' | 'SIGN_REPORT' | 'VIEW';
    allowedRoles?: UserRole[];
    fallback?: React.ReactNode;
    showWarning?: boolean;
}

export function RBACGuard({ 
    children, 
    permission, 
    allowedRoles, 
    fallback,
    showWarning = false 
}: RBACGuardProps) {
    const { role, canManageUsers, canCreateEdit, canSign, canView, isLoading } = useRBAC();

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
        );
    }

    // Verificar por permissão específica
    let hasPermission = false;
    if (permission) {
        switch (permission) {
            case 'MANAGE_USERS': hasPermission = canManageUsers; break;
            case 'CREATE_EDIT': hasPermission = canCreateEdit; break;
            case 'SIGN_REPORT': hasPermission = canSign; break;
            case 'VIEW': hasPermission = canView; break;
        }
    }

    // Verificar por roles permitidas
    if (allowedRoles && allowedRoles.length > 0) {
        hasPermission = allowedRoles.includes(role);
    }

    if (!hasPermission) {
        if (fallback) {
            return <>{fallback}</>;
        }

        if (showWarning) {
            return (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg text-sm">
                    <Lock className="h-4 w-4" />
                    <span>Você não tem permissão para esta ação</span>
                </div>
            );
        }

        return null;
    }

    return <>{children}</>;
}

// Componente específico para botões protegidos
interface ProtectedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    permission?: 'MANAGE_USERS' | 'CREATE_EDIT' | 'SIGN_REPORT' | 'VIEW';
    allowedRoles?: UserRole[];
}

export function ProtectedButton({ 
    permission, 
    allowedRoles, 
    children, 
    className = '',
    ...props 
}: ProtectedButtonProps) {
    const { role, canManageUsers, canCreateEdit, canSign, canView, isLoading } = useRBAC();

    if (isLoading) {
        return (
            <button disabled className={`opacity-50 cursor-not-allowed ${className}`} {...props}>
                {children}
            </button>
        );
    }

    let hasPermission = false;
    if (permission) {
        switch (permission) {
            case 'MANAGE_USERS': hasPermission = canManageUsers; break;
            case 'CREATE_EDIT': hasPermission = canCreateEdit; break;
            case 'SIGN_REPORT': hasPermission = canSign; break;
            case 'VIEW': hasPermission = canView; break;
        }
    }

    if (allowedRoles && allowedRoles.length > 0) {
        hasPermission = allowedRoles.includes(role);
    }

    if (!hasPermission) {
        return (
            <button 
                disabled 
                className={`opacity-50 cursor-not-allowed ${className}`}
                title="Você não tem permissão para esta ação"
                {...props}
            >
                {children}
            </button>
        );
    }

    return (
        <button className={className} {...props}>
            {children}
        </button>
    );
}

// Badge indicando o perfil do usuário
export function RoleBadge() {
    const { role, isLoading } = useRBAC();

    if (isLoading) return null;

    const config = {
        MASTER: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
        TECHNICIAN: { label: 'Técnico', color: 'bg-blue-100 text-blue-800' },
        VIEWER: { label: 'Visualizador', color: 'bg-gray-100 text-gray-800' }
    };

    const { label, color } = config[role];

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
            {label}
        </span>
    );
}

// Banner informativo sobre permissões
export function PermissionInfo() {
    const { role, canManageUsers, canCreateEdit, canSign, isLoading } = useRBAC();

    if (isLoading) return null;

    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-200">
                        Seu perfil: {role === 'MASTER' ? 'Administrador' : role === 'TECHNICIAN' ? 'Técnico' : 'Visualizador'}
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                        <li className={canManageUsers ? '' : 'opacity-50'}>
                            {canManageUsers ? '✓' : '✗'} Gerenciar usuários
                        </li>
                        <li className={canCreateEdit ? '' : 'opacity-50'}>
                            {canCreateEdit ? '✓' : '✗'} Criar e editar dados
                        </li>
                        <li className={canSign ? '' : 'opacity-50'}>
                            {canSign ? '✓' : '✗'} Assinar laudos
                        </li>
                        <li>✓ Visualizar dados</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
