import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Calendar, 
  LogOut, 
  DollarSign, 
  FolderOpen,
  TrendingUp,
  Clock,
  AlertCircle,
  Briefcase,
  FileText
} from 'lucide-react';
import { leavesService } from '@/services/leaves.service';
import { offboardingService } from '@/services/offboarding.service';
import { staffLoansService } from '@/services/staff-loans.service';
import { resourcesService } from '@/services/resources.service';
import { employmentService } from '@/services/employment.service';

export function HRDashboardPage() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  // Fetch data for all modules
  const { data: myLeaveBalances } = useQuery({
    queryKey: ['my-leave-balances', currentYear],
    queryFn: () => leavesService.getMyBalance(currentYear),
  });

  const { data: pendingLeaveApprovals } = useQuery({
    queryKey: ['pending-leave-approvals'],
    queryFn: () => leavesService.getPendingApprovals(),
  });

  const { data: myLoans } = useQuery({
    queryKey: ['my-staff-loans'],
    queryFn: () => staffLoansService.getMyLoans(),
  });

  const { data: allLoans } = useQuery({
    queryKey: ['all-staff-loans'],
    queryFn: () => staffLoansService.getAllLoans({}),
  });

  const { data: offboardingCases } = useQuery({
    queryKey: ['offboarding-cases'],
    queryFn: () => offboardingService.getOffboardingCases(),
  });

  const { data: myResources } = useQuery({
    queryKey: ['my-resources'],
    queryFn: () => resourcesService.getMyResources(false),
  });

  const { data: receivedDelegations } = useQuery({
    queryKey: ['received-delegations-pending'],
    queryFn: () => resourcesService.getReceivedDelegations('PENDING'),
  });

  // Fetch pending employment submissions
  const { data: pendingSubmissions } = useQuery({
    queryKey: ['pending-submissions'],
    queryFn: () => employmentService.getPendingSubmissions(),
  });

  // Calculate stats
  const balanceArray = Array.isArray(myLeaveBalances) ? myLeaveBalances : [];
  const totalLeaveBalance = balanceArray.reduce((sum, b) => sum + b.remaining, 0);
  const pendingLeaveCount = pendingLeaveApprovals?.length || 0;
  
  const myActiveLoans = myLoans?.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status)).length || 0;
  const allPendingLoans = allLoans?.data?.filter(l => l.status === 'PENDING_APPROVAL').length || 0;
  
  const activeOffboarding = offboardingCases?.filter(c => !['COMPLETED', 'ON_HOLD'].includes(c.status)).length || 0;
  const completedOffboarding = offboardingCases?.filter(c => c.status === 'COMPLETED').length || 0;

  const pendingDelegations = receivedDelegations?.length || 0;
  const myResourceCount = myResources?.length || 0;
  const pendingEmploymentSubmissions = pendingSubmissions?.length || 0;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HR Dashboard</h1>
        <p className="text-gray-600">Overview of all HR modules and pending actions</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Leave Balance */}
        <div 
          onClick={() => navigate('/hr/leaves/my-applications')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8" />
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{totalLeaveBalance}</p>
          <p className="text-blue-100">Days Leave Remaining</p>
        </div>

        {/* Staff Loans */}
        <div 
          onClick={() => navigate('/hr/staff-loans/my-loans')}
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{myActiveLoans}</p>
          <p className="text-green-100">Active Loans</p>
        </div>

        {/* Offboarding */}
        <div 
          onClick={() => navigate('/hr/offboarding')}
          className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <LogOut className="w-8 h-8" />
            <AlertCircle className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{activeOffboarding}</p>
          <p className="text-orange-100">Active Offboarding</p>
        </div>

        {/* Resources */}
        <div 
          onClick={() => navigate('/hr/resources/my-resources')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-4">
            <FolderOpen className="w-8 h-8" />
            <Users className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold mb-1">{myResourceCount}</p>
          <p className="text-purple-100">My Resources</p>
        </div>
      </div>

      {/* Pending Actions */}
      {(pendingLeaveCount > 0 || allPendingLoans > 0 || pendingDelegations > 0 || pendingEmploymentSubmissions > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            Pending Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {pendingEmploymentSubmissions > 0 && (
              <button
                onClick={() => navigate('/hr/pending-submissions')}
                className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <p className="text-2xl font-bold text-yellow-600 mb-1">{pendingEmploymentSubmissions}</p>
                <p className="text-sm text-gray-600">Employment Submissions</p>
              </button>
            )}
            {pendingLeaveCount > 0 && (
              <button
                onClick={() => navigate('/hr/leaves/approvals')}
                className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <p className="text-2xl font-bold text-yellow-600 mb-1">{pendingLeaveCount}</p>
                <p className="text-sm text-gray-600">Leave Approvals Pending</p>
              </button>
            )}
            {allPendingLoans > 0 && (
              <button
                onClick={() => navigate('/hr/staff-loans/management')}
                className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <p className="text-2xl font-bold text-yellow-600 mb-1">{allPendingLoans}</p>
                <p className="text-sm text-gray-600">Loan Approvals Pending</p>
              </button>
            )}
            {pendingDelegations > 0 && (
              <button
                onClick={() => navigate('/hr/resources/my-resources')}
                className="p-4 bg-white rounded-lg hover:shadow-md transition-shadow text-left"
              >
                <p className="text-2xl font-bold text-yellow-600 mb-1">{pendingDelegations}</p>
                <p className="text-sm text-gray-600">Delegations Awaiting Response</p>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Module Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leaves Module */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold">Leaves</h3>
          </div>
          <div className="space-y-2 mb-4">
            {balanceArray.slice(0, 2).map(balance => (
              <div key={balance.leaveType.id} className="text-sm">
                <p className="text-gray-600">{balance.leaveType.name}</p>
                <p className="font-semibold text-blue-600">{balance.remaining} days left</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/hr/leaves/apply')}
            className="btn-primary btn-sm w-full"
          >
            Apply for Leave
          </button>
        </div>

        {/* Staff Loans Module */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-semibold">Staff Loans</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <p className="text-gray-600">Active Loans</p>
              <p className="font-semibold text-green-600">{myActiveLoans}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Pending Approval</p>
              <p className="font-semibold text-yellow-600">{allPendingLoans}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/hr/staff-loans/my-loans')}
            className="btn-secondary btn-sm w-full"
          >
            View My Loans
          </button>
        </div>

        {/* Offboarding Module */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <LogOut className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="font-semibold">Offboarding</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <p className="text-gray-600">In Progress</p>
              <p className="font-semibold text-orange-600">{activeOffboarding}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Completed</p>
              <p className="font-semibold text-green-600">{completedOffboarding}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/hr/offboarding')}
            className="btn-secondary btn-sm w-full"
          >
            View Cases
          </button>
        </div>

        {/* Resources Module */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-semibold">Resources</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <p className="text-gray-600">My Resources</p>
              <p className="font-semibold text-purple-600">{myResourceCount}</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">Pending Delegations</p>
              <p className="font-semibold text-yellow-600">{pendingDelegations}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/hr/resources/my-resources')}
            className="btn-secondary btn-sm w-full"
          >
            View Resources
          </button>
        </div>

        {/* Employee Management Module */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Briefcase className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-semibold">Employees</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="text-sm">
              <p className="text-gray-600">Manage Staff</p>
              <p className="font-semibold text-indigo-600">Employment Records</p>
            </div>
            <div className="text-sm">
              <p className="text-gray-600">View</p>
              <p className="font-semibold text-gray-700">Salary & Details</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/hr/my-employment')}
              className="btn-primary btn-sm flex-1"
            >
              My Employment
            </button>
            <button
              onClick={() => navigate('/hr/employees')}
              className="btn-secondary btn-sm flex-1"
            >
              All Employees
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
