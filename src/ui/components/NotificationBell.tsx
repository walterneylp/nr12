import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, X, Check, Trash2, AlertTriangle, Clock, FileText, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { notificationRepository, type Notification } from '../../infrastructure/repositories/notificationRepository';

const TYPE_ICONS: Record<string, React.ElementType> = {
    REPORT_EXPIRING: Clock,
    ACTION_DUE: AlertTriangle,
    TRAINING_EXPIRING: Clock,
    RISK_CRITICAL: AlertCircle,
    REPORT_SIGNED: CheckCircle,
    SYSTEM: Info,
    MENTION: AlertCircle
};

const PRIORITY_COLORS: Record<string, string> = {
    URGENT: 'bg-red-500',
    HIGH: 'bg-orange-500',
    NORMAL: 'bg-blue-500',
    LOW: 'bg-gray-400'
};

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications'],
        queryFn: () => notificationRepository.getAll(20),
        refetchInterval: 30000 // Atualiza a cada 30 segundos
    });

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications-unread-count'],
        queryFn: () => notificationRepository.getUnreadCount(),
        refetchInterval: 30000
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationRepository.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationRepository.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: notificationRepository.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
        }
    });

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
    const readNotifications = notifications?.filter(n => n.is_read) || [];

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.is_read) {
            markAsReadMutation.mutate(notification.id);
        }
        setIsOpen(false);
    };

    const getEntityLink = (notification: Notification): string => {
        if (notification.entity_type === 'report') return `/reports/${notification.entity_id}`;
        if (notification.entity_type === 'machine') return `/machines`;
        if (notification.entity_type === 'training') return `/training`;
        if (notification.entity_type === 'action_item') return `/reports`;
        return '/';
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Notificações
                        </h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllAsReadMutation.mutate()}
                                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
                                >
                                    <Check className="h-3 w-3" />
                                    Marcar todas
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="max-h-96 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                                Carregando...
                            </div>
                        ) : notifications?.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    Nenhuma notificação
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Unread */}
                                {unreadNotifications.length > 0 && (
                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10">
                                        <div className="px-4 py-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
                                            Não lidas ({unreadNotifications.length})
                                        </div>
                                        {unreadNotifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={() => handleNotificationClick(notification)}
                                                onDelete={() => deleteMutation.mutate(notification.id)}
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Read */}
                                {readNotifications.length > 0 && (
                                    <div>
                                        <div className="px-4 py-2 text-xs font-medium text-gray-500">
                                            Lidas ({readNotifications.length})
                                        </div>
                                        {readNotifications.slice(0, 5).map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onClick={() => handleNotificationClick(notification)}
                                                onDelete={() => deleteMutation.mutate(notification.id)}
                                                isRead
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications && notifications.length > 0 && (
                        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
                            <Link
                                to="/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                            >
                                Ver todas as notificações
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    onDelete: () => void;
    isRead?: boolean;
}

function NotificationItem({ notification, onClick, onDelete, isRead }: NotificationItemProps) {
    const Icon = TYPE_ICONS[notification.type] || Info;
    const priorityColor = PRIORITY_COLORS[notification.priority] || 'bg-gray-400';

    const content = (
        <div className={`relative px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group ${
            !isRead ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : ''
        }`}>
            <div className="flex items-start gap-3">
                <div className="relative mt-0.5">
                    <div className={`p-1.5 rounded-full ${priorityColor} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 ${priorityColor.replace('bg-', 'text-')}`} />
                    </div>
                    {!isRead && (
                        <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${priorityColor} border-2 border-white dark:border-gray-800`}></span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                        {notification.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at!).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            </div>
        </div>
    );

    if (notification.entity_id) {
        return (
            <Link to={getEntityLink(notification)} onClick={onClick}>
                {content}
            </Link>
        );
    }

    return (
        <div onClick={onClick} className="cursor-pointer">
            {content}
        </div>
    );
}

// Função auxiliar para obter o link da entidade
function getEntityLink(notification: Notification): string {
    if (notification.entity_type === 'report') return `/reports/${notification.entity_id}`;
    if (notification.entity_type === 'machine') return `/machines`;
    if (notification.entity_type === 'training') return `/training`;
    if (notification.entity_type === 'action_item') return `/reports`;
    return '/';
}
