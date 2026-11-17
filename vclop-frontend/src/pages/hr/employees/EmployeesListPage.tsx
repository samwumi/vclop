import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Eye, Search, Briefcase } from 'lucide-react';
import { api } from '@/lib/axios';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  currentEmployment?: {
    jobTitle: string;
    departmentName: string;
    branchName: string;
    salary: number;
    hireDate: string;
  };
}

export function EmployeesListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users-list', statusFilter],
    queryFn: async () => {
      const response = await api.get('/users', {
        params: { 
          limit: 200,  // Backend max limit
          page: 1,
          ...(statusFilter ? { status: statusFilter } : {})
        },
      });
      return response.data;
    },
  });

  const users = usersResponse?.data || [];

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch =
      !search ||
      user.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-brand-600" />
            Employee Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage employee records and employment details</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm sm:text-base"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm sm:text-base"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Total Employees</p>
              <p className="text-xl sm:text-2xl font-bold">{users?.length || 0}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600">
                {users?.filter((u: User) => u.status === 'ACTIVE').length || 0}
              </p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">With Employment</p>
              <p className="text-xl sm:text-2xl font-bold text-brand-600">
                {users?.filter((u: User) => u.currentEmployment).length || 0}
              </p>
            </div>
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-brand-500" />
          </div>
        </div>
        <div className="bg-white border rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600">No Employment</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">
                {users?.filter((u: User) => !u.currentEmployment).length || 0}
              </p>
            </div>
            <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="bg-white border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-10 h-10 sm:h-12 sm:w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
            <p className="text-sm sm:text-base text-gray-600">Loading employees...</p>
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <>
            {/* Mobile Card Layout */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredUsers.map((user: User) => (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 break-words">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 break-words">{user.email}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2 ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'INACTIVE'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Job Title:</span>
                      <span className="font-medium text-gray-900 text-right break-words ml-2">
                        {user.currentEmployment?.jobTitle || (
                          <span className="text-gray-400 italic">No employment</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Department:</span>
                      <span className="font-medium text-gray-900 text-right break-words ml-2">
                        {user.currentEmployment?.departmentName || '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Salary:</span>
                      <span className="font-medium text-brand-600 text-right">
                        {user.currentEmployment?.salary
                          ? `₦${Number(user.currentEmployment.salary).toLocaleString()}`
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/hr/employees/${user.id}`)}
                    className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user: User) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : user.status === 'INACTIVE'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.currentEmployment?.jobTitle || (
                          <span className="text-gray-400 italic">No employment</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.currentEmployment?.departmentName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.currentEmployment?.salary
                          ? `₦${Number(user.currentEmployment.salary).toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => navigate(`/hr/employees/${user.id}`)}
                          className="text-brand-600 hover:text-brand-900 inline-flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-6 sm:p-8 text-center">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
            <p className="text-sm sm:text-base text-gray-600">
              {search ? 'Try adjusting your search criteria' : 'No employees match the current filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
