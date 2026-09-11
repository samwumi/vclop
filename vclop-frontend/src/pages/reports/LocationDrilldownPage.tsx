import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle, Banknote, Building2, ChevronLeft,
  FileText, TrendingDown, Users, WalletCards,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { reportsService } from '@/services/reports.service';
import { formatDate } from '@/lib/utils';

const money = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

type Tab = 'summary' | 'officers' | 'customers' | 'applications' | 'bad_loans';

function SummaryCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: typeof WalletCards; color: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-500">{title}</p>
          <p className="text-xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

export function LocationDrilldownPage() {
  const { branchId } = useParams<{ branchId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('summary');
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'location', branchId, from, to],
    queryFn: () => reportsService.locationDrilldown(branchId!, { from: from || undefined, to: to || undefined }),
    enabled: !!branchId,
    staleTime: 30_000,
  });

  const TABS: Array<{ id: Tab; label: string; icon: typeof WalletCards }> = [
    { id: 'summary',      label: 'Summary',      icon: Building2 },
    { id: 'officers',     label: 'Officers',      icon: Users },
    { id: 'customers',    label: 'Customers',     icon: Users },
    { id: 'applications', label: 'Applications',  icon: FileText },
    { id: 'bad_loans',    label: 'Bad Loans',     icon: AlertTriangle },
  ];

  if (isLoading) return <PageLoader />;
  if (!data) return (
    <div className="text-center py-20 text-gray-500">Location not found or no data available.</div>
  );

  const { branch, summary } = data;

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="btn-ghost btn-icon w-8 h-8 text-gray-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="page-title">{branch.name}</h1>
            <p className="text-sm text-gray-500">Location report — {branch.code}</p>
          </div>
        </div>
        {/* Date filter */}
        <div className="flex items-center gap-2 text-sm">
          <input type="date" className="form-input h-8 text-xs w-36" value={from} onChange={e => { setFrom(e.target.value); }} placeholder="From" />
          <span className="text-gray-400">–</span>
          <input type="date" className="form-input h-8 text-xs w-36" value={to} onChange={e => { setTo(e.target.value); }} placeholder="To" />
          <button onClick={() => refetch()} className="btn-secondary btn-sm">Apply</button>
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <SummaryCard title="Officers"       value={summary.officers}                     icon={Users}        color="bg-blue-50 text-blue-600" />
        <SummaryCard title="Customers"      value={summary.totalCustomers}               icon={Users}        color="bg-violet-50 text-violet-600" />
        <SummaryCard title="Applications"   value={summary.totalApplications}            icon={FileText}     color="bg-amber-50 text-amber-600" />
        <SummaryCard title="Active Loans"   value={summary.activeLoans}                  icon={WalletCards}  color="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="Portfolio"      value={money(summary.portfolioValue)}        icon={Banknote}     color="bg-brand-50 text-brand-600" />
        <SummaryCard title="Repaid"         value={money(summary.totalRepayments)}       icon={TrendingDown} color="bg-emerald-50 text-emerald-600" />
        <SummaryCard title="Overdue"        value={money(summary.overdueValue)}          sub={`${summary.overdueInstallments} installments`} icon={AlertTriangle} color="bg-red-50 text-red-600" />
        <SummaryCard
          title="PAR"
          value={`${summary.par}%`}
          sub={summary.badLoans > 0 ? `${summary.badLoans} bad loan(s)` : 'No bad loans'}
          icon={TrendingDown}
          color={summary.par > 10 ? 'bg-red-50 text-red-600' : summary.par > 5 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${tab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
            {id === 'bad_loans' && summary.badLoans > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">{summary.badLoans}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab bodies */}

      {tab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Collection Cases</h3>
            {data.collectionCases.length > 0 ? (
              <div className="space-y-2">
                {data.collectionCases.map((c) => (
                  <div key={c.status} className="flex justify-between text-sm">
                    <span className="text-gray-600">{c.status.replace(/_/g, ' ')}</span>
                    <span className="font-semibold">{c._count._all}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No collection cases.</p>}
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Officers</h3>
            <div className="space-y-2">
              {data.officers.map((o) => (
                <div key={o.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium">{o.firstName} {o.lastName}</span>
                  <span className="text-gray-400 text-xs">{o.jobTitle ?? o.employeeId}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'officers' && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Employee ID</th><th>Name</th><th>Job Title</th></tr></thead>
            <tbody>
              {data.officers.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs">{o.employeeId}</td>
                  <td className="font-medium text-gray-800">{o.firstName} {o.lastName}</td>
                  <td className="text-sm text-gray-500">{o.jobTitle ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.officers.length === 0 && <div className="py-8 text-center text-sm text-gray-400">No officers assigned to this location.</div>}
        </div>
      )}

      {tab === 'customers' && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Customer #</th><th>Name</th><th>Phone</th><th>Status</th><th>Registered</th></tr></thead>
            <tbody>
              {data.customers.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs text-brand-600">{c.customerNumber}</td>
                  <td className="font-medium text-gray-800">{c.firstName} {c.lastName}</td>
                  <td className="text-sm text-gray-500">{c.phone}</td>
                  <td><Badge variant={c.status === 'ELIGIBLE' ? 'green' : c.status === 'BLACKLISTED' ? 'red' : 'gray'}>{c.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="text-xs text-gray-400">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.customers.length === 0 && <div className="py-8 text-center text-sm text-gray-400">No customers registered at this location.</div>}
        </div>
      )}

      {tab === 'applications' && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Application #</th><th>Customer</th><th>Product</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.applications.map((a) => (
                <tr key={a.id} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/loans/${a.id}`)}>
                  <td className="font-mono text-xs text-brand-600">{a.applicationNumber}</td>
                  <td className="text-sm font-medium text-gray-800">
                    {a.customer ? `${a.customer.firstName} ${a.customer.lastName}` : '—'}
                    <p className="text-xs text-gray-400">{a.customer?.customerNumber}</p>
                  </td>
                  <td className="text-xs text-gray-600">{a.loanProduct?.name ?? '—'}</td>
                  <td className="font-medium">₦{Number(a.amount).toLocaleString()}</td>
                  <td><Badge variant={a.status === 'DISBURSED' ? 'green' : a.status === 'REJECTED' ? 'red' : 'yellow'}>{a.status.replace(/_/g, ' ')}</Badge></td>
                  <td className="text-xs text-gray-400">{formatDate(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.applications.length === 0 && <div className="py-8 text-center text-sm text-gray-400">No applications in this period.</div>}
        </div>
      )}

      {tab === 'bad_loans' && (
        <div className="card overflow-hidden">
          <table className="table">
            <thead><tr><th>Loan #</th><th>Customer</th><th>Principal</th><th>Status</th></tr></thead>
            <tbody>
              {data.badLoans.map((l) => (
                <tr key={l.loanNumber}>
                  <td className="font-mono text-xs text-red-600">{l.loanNumber}</td>
                  <td className="font-medium text-gray-800">
                    {l.loanApplication?.customer
                      ? `${l.loanApplication.customer.firstName} ${l.loanApplication.customer.lastName}`
                      : '—'}
                    <p className="text-xs text-gray-400">{l.loanApplication?.customer?.customerNumber}</p>
                  </td>
                  <td className="font-medium text-red-600">₦{Number(l.principal).toLocaleString()}</td>
                  <td><Badge variant="red">{l.status.replace(/_/g, ' ')}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.badLoans.length === 0 && (
            <div className="py-8 text-center">
              <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No bad loans at this location.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
