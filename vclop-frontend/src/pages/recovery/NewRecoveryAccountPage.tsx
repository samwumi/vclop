import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { recoveryService, type RecoverySource, type PriorityLevel } from '@/services/recovery.service';
import { api } from '@/lib/axios';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import type { ApiResponse } from '@/types/api.types';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface LoanProduct {
  id: string;
  name: string;
  code: string;
}

interface Loan {
  id: string;
  loanNumber: string;
  principal: number;
  disbursementDate: string;
  customer: Customer;
  loanProduct?: LoanProduct;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function NewRecoveryAccountPage() {
  const navigate = useNavigate();
  const [source, setSource] = useState<RecoverySource>('LEGACY');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [customerId, setCustomerId] = useState('');

  // Fetch active loans for VCLOP source
  const { data: loans } = useQuery({
    queryKey: ['loans', 'defaulted'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Loan[]>>('/loans?status=DEFAULTED&include=customer,loanProduct');
      return data.data ?? [];
    },
    enabled: source === 'VCLOP',
  });

  // Fetch customers for linking
  const { data: customers } = useQuery({
    queryKey: ['customers', 'active'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Customer[]>>('/customers?status=ACTIVE&limit=100');
      return data.data ?? [];
    },
    enabled: source === 'LEGACY' || source === 'VCLOP',
  });

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Branch[]>>('/branches');
      return data.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return await recoveryService.createAccount(payload);
    },
    onSuccess: () => {
      toast.success('Recovery account created successfully');
      navigate('/recovery/accounts');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? 'Failed to create recovery account');
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload: any = {
      source,
      customerName: formData.get('customerName') as string,
      customerPhone: formData.get('customerPhone') as string,
      customerEmail: formData.get('customerEmail') as string || undefined,
      customerAddress: formData.get('customerAddress') as string || undefined,
      customerBvn: formData.get('customerBvn') as string || undefined,
      customerNin: formData.get('customerNin') as string || undefined,
      originalPrincipal: Number(formData.get('originalPrincipal')),
      disbursementDate: formData.get('disbursementDate') as string,
      historicalRepayments: Number(formData.get('historicalRepayments') || 0),
      outstandingBalance: Number(formData.get('outstandingBalance')),
      priorityLevel: (formData.get('priorityLevel') as PriorityLevel) || 'MEDIUM',
      notes: formData.get('notes') as string || undefined,
    };

    // Add optional fields
    if (source === 'VCLOP' && selectedLoanId) {
      payload.vclopLoanId = selectedLoanId;
    }
    if (customerId) {
      payload.customerId = customerId;
    }
    const branchId = formData.get('branchId') as string;
    if (branchId) {
      payload.branchId = branchId;
    }

    createMutation.mutate(payload);
  };

  // Auto-fill from selected loan
  const selectedLoan = loans?.find((l) => l.id === selectedLoanId);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-mobile">
        <Breadcrumbs />
        <div className="flex-mobile-col items-start md:items-center justify-between mt-3 md:mt-4 gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/recovery/accounts')} className="btn-ghost btn-icon">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                New Recovery Account
              </h1>
              <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Create a new recovery account
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-mobile md:p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Source Selection */}
          <div className="card-mobile">
            <div className="card-header">
              <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Account Source
              </p>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="source"
                    value="LEGACY"
                    checked={source === 'LEGACY'}
                    onChange={(e) => setSource(e.target.value as RecoverySource)}
                    className="form-radio"
                  />
                  <div>
                    <p className="font-medium text-responsive-sm" style={{ color: 'var(--text-primary)' }}>
                      Legacy / Historical Loan
                    </p>
                    <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                      Old loan from spreadsheets or previous system
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="source"
                    value="VCLOP"
                    checked={source === 'VCLOP'}
                    onChange={(e) => setSource(e.target.value as RecoverySource)}
                    className="form-radio"
                  />
                  <div>
                    <p className="font-medium text-responsive-sm" style={{ color: 'var(--text-primary)' }}>
                      VCLOP Defaulted Loan
                    </p>
                    <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                      Link to an existing defaulted loan in VCLOP
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* VCLOP Loan Selection */}
          {source === 'VCLOP' && (
            <div className="card-mobile">
              <div className="card-header">
                <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Select VCLOP Loan
                </p>
              </div>
              <div className="card-body">
                <label className="form-label">Select Defaulted Loan</label>
                <select
                  value={selectedLoanId}
                  onChange={(e) => setSelectedLoanId(e.target.value)}
                  className="form-input"
                  required={source === 'VCLOP'}
                >
                  <option value="">-- Select a loan --</option>
                  {loans?.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.loanNumber} - {loan.customer.firstName} {loan.customer.lastName}
                      {loan.loanProduct ? ` [${loan.loanProduct.name}]` : ''} (₦
                      {loan.principal.toLocaleString()})
                    </option>
                  ))}
                </select>
                {selectedLoan && (
                  <p className="text-responsive-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                    Customer info will be auto-filled from the selected loan
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="card-mobile">
            <div className="card-header">
              <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Customer Information
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {source === 'LEGACY' && customers && customers.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="form-label">Link to Existing Customer (Optional)</label>
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="form-input"
                    >
                      <option value="">-- No customer linkage --</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.firstName} {customer.lastName} - {customer.phone}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Link this recovery account to an existing VCLOP customer
                    </p>
                  </div>
                )}

                <div>
                  <label className="form-label">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    className="form-input"
                    defaultValue={
                      selectedLoan
                        ? `${selectedLoan.customer.firstName} ${selectedLoan.customer.lastName}`
                        : ''
                    }
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    className="form-input"
                    defaultValue={selectedLoan?.customer.phone ?? ''}
                    placeholder="08012345678"
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="customerEmail"
                    className="form-input"
                    defaultValue={selectedLoan?.customer.email ?? ''}
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="form-label">Physical Address</label>
                  <input
                    type="text"
                    name="customerAddress"
                    className="form-input"
                    placeholder="123 Main Street, Lagos"
                  />
                </div>

                <div>
                  <label className="form-label">BVN</label>
                  <input
                    type="text"
                    name="customerBvn"
                    className="form-input"
                    placeholder="22123456789"
                    maxLength={11}
                  />
                </div>

                <div>
                  <label className="form-label">NIN</label>
                  <input
                    type="text"
                    name="customerNin"
                    className="form-input"
                    placeholder="12345678901"
                    maxLength={11}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loan Information */}
          <div className="card-mobile">
            <div className="card-header">
              <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Loan Information
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">
                    Original Principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="originalPrincipal"
                    required
                    min="0"
                    step="0.01"
                    className="form-input"
                    defaultValue={selectedLoan?.principal ?? ''}
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="form-label">
                    Disbursement Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="disbursementDate"
                    required
                    className="form-input"
                    defaultValue={selectedLoan?.disbursementDate.split('T')[0] ?? ''}
                  />
                </div>

                <div>
                  <label className="form-label">Historical Repayments</label>
                  <input
                    type="number"
                    name="historicalRepayments"
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="10000"
                    defaultValue="0"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Amount already paid before recovery started
                  </p>
                </div>

                <div>
                  <label className="form-label">
                    Outstanding Balance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="outstandingBalance"
                    required
                    min="0"
                    step="0.01"
                    className="form-input"
                    placeholder="40000"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                    Current balance owed
                  </p>
                </div>

                <div>
                  <label className="form-label">Priority Level</label>
                  <select name="priorityLevel" className="form-input" defaultValue="MEDIUM">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Branch</label>
                  <select name="branchId" className="form-input">
                    <option value="">-- No branch --</option>
                    {branches?.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label className="form-label">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="form-input"
                  placeholder="Additional notes about this account..."
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/recovery/accounts')}
              className="btn-secondary btn-responsive"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary btn-responsive"
            >
              <Save className="w-4 h-4" />
              <span>{createMutation.isPending ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
