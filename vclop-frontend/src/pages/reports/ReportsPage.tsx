import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  BarChart2, Banknote, CircleAlert, Download,
  FileText, MapPin, TrendingDown, Users, WalletCards,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie,
} from 'recharts';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/Badge';
import { reportsService } from '@/services/reports.service';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { useAuthStore } from '@/stores/auth.store';

const money = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2', '#be185d', '#65a30d'];

type Tab = 'overview' | 'locations' | 'officers' | 'par';

function KpiCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string;
  icon: typeof BarChart2; color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-1 truncate">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
        </div>
        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

function DateFilter({ from, to, onFrom, onTo }: {
  from: string; to: string; onFrom: (v: string) => void; onTo: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">From</span>
      <input type="date" className="form-input h-8 text-xs w-36" value={from} onChange={e => onFrom(e.target.value)} />
      <span className="text-gray-500">To</span>
      <input type="date" className="form-input h-8 text-xs w-36" value={to} onChange={e => onTo(e.target.value)} />
    </div>
  );
}

export function ReportsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [tab, setTab] = useState<Tab>('overview');
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const [branchFilter, setBranchFilter] = useState('');

  const canExport = hasPermission('reports:export');

  const portfolio      = useQuery({ queryKey: ['reports', 'portfolio'],       queryFn: reportsService.portfolio,       staleTime: 60_000 });
  const disbursements  = useQuery({ queryKey: ['reports', 'disbursements', from, to],  queryFn: () => reportsService.disbursements(from || undefined, to || undefined), staleTime: 30_000 });
  const collections    = useQuery({ queryKey: ['reports', 'collections'],     queryFn: reportsService.collections,     staleTime: 60_000 });
  const locations      = useQuery({ queryKey: ['reports', 'location-summary'], queryFn: reportsService.locationSummary, staleTime: 60_000, enabled: tab === 'locations' || tab === 'overview' });
  const officers       = useQuery({ queryKey: ['reports', 'officers', from, to, branchFilter], queryFn: () => reportsService.officerPerformance({ from: from || undefined, to: to || undefined, branchId: branchFilter || undefined }), staleTime: 30_000, enabled: tab === 'officers' });
  const par            = useQuery({ queryKey: ['reports', 'par'],             queryFn: reportsService.parByLocation,   staleTime: 60_000, enabled: tab === 'par' });

  const TABS: Array<{ id: Tab; label: string; icon: typeof BarChart2 }> = [
    { id: 'overview',  label: 'Overview',         icon: BarChart2 },
    { id: 'locations', label: 'By Location',       icon: MapPin },
    { id: 'officers',  label: 'Officer Performance', icon: Users },
    { id: 'par',       label: 'Portfolio at Risk', icon: TrendingDown },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-gray-600" /> Reports
          </h1>
          <p className="page-description">Live portfolio, location, and officer performance analytics.</p>
        </div>
        {canExport && tab === 'locations' && (
          <button onClick={() => reportsService.exportLocationSummary()} className="btn-secondary btn-sm gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
        {canExport && tab === 'officers' && (
          <button onClick={() => reportsService.exportOfficerPerformance({ from: from || undefined, to: to || undefined, branchId: branchFilter || undefined })} className="btn-secondary btn-sm gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        )}
        {canExport && tab === 'overview' && (
          <button onClick={() => reportsService.exportDisbursements(from || undefined, to || undefined)} className="btn-secondary btn-sm gap-2">
            <Download className="w-4 h-4" /> Export Disbursements
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-max min-w-full sm:w-fit">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${tab === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Date filter (shown on relevant tabs) */}
      {(tab === 'overview' || tab === 'officers') && (
        <DateFilter from={from} to={to} onFrom={setFrom} onTo={setTo} />
      )}

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          {(portfolio.isLoading || disbursements.isLoading || collections.isLoading) ? <PageLoader /> : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <KpiCard title="Active Loans"          value={portfolio.data?.loans ?? 0}            sub="Total in portfolio"        icon={WalletCards}  color="bg-brand-50 text-brand-600" />
                <KpiCard title="Outstanding Portfolio" value={money(portfolio.data?.outstanding ?? 0)} sub="Unpaid scheduled balance" icon={Banknote}     color="bg-emerald-50 text-emerald-600" />
                <KpiCard title="Disbursements"         value={disbursements.data?.totalCount ?? 0}   sub={money(disbursements.data?.totalAmount ?? 0)} icon={FileText}   color="bg-violet-50 text-violet-600" />
                <KpiCard title="Overdue Installments"  value={collections.data?.overdue.length ?? 0} sub={money(collections.data?.totalRepayments ?? 0) + ' repaid'} icon={CircleAlert} color="bg-red-50 text-red-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Portfolio by status */}
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-gray-800 mb-4">Portfolio by Status</h2>
                  <div className="space-y-2">
                    {(portfolio.data?.byStatus ?? []).map((item) => (
                      <div key={item.status} className="flex justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-600">{item.status.replace(/_/g, ' ')}</span>
                        <span className="font-semibold">{item._count._all}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collection case status */}
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-gray-800 mb-4">Collection Cases by Status</h2>
                  {(collections.data?.cases?.length ?? 0) > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={collections.data!.cases} dataKey="_count._all" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={(props: any) => props.status?.replace(/_/g, ' ')}>
                          {collections.data!.cases.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => [v, 'Cases']} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-sm text-gray-400">No collection cases.</p>}
                </div>

                {/* Top locations bar chart */}
                {(locations.data?.length ?? 0) > 0 && (
                  <div className="card p-5 lg:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-sm font-semibold text-gray-800">Portfolio by Location</h2>
                      <button onClick={() => setTab('locations')} className="text-xs text-brand-600 hover:underline">View all →</button>
                    </div>
                    <div className="overflow-x-auto -mx-2 px-2">
                      <div style={{ minWidth: 320 }}>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={locations.data!.slice(0, 8)} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                            <XAxis dataKey="branchName" tick={{ fontSize: 11 }} />
                            <YAxis tickFormatter={(v) => `₦${(v / 1_000_000).toFixed(1)}M`} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: any) => money(Number(v) ?? 0)} />
                            <Bar dataKey="portfolioValue" name="Portfolio" radius={[4, 4, 0, 0]}>
                              {locations.data!.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Locations tab ─────────────────────────────────────────────────── */}
      {tab === 'locations' && (
        <>
          {locations.isLoading ? <PageLoader /> : (
            <>
              {/* Top 5 PAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(locations.data ?? []).slice(0, 3).map((loc, i) => (
                  <div
                    key={loc.branchId}
                    className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/reports/location/${loc.branchId}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">#{i + 1} by portfolio</p>
                        <p className="text-base font-bold text-gray-900 mt-0.5">{loc.branchName}</p>
                      </div>
                      <Badge variant={loc.par > 10 ? 'red' : loc.par > 5 ? 'yellow' : 'green'}>PAR {loc.par}%</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                      <span>Portfolio: <strong className="text-gray-800">{money(loc.portfolioValue)}</strong></span>
                      <span>Loans: <strong>{loc.activeLoans}</strong></span>
                      <span>Customers: <strong>{loc.customers}</strong></span>
                      <span>Officers: <strong>{loc.officers}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Full table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table min-w-full">
                    <thead>
                      <tr>
                        <th className="whitespace-nowrap">Location</th>
                        <th className="whitespace-nowrap">Officers</th>
                        <th className="whitespace-nowrap">Customers</th>
                        <th className="whitespace-nowrap">Active Loans</th>
                        <th className="whitespace-nowrap">Portfolio (₦)</th>
                        <th className="whitespace-nowrap">Overdue (₦)</th>
                        <th className="whitespace-nowrap">PAR</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(locations.data ?? []).map((loc) => (
                        <tr key={loc.branchId} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/reports/location/${loc.branchId}`)}>
                          <td className="font-medium text-gray-900 flex items-center gap-1.5 whitespace-nowrap">
                            <MapPin className="w-3.5 h-3.5 text-brand-600" /> {loc.branchName}
                          </td>
                          <td>{loc.officers}</td>
                          <td>{loc.customers}</td>
                          <td>{loc.activeLoans}</td>
                          <td className="font-medium whitespace-nowrap">{money(loc.portfolioValue)}</td>
                          <td className={`whitespace-nowrap ${loc.overdueValue > 0 ? 'text-red-600 font-medium' : ''}`}>{money(loc.overdueValue)}</td>
                          <td>
                            <Badge variant={loc.par > 10 ? 'red' : loc.par > 5 ? 'yellow' : 'green'}>
                              {loc.par}%
                            </Badge>
                          </td>
                          <td className="text-brand-600 text-xs whitespace-nowrap">View →</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Officers tab ──────────────────────────────────────────────────── */}
      {tab === 'officers' && (
        <>
          {officers.isLoading ? <PageLoader /> : (
            <>
              {/* Summary cards */}
              {(officers.data?.length ?? 0) > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <KpiCard
                    title="Total Officers"
                    value={officers.data!.length}
                    sub="Loan officers"
                    icon={Users}
                    color="bg-brand-50 text-brand-600"
                  />
                  <KpiCard
                    title="Total Customers"
                    value={officers.data!.reduce((s, o) => s + (o.customers ?? 0), 0)}
                    sub="Registered"
                    icon={Users}
                    color="bg-emerald-50 text-emerald-600"
                  />
                  <KpiCard
                    title="Total Applications"
                    value={officers.data!.reduce((s, o) => s + (o.applications ?? 0), 0)}
                    sub="Submitted"
                    icon={FileText}
                    color="bg-violet-50 text-violet-600"
                  />
                  <KpiCard
                    title="Total Disbursed"
                    value={money(officers.data!.reduce((s, o) => s + (o.disbursedAmount ?? 0), 0))}
                    sub={`${officers.data!.reduce((s, o) => s + (o.disbursements ?? 0), 0)} loans`}
                    icon={Banknote}
                    color="bg-amber-50 text-amber-600"
                  />
                </div>
              )}

              <div className="card">
                <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3">
                  <select className="form-input h-8 text-xs w-44" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                    <option value="">All locations</option>
                    {[...new Set((officers.data ?? []).map(o => o.branch?.name).filter(Boolean))].map(n => (
                      <option key={n} value={(officers.data ?? []).find(o => o.branch?.name === n)?.branch?.id ?? ''}>{n}</option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">{officers.data?.length ?? 0} officers</span>
                </div>
                {/* overflow-x-auto ensures the table scrolls horizontally instead of being clipped */}
                <div className="overflow-x-auto">
                  <table className="table min-w-full">
                    <thead>
                      <tr>
                        <th className="whitespace-nowrap">Officer</th>
                        <th className="whitespace-nowrap">Location</th>
                        <th className="whitespace-nowrap">Customers</th>
                        <th className="whitespace-nowrap">Applications</th>
                        <th className="whitespace-nowrap">Disbursed</th>
                        <th className="whitespace-nowrap">Amount (₦)</th>
                        <th className="whitespace-nowrap">Target (₦)</th>
                        <th className="whitespace-nowrap">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(officers.data ?? []).map((o) => (
                        <tr key={o.officerId}>
                          <td>
                            <p className="text-sm font-medium text-gray-800 whitespace-nowrap">{o.name}</p>
                            <p className="text-xs text-gray-400">{o.employeeId}</p>
                          </td>
                          <td className="text-xs text-gray-600 whitespace-nowrap">{o.branch?.name ?? '—'}</td>
                          <td>{o.customers}</td>
                          <td>{o.applications}</td>
                          <td>{o.disbursements}</td>
                          <td className="font-medium whitespace-nowrap">{money(o.disbursedAmount)}</td>
                          <td className="text-gray-500 whitespace-nowrap">{o.monthlyTarget > 0 ? money(o.monthlyTarget) : '—'}</td>
                          <td>
                            {o.monthlyTarget > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${o.progressPercentage >= 100 ? 'bg-emerald-500' : o.progressPercentage >= 60 ? 'bg-brand-600' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, o.progressPercentage)}%` }}
                                  />
                                </div>
                                <span className="text-xs text-gray-600 whitespace-nowrap">{o.progressPercentage.toFixed(0)}%</span>
                              </div>
                            ) : <span className="text-xs text-gray-400">No target</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {(officers.data?.length ?? 0) === 0 && (
                  <div className="py-10 text-center text-sm text-gray-400">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No loan officers found for this period.
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ── PAR tab ───────────────────────────────────────────────────────── */}
      {tab === 'par' && (
        <>
          {par.isLoading ? <PageLoader /> : (
            <div className="space-y-4">
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-gray-800 mb-4">Portfolio At Risk by Location</h2>
                <div className="overflow-x-auto">
                  <div style={{ minWidth: 320 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={par.data ?? []} layout="vertical" margin={{ left: 60, right: 20, top: 0, bottom: 0 }}>
                        <XAxis type="number" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="branchName" tick={{ fontSize: 11 }} width={60} />
                        <Tooltip formatter={(v: any) => [`${(Number(v) ?? 0).toFixed(2)}%`, 'PAR']} />
                        <Bar dataKey="par" name="PAR %" radius={[0, 4, 4, 0]}>
                          {(par.data ?? []).map((d, i) => (
                            <Cell key={i} fill={d.par > 10 ? '#dc2626' : d.par > 5 ? '#d97706' : '#16a34a'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                <table className="table min-w-full">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap">Location</th>
                      <th className="whitespace-nowrap">Portfolio (₦)</th>
                      <th className="whitespace-nowrap">Overdue (₦)</th>
                      <th className="whitespace-nowrap">PAR</th>
                      <th className="whitespace-nowrap">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(par.data ?? []).sort((a, b) => b.par - a.par).map((d) => (
                      <tr key={d.branchId} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/reports/location/${d.branchId}`)}>
                        <td className="font-medium text-gray-900 whitespace-nowrap">{d.branchName}</td>
                        <td className="whitespace-nowrap">{money(d.portfolioValue)}</td>
                        <td className={`whitespace-nowrap ${d.overdueValue > 0 ? 'text-red-600 font-medium' : ''}`}>{money(d.overdueValue)}</td>
                        <td className="font-bold whitespace-nowrap">{d.par.toFixed(2)}%</td>
                        <td>
                          <Badge variant={d.par > 10 ? 'red' : d.par > 5 ? 'yellow' : 'green'}>
                            {d.par > 10 ? 'High' : d.par > 5 ? 'Medium' : 'Low'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
