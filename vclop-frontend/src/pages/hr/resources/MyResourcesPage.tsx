import { useQuery } from '@tanstack/react-query';
import { FolderOpen, Users } from 'lucide-react';
import { resourcesService } from '@/services/resources.service';
import { formatDate } from '@/lib/utils';

export function MyResourcesPage() {
  const { data: resources, isLoading } = useQuery({
    queryKey: ['my-resources'],
    queryFn: () => resourcesService.getMyResources(false),
  });

  const { data: receivedDelegations } = useQuery({
    queryKey: ['received-delegations'],
    queryFn: () => resourcesService.getReceivedDelegations('ACCEPTED'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading resources...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">My Resources & Delegations</h1>

      {/* My Resources */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FolderOpen className="w-5 h-5" />
          My Assigned Resources
        </h2>
        {resources && resources.length > 0 ? (
          <div className="space-y-3">
            {resources.map((resource) => (
              <div key={resource.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{resource.resourceType.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Resource ID: {resource.resourceId}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Assigned by {resource.assignedBy.firstName} {resource.assignedBy.lastName} on {formatDate(resource.assignedAt)}
                    </p>
                  </div>
                  {resource.isCurrent && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      Current
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No resources assigned to you</p>
        )}
      </div>

      {/* Active Delegations */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Active Delegations to Me
        </h2>
        {receivedDelegations && receivedDelegations.length > 0 ? (
          <div className="space-y-3">
            {receivedDelegations.map((delegation) => (
              <div key={delegation.id} className="p-4 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{delegation.resourceType.replace('_', ' ')}</p>
                    <p className="text-sm text-gray-600">Resource ID: {delegation.resourceId}</p>
                    <p className="text-sm text-gray-700 mt-1">
                      Delegated by {delegation.delegator.firstName} {delegation.delegator.lastName}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    Active
                  </span>
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-sm text-gray-600">
                    Period: {formatDate(delegation.startDate)} - {formatDate(delegation.endDate)}
                  </p>
                  <div className="flex gap-2 mt-2 text-xs">
                    {delegation.permissions.canRead && (
                      <span className="px-2 py-1 bg-white rounded">Read</span>
                    )}
                    {delegation.permissions.canUpdate && (
                      <span className="px-2 py-1 bg-white rounded">Update</span>
                    )}
                    {delegation.permissions.canApproveLoans && (
                      <span className="px-2 py-1 bg-white rounded">Approve Loans</span>
                    )}
                    {delegation.permissions.canDisburse && (
                      <span className="px-2 py-1 bg-white rounded">Disburse</span>
                    )}
                    {delegation.permissions.canCollect && (
                      <span className="px-2 py-1 bg-white rounded">Collect</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No active delegations</p>
        )}
      </div>
    </div>
  );
}
