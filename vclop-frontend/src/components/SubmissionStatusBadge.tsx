import { CheckCircle, Clock, XCircle, AlertTriangle, FileEdit, Send } from 'lucide-react';

type SubmissionStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

interface SubmissionStatusBadgeProps {
  status: SubmissionStatus;
  className?: string;
}

export function SubmissionStatusBadge({ status, className = '' }: SubmissionStatusBadgeProps) {
  const configs = {
    DRAFT: {
      label: 'Draft',
      icon: FileEdit,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      iconColor: 'text-gray-500',
    },
    SUBMITTED: {
      label: 'Submitted',
      icon: Send,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    APPROVED: {
      label: 'Approved',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-600',
    },
    REJECTED: {
      label: 'Rejected',
      icon: XCircle,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      iconColor: 'text-red-600',
    },
    NEEDS_REVISION: {
      label: 'Needs Revision',
      icon: AlertTriangle,
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600',
    },
  };

  const config = configs[status] || configs.DRAFT;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bgColor} ${config.textColor} ${className}`}>
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
      {config.label}
    </span>
  );
}
