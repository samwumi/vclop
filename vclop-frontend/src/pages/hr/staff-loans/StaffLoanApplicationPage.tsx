import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calculator } from 'lucide-react';
import { toast } from 'sonner';
import { staffLoansService, type ApplyLoanDto } from '@/services/staff-loans.service';
import { formatCurrency } from '@/lib/utils';

export function StaffLoanApplicationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ApplyLoanDto>({
    requestedAmount: 0,
    loanPurpose: '',
    proposedTenureMonths: 5,
    justification: '',
  });

  const { data: eligibility, isLoading: loadingEligibility } = useQuery({
    queryKey: ['staff-loan-eligibility'],
    queryFn: () => staffLoansService.checkEligibility(),
  });

  const applyMutation = useMutation({
    mutationFn: (data: ApplyLoanDto) => staffLoansService.applyForLoan(data),
    onSuccess: () => {
      toast.success('Loan application submitted successfully');
      navigate('/hr/staff-loans/my-loans');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit application');
    },
  });

  const monthlyInstallment = formData.requestedAmount > 0 ? formData.requestedAmount / formData.proposedTenureMonths : 0;
  const percentageOfSalary = eligibility?.loanLimits?.monthlySalary ? (monthlyInstallment / eligibility.loanLimits.monthlySalary) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eligibility?.eligible) {
      toast.error('You are not eligible for a staff loan');
      return;
    }

    if (formData.requestedAmount > (eligibility?.loanLimits?.maxEligibleAmount || 0)) {
      toast.error(`Amount exceeds maximum eligible: ${formatCurrency(eligibility?.loanLimits?.maxEligibleAmount || 0)}`);
      return;
    }

    if (percentageOfSalary > 25) {
      toast.error('Monthly installment exceeds 25% of salary');
      return;
    }

    applyMutation.mutate(formData);
  };

  if (loadingEligibility) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  if (!eligibility?.eligible) {
    const reasons = eligibility?.reasons;
    
    return (
      <div className="container mx-auto py-8 max-w-3xl">
        <button onClick={() => navigate('/hr/staff-loans/my-loans')} className="btn-ghost mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Loans
        </button>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-red-900 mb-4">❌ Not Eligible for Staff Loan</h2>
          <p className="text-red-700 mb-4">
            You don't currently meet the eligibility requirements for a staff loan. Please review the issues below:
          </p>

          <div className="space-y-3">
            {/* Employment Record Check */}
            {!reasons?.activeEmployment && (
              <div className="bg-white border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-900 mb-2">❌ No Active Employment Record</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You don't have an active employment record in the system. This record is required to determine your salary and loan eligibility.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-2">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                  <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                    <li>Contact HR Department to create your employment record</li>
                    <li>Or email hr@company.com with:
                      <ul className="ml-6 mt-1 list-disc list-inside">
                        <li>Your name and employee ID</li>
                        <li>Request: "Please create my employment record in the system"</li>
                      </ul>
                    </li>
                    <li>HR will add your hire date, job title, and salary information</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Valid Salary Check */}
            {reasons?.activeEmployment && !reasons?.hasValidSalary && (
              <div className="bg-white border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-900 mb-2">❌ No Salary Information</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Your employment record exists but doesn't have salary information. Salary is required to calculate your loan eligibility.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                  <p className="text-sm text-blue-800">
                    Contact HR to update your employment record with your monthly salary (minimum ₦1,000).
                  </p>
                </div>
              </div>
            )}

            {/* Account Status Check */}
            {!reasons?.accountActive && (
              <div className="bg-white border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-900 mb-2">❌ Account Not Active</h3>
                <p className="text-sm text-gray-700 mb-3">
                  Your user account is not in active status.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                  <p className="text-sm text-blue-800">
                    Contact your administrator or IT support to activate your account.
                  </p>
                </div>
              </div>
            )}

            {/* Active Loans Check */}
            {!reasons?.noActiveLoans && (
              <div className="bg-white border-l-4 border-yellow-500 p-4 rounded">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Active Loan Exists</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You already have an active or pending staff loan. Only one loan is allowed at a time.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                  <p className="text-sm text-blue-800">
                    Wait until your current loan is fully paid off before applying for a new one.
                  </p>
                </div>
              </div>
            )}

            {/* Overdue Payments Check */}
            {!reasons?.noOverduePayments && (
              <div className="bg-white border-l-4 border-red-500 p-4 rounded">
                <h3 className="font-semibold text-red-900 mb-2">❌ Overdue Payments</h3>
                <p className="text-sm text-gray-700 mb-3">
                  You have overdue loan payments that must be cleared before applying for a new loan.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-sm font-semibold text-blue-900 mb-2">What to do:</p>
                  <p className="text-sm text-blue-800">
                    Clear all overdue payments, then try applying again.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* HR Contact Information */}
          <div className="mt-6 p-4 bg-white rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-700 mb-2">
              Contact the HR Department:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>📧 Email: hr@company.com</li>
              <li>📞 Phone: Extension 500</li>
              <li>🏢 Office: HR Department, 2nd Floor</li>
            </ul>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => navigate('/hr/staff-loans/my-loans')}
              className="btn-secondary"
            >
              Back to My Loans
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh Eligibility
            </button>
          </div>
        </div>

        {/* Eligibility Requirements */}
        {eligibility?.businessRules && (
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Staff Loan Policy</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Interest Rate:</strong> {eligibility.businessRules.interestRate}</p>
              <p><strong>Maximum Repayment Period:</strong> {eligibility.businessRules.maxRepaymentPeriod}</p>
              <p><strong>Maximum Salary Deduction:</strong> {eligibility.businessRules.maxSalaryDeduction}</p>
              <p className="text-gray-600 italic mt-3">{eligibility.businessRules.description}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-6">
        <button onClick={() => navigate('/hr/staff-loans/my-loans')} className="btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-3xl font-bold">Apply for Staff Loan</h1>
        <p className="text-gray-600 mt-2">Fill out the form below to apply for a staff loan</p>
      </div>

      {/* Eligibility Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Your Eligibility</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-blue-700">Monthly Salary</p>
            <p className="font-semibold text-blue-900">{formatCurrency(eligibility.loanLimits?.monthlySalary || 0)}</p>
          </div>
          <div>
            <p className="text-blue-700">Maximum Loan Amount</p>
            <p className="font-semibold text-blue-900">{formatCurrency(eligibility.loanLimits?.maxEligibleAmount || 0)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6">
        {/* Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="1000"
            max={eligibility.loanLimits?.maxEligibleAmount}
            value={formData.requestedAmount || ''}
            onChange={(e) => setFormData({ ...formData, requestedAmount: Number(e.target.value) })}
            className="input w-full"
            placeholder="Enter amount"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum: {formatCurrency(eligibility.loanLimits?.maxEligibleAmount || 0)}
          </p>
        </div>

        {/* Purpose */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Purpose <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={200}
            value={formData.loanPurpose}
            onChange={(e) => setFormData({ ...formData, loanPurpose: e.target.value })}
            className="input w-full"
            placeholder="e.g., Medical expenses, Education, etc."
          />
        </div>

        {/* Tenure */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repayment Period (Months) <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.proposedTenureMonths}
            onChange={(e) => setFormData({ ...formData, proposedTenureMonths: Number(e.target.value) })}
            className="input w-full"
          >
            {[1, 2, 3, 4, 5].map(m => (
              <option key={m} value={m}>{m} {m === 1 ? 'Month' : 'Months'}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Maximum: 5 months</p>
        </div>

        {/* Justification */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Justification <span className="text-red-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            maxLength={500}
            value={formData.justification}
            onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
            className="input w-full"
            placeholder="Provide detailed justification for this loan..."
          />
        </div>

        {/* Calculator */}
        {formData.requestedAmount > 0 && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold">Loan Calculation</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Monthly Installment</p>
                <p className="text-lg font-bold">{formatCurrency(monthlyInstallment)}</p>
              </div>
              <div>
                <p className="text-gray-600">% of Salary</p>
                <p className={`text-lg font-bold ${percentageOfSalary > 25 ? 'text-red-600' : 'text-green-600'}`}>
                  {percentageOfSalary.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Repayable</p>
                <p className="text-lg font-bold">{formatCurrency(formData.requestedAmount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Interest Rate</p>
                <p className="text-lg font-bold text-green-600">0%</p>
              </div>
            </div>
            {percentageOfSalary > 25 && (
              <p className="text-xs text-red-600 mt-3">
                ⚠️ Installment exceeds 25% salary limit
              </p>
            )}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/hr/staff-loans/my-loans')}
            className="btn btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={applyMutation.isPending || percentageOfSalary > 25}
            className="btn btn-primary flex-1"
          >
            {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
}
