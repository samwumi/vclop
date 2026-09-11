import { useQuery } from '@tanstack/react-query';
import { BarChart2, Banknote, CircleAlert, FileText, WalletCards } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { reportsService } from '@/services/reports.service';
import { PageLoader } from '@/components/ui/LoadingScreen';

const money = (value: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
function ReportCard({ title, value, icon: Icon, detail }: { title: string; value: string | number; icon: typeof BarChart2; detail: string }) { return <div className="card p-5"><div className="flex justify-between items-start"><div><p className="text-sm text-gray-500">{title}</p><p className="text-2xl font-bold text-gray-900 mt-1">{value}</p><p className="text-xs text-gray-400 mt-2">{detail}</p></div><div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center"><Icon className="w-5 h-5" /></div></div></div>; }

export function ReportsPage() {
  const portfolio = useQuery({ queryKey: ['reports', 'portfolio'], queryFn: reportsService.portfolio });
  const disbursements = useQuery({ queryKey: ['reports', 'disbursements'], queryFn: reportsService.disbursements });
  const collections = useQuery({ queryKey: ['reports', 'collections'], queryFn: reportsService.collections });
  if (portfolio.isLoading || disbursements.isLoading || collections.isLoading) return <PageLoader />;
  return <div><Breadcrumbs /><div className="page-header"><div><h1 className="page-title flex items-center gap-2"><BarChart2 className="w-5 h-5 text-gray-600" /> Reports</h1><p className="page-description">Live portfolio, disbursement, and collection performance.</p></div></div><div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6"><ReportCard title="Loans in Portfolio" value={portfolio.data?.loans ?? 0} icon={WalletCards} detail="All loans" /><ReportCard title="Outstanding Portfolio" value={money(portfolio.data?.outstanding ?? 0)} icon={Banknote} detail="Unpaid scheduled balance" /><ReportCard title="Disbursements" value={disbursements.data?.totalCount ?? 0} icon={FileText} detail={money(disbursements.data?.totalAmount ?? 0)} /><ReportCard title="Overdue Installments" value={collections.data?.overdue.length ?? 0} icon={CircleAlert} detail={money(collections.data?.totalRepayments ?? 0) + ' repaid'} /></div><div className="card"><div className="card-body"><h2 className="font-semibold text-gray-800 mb-4">Portfolio by Status</h2><div className="space-y-3">{portfolio.data?.byStatus.map((item) => <div key={item.status} className="flex justify-between text-sm"><span className="text-gray-600">{item.status.replace(/_/g, ' ')}</span><span className="font-semibold text-gray-900">{item._count._all}</span></div>) ?? <p className="text-sm text-gray-500">No portfolio data available.</p>}</div></div></div></div>;
}
