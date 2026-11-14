import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Eye, Calendar } from 'lucide-react';
import { employmentService } from '@/services/employment.service';
import { SubmissionStatusBadge } from '@/components/SubmissionStatusBadge';
import { formatDate } from '@/lib/utils';

export function PendingSubmissionsPage() {
  const navigate = useNavigate();

  const { data: submissions, isLoading } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => employmentService.getPendingSubmissions(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pending submissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pending Employment Submissions</h1>
        <p className="text-gray-600">Review and approve employee data submissions</p>
      </div>

      {submissions && submissions.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Submissions</h3>
          <p className="text-gray-600">
            All employment submissions have been reviewed. New submissions will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Title
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions?.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-brand-700 font-semibold">
                          {submission.user?.firstName?.[0]}{submission.user?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.user?.firstName} {submission.user?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{submission.user?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{submission.jobTitle}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{submission.department?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {submission.submittedAt ? formatDate(submission.submittedAt) : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SubmissionStatusBadge status={submission.submissionStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/hr/employees/${submission.userId}`)}
                      className="text-brand-600 hover:text-brand-900 inline-flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {submissions && submissions.length > 0 && (
        <div className="mt-6 text-sm text-gray-600">
          Showing {submissions.length} pending submission{submissions.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
