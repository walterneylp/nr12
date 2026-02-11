import { useQuery } from '@tanstack/react-query';
import { reportRepository } from '../../infrastructure/repositories/reportRepository';

export function useReportLock(reportId: string) {
    const { data: report } = useQuery({
        queryKey: ['report', reportId],
        queryFn: () => reportRepository.getById(reportId),
        enabled: !!reportId,
    });

    const isSigned = report?.status === 'SIGNED';
    const isLocked = isSigned || !!report?.locked_at;
    const canEdit = !isLocked;

    return {
        isSigned,
        isLocked,
        canEdit,
        report,
        status: report?.status,
        lockedAt: report?.locked_at,
        signedAt: report?.signed_at,
        signedBy: report?.signed_by,
    };
}
