import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { LogOut, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { offboardingService } from '@/services/offboarding.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDate } from '@/lib/utils';

export function MyOffboardingPage() {
  const user = useAuthStore((state) => state.user);

  const { data: cases, isLoading } = useQuery({
    queryKey: ['my-offboarding-cases'],
    queryFn: () => offboardingService.getOffboardingCases(),
    select: (data) => data.filter(c => c.userId === user?.id),
  });

  const myCase = cases?.[0]; // Assuming only one active offboarding per person

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading offboarding status...</p>
        </div>
      </div>
    );
  }

  if (!myCase) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="bg-white border rounded-lg p-8 text-center">
          <LogOut className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">No Active Offboarding</h2>
          <p className="text-gray-600">
            You do not have any active offboarding process at this time.
          </p>
        </div>
      </div>
    );
  }

  const clearanceSteps = [
    {
      key: 'IT',
      label: 'IT Access Revocation',
      completed: !!myCase.itAccessRevokedAt,
      date: myCase.itAccessRevokedAt,
      notes: myCase.itAccessNotes,
      icon: CheckCircle,
    },
    {
      key: 'Finance',
      label: 'Finance Clearance',
      completed: !!myCase.financeClearedAt,
      date: myCase.financeClearedAt,
      notes: myCase.financeNotes,
      icon: CheckCircle,
      details: myCase.finalSettlementAmount !== null ? [
        `Outstanding Advances: ₦${myCase.outstandingAdvances?.toLocaleString() || 0}`,
        `Outstanding Loans: ₦${myCase.outstandingLoans?.toLocaleString() || 0}`,
        `Final Settlement: ₦${myCase.finalSettlementAmount?.toLocaleString() || 0}`,
      ] : undefined,
    },
    {
      key: 'Assets',
      label: 'Asset Clearance',
      completed: !!myCase.assetsClearedAt,
      date: myCase.assetsClearedAt,
      notes: myCase.assetsNotes,
      icon: CheckCircle,
      details: myCase.unreturned !== null ? [
        `Unreturned Items: ${myCase.unreturned}`,
      ] : undefined,
    },
    {
      key: 'HR',
      label: 'HR Final Clearance',
      completed: !!myCase.hrClearedAt,
      date: myCase.hrClearedAt,
      notes: myCase.hrNotes,
      icon: CheckCircle,
    },
  ];

  const completedSteps = clearanceSteps.filter(s => s.completed).length;
  const progress = (completedSteps / clearanceSteps.length) * 100;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">My Offboarding Process</h1>
            <p className="text-gray-600">Track your exit clearance progress</p>
          </div>
          {myCase.status === 'COMPLETED' && (
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              Completed
            </span>
          )}
          {myCase.status === 'ON_HOLD' && (
            <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
              On Hold
            </span>
          )}
        </div>

        {/* Exit Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
          <div>
            <p className="text-xs text-gray-500 mb-1">Exit Reason</p>
            <p className="font-semibold">{myCase.exitReason.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Last Working Date</p>
            <p className="font-semibold">{formatDate(myCase.lastWorkingDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Initiated On</p>
            <p className="font-semibold">{formatDate(myCase.initiatedAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Progress</p>
            <p className="font-semibold">{completedSteps} / {clearanceSteps.length}</p>
          </div>
        </div>

        {myCase.exitReasonDetails && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
            <p className="text-sm text-blue-900">
              <strong>Details:</strong> {myCase.exitReasonDetails}
            </p>
          </div>
        )}

        {myCase.onHoldReason && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 mb-1">Process On Hold</p>
                <p className="text-sm text-yellow-800">{myCase.onHoldReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Clearance Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Clearance Steps */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-6">Clearance Checklist</h2>
        <div className="space-y-6">
          {clearanceSteps.map((step, index) => (
            <div key={step.key} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.completed
                    ? 'bg-green-100 text-green-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>
                {index < clearanceSteps.length - 1 && (
                  <div className={`w-0.5 h-12 my-2 ${
                    step.completed ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
              <div className="flex-1 pb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">{step.label}</h3>
                  {step.completed && step.date && (
                    <span className="text-sm text-gray-500">
                      {formatDate(step.date)}
                    </span>
                  )}
                </div>
                {step.details && (
                  <ul className="text-sm text-gray-600 mb-2 space-y-1">
                    {step.details.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                )}
                {step.notes && (
                  <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded">
                    "{step.notes}"
                  </p>
                )}
                {!step.completed && (
                  <p className="text-sm text-gray-500">Pending clearance</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {myCase.status === 'COMPLETED' && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            Offboarding Complete
          </h3>
          <p className="text-green-700">
            All clearances have been completed. Your final settlement will be processed shortly.
          </p>
          {myCase.completedAt && (
            <p className="text-sm text-green-600 mt-2">
              Completed on {formatDate(myCase.completedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
