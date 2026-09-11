import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Activity } from 'lucide-react';
import { api } from '@/lib/axios';

interface ComplianceArea {
  id: string;
  name: string;
  category: string;
  items: ComplianceItem[];
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  completionPercentage: number;
}

interface ComplianceItem {
  name: string;
  status: 'IMPLEMENTED' | 'PARTIAL' | 'NOT_IMPLEMENTED';
  notes: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export function AuditCompliancePage() {
  // TODO: This will fetch real audit stats from backend
  const { data: auditStats } = useQuery({
    queryKey: ['audit', 'stats'],
    queryFn: async () => {
      const res = await api.get('/audit/stats');
      return res.data?.data;
    },
  });

  // Compliance framework based on your 8 categories
  const complianceAreas: ComplianceArea[] = [
    {
      id: '1',
      name: 'Identity & Access Management',
      category: 'IAM',
      status: 'PARTIAL',
      completionPercentage: 85,
      items: [
        { name: 'User authentication (JWT)', status: 'IMPLEMENTED', notes: 'Fully implemented with JWT tokens', priority: 'CRITICAL' },
        { name: 'Role-based access control (RBAC)', status: 'IMPLEMENTED', notes: 'Roles and permissions system active', priority: 'CRITICAL' },
        { name: 'Individual user permissions', status: 'IMPLEMENTED', notes: 'Grant/revoke/inherit per user', priority: 'HIGH' },
        { name: 'Multi-factor authentication (MFA)', status: 'NOT_IMPLEMENTED', notes: 'Needs implementation for high-risk accounts', priority: 'CRITICAL' },
        { name: 'Session management', status: 'IMPLEMENTED', notes: 'Token refresh and expiry implemented', priority: 'HIGH' },
        { name: 'Password policy enforcement', status: 'PARTIAL', notes: 'Basic requirements, needs strength meter', priority: 'MEDIUM' },
      ],
    },
    {
      id: '2',
      name: 'Customer/KYC',
      category: 'KYC',
      status: 'PARTIAL',
      completionPercentage: 70,
      items: [
        { name: 'Customer data collection', status: 'IMPLEMENTED', notes: 'Comprehensive profile with mandatory BVN/NIN', priority: 'CRITICAL' },
        { name: 'BVN validation', status: 'IMPLEMENTED', notes: 'Via Paystack DVA integration', priority: 'CRITICAL' },
        { name: 'Document upload & storage', status: 'IMPLEMENTED', notes: 'File storage with metadata', priority: 'HIGH' },
        { name: 'Document verification workflow', status: 'PARTIAL', notes: 'Manual verification, needs checklist', priority: 'HIGH' },
        { name: 'Consent & privacy notices', status: 'NOT_IMPLEMENTED', notes: 'NDPA compliance requirement', priority: 'CRITICAL' },
        { name: 'Data retention policy', status: 'NOT_IMPLEMENTED', notes: 'Needs automated deletion after 7 years', priority: 'MEDIUM' },
      ],
    },
    {
      id: '3',
      name: 'Loan Management',
      category: 'LOANS',
      status: 'COMPLIANT',
      completionPercentage: 95,
      items: [
        { name: 'Application workflow', status: 'IMPLEMENTED', notes: 'Draft → Submitted → Under Review → Approved/Rejected', priority: 'CRITICAL' },
        { name: 'Compliance assessment', status: 'IMPLEMENTED', notes: 'Field visits, document checks, risk scoring', priority: 'CRITICAL' },
        { name: 'Multi-level approval', status: 'IMPLEMENTED', notes: 'Compliance + Internal Control + Accountant Head', priority: 'CRITICAL' },
        { name: 'Disbursement controls', status: 'IMPLEMENTED', notes: 'Approval required, auto virtual account creation', priority: 'CRITICAL' },
        { name: 'Loan closure process', status: 'IMPLEMENTED', notes: 'Auto-close when fully paid', priority: 'HIGH' },
        { name: 'Early repayment handling', status: 'PARTIAL', notes: 'Manual calculation needed', priority: 'MEDIUM' },
      ],
    },
    {
      id: '4',
      name: 'Financial Controls',
      category: 'FINANCIAL',
      status: 'PARTIAL',
      completionPercentage: 65,
      items: [
        { name: 'Payment tracking', status: 'IMPLEMENTED', notes: 'Paystack DVA webhook integration', priority: 'CRITICAL' },
        { name: 'Repayment allocation', status: 'IMPLEMENTED', notes: 'Interest first, then principal', priority: 'CRITICAL' },
        { name: 'Manual payment fetching', status: 'IMPLEMENTED', notes: 'Backup for webhook failures', priority: 'HIGH' },
        { name: 'Reconciliation dashboard', status: 'NOT_IMPLEMENTED', notes: 'Daily reconciliation report needed', priority: 'CRITICAL' },
        { name: 'Payment reversals', status: 'NOT_IMPLEMENTED', notes: 'Error correction mechanism needed', priority: 'HIGH' },
        { name: 'Overpayment handling', status: 'PARTIAL', notes: 'Tracked but no refund process', priority: 'MEDIUM' },
      ],
    },
    {
      id: '5',
      name: 'Audit Trail',
      category: 'AUDIT',
      status: 'PARTIAL',
      completionPercentage: 60,
      items: [
        { name: 'User authentication events', status: 'IMPLEMENTED', notes: 'Login, logout, failed attempts', priority: 'CRITICAL' },
        { name: 'Data modifications', status: 'PARTIAL', notes: 'Some CRUD operations logged, needs enhancement', priority: 'CRITICAL' },
        { name: 'Financial transactions', status: 'PARTIAL', notes: 'Disbursements logged, repayments need detail', priority: 'CRITICAL' },
        { name: 'Permission changes', status: 'IMPLEMENTED', notes: 'Role and user permission modifications', priority: 'HIGH' },
        { name: 'Document access logging', status: 'NOT_IMPLEMENTED', notes: 'Track who views sensitive documents', priority: 'HIGH' },
        { name: 'System configuration changes', status: 'PARTIAL', notes: 'Some settings changes logged', priority: 'MEDIUM' },
      ],
    },
    {
      id: '6',
      name: 'Security',
      category: 'SECURITY',
      status: 'PARTIAL',
      completionPercentage: 55,
      items: [
        { name: 'Data encryption at rest', status: 'PARTIAL', notes: 'Database encryption, file encryption needed', priority: 'CRITICAL' },
        { name: 'Data encryption in transit', status: 'IMPLEMENTED', notes: 'HTTPS enforced', priority: 'CRITICAL' },
        { name: 'Session security', status: 'IMPLEMENTED', notes: 'JWT with expiry and refresh', priority: 'HIGH' },
        { name: 'API rate limiting', status: 'PARTIAL', notes: 'Throttling on some endpoints', priority: 'HIGH' },
        { name: 'File upload validation', status: 'PARTIAL', notes: 'Type checking, needs virus scanning', priority: 'HIGH' },
        { name: 'SQL injection prevention', status: 'IMPLEMENTED', notes: 'Prisma ORM parameterization', priority: 'CRITICAL' },
      ],
    },
    {
      id: '7',
      name: 'NDPA Compliance',
      category: 'NDPA',
      status: 'NON_COMPLIANT',
      completionPercentage: 30,
      items: [
        { name: 'Data consent tracking', status: 'NOT_IMPLEMENTED', notes: 'Must obtain and log consent', priority: 'CRITICAL' },
        { name: 'Privacy policy', status: 'NOT_IMPLEMENTED', notes: 'Customer-facing privacy notice', priority: 'CRITICAL' },
        { name: 'Data subject access requests', status: 'NOT_IMPLEMENTED', notes: 'Customers can request their data', priority: 'CRITICAL' },
        { name: 'Right to deletion', status: 'NOT_IMPLEMENTED', notes: 'Data erasure upon request', priority: 'HIGH' },
        { name: 'Breach notification procedure', status: 'NOT_IMPLEMENTED', notes: 'Report to NITDA within 72 hours', priority: 'CRITICAL' },
        { name: 'Data transfer controls', status: 'NOT_IMPLEMENTED', notes: 'Log cross-border data transfers', priority: 'MEDIUM' },
      ],
    },
    {
      id: '8',
      name: 'Business Continuity',
      category: 'BCP',
      status: 'NON_COMPLIANT',
      completionPercentage: 25,
      items: [
        { name: 'Automated database backups', status: 'PARTIAL', notes: 'Hostinger daily backups, need verification', priority: 'CRITICAL' },
        { name: 'Backup restoration testing', status: 'NOT_IMPLEMENTED', notes: 'Test restore monthly', priority: 'CRITICAL' },
        { name: 'Disaster recovery plan', status: 'NOT_IMPLEMENTED', notes: 'Written DR procedures', priority: 'HIGH' },
        { name: 'Incident response plan', status: 'NOT_IMPLEMENTED', notes: 'Security incident playbook', priority: 'HIGH' },
        { name: 'System health monitoring', status: 'PARTIAL', notes: 'Basic health check, needs alerting', priority: 'MEDIUM' },
        { name: 'Uptime tracking', status: 'NOT_IMPLEMENTED', notes: 'SLA monitoring', priority: 'LOW' },
      ],
    },
  ];

  const overallCompliance = Math.round(
    complianceAreas.reduce((sum, area) => sum + area.completionPercentage, 0) / complianceAreas.length
  );

  const criticalGaps = complianceAreas.flatMap(area =>
    area.items
      .filter(item => item.priority === 'CRITICAL' && item.status !== 'IMPLEMENTED')
      .map(item => ({ area: area.name, item: item.name, status: item.status }))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit & Compliance Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            VCLop system compliance across 8 regulatory & security domains
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">{overallCompliance}%</div>
          <div className="text-xs text-gray-500">Overall Compliance</div>
        </div>
      </div>

      {/* Critical Gaps Alert */}
      {criticalGaps.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-900">
                {criticalGaps.length} Critical Gap{criticalGaps.length > 1 ? 's' : ''} Require Immediate Attention
              </h3>
              <ul className="mt-2 space-y-1">
                {criticalGaps.slice(0, 5).map((gap, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    • {gap.area}: {gap.item}
                  </li>
                ))}
                {criticalGaps.length > 5 && (
                  <li className="text-xs text-red-600 font-medium">
                    + {criticalGaps.length - 5} more critical items
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Audit Stats Summary */}
      {auditStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{auditStats.total || 0}</div>
                <div className="text-xs text-gray-500">Audit Events (7 days)</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-amber-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{auditStats.failedLogins || 0}</div>
                <div className="text-xs text-gray-500">Failed Logins</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{complianceAreas.filter(a => a.status === 'COMPLIANT').length}</div>
                <div className="text-xs text-gray-500">Compliant Areas</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{criticalGaps.length}</div>
                <div className="text-xs text-gray-500">Critical Gaps</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {complianceAreas.map((area) => (
          <div key={area.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Area Header */}
            <div className={`p-4 ${
              area.status === 'COMPLIANT' ? 'bg-emerald-50 border-b border-emerald-200' :
              area.status === 'PARTIAL' ? 'bg-amber-50 border-b border-amber-200' :
              'bg-red-50 border-b border-red-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className={`w-5 h-5 ${
                    area.status === 'COMPLIANT' ? 'text-emerald-600' :
                    area.status === 'PARTIAL' ? 'text-amber-600' :
                    'text-red-600'
                  }`} />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{area.name}</h3>
                    <p className="text-xs text-gray-500">{area.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{area.completionPercentage}%</div>
                  <div className="text-xs text-gray-500">{area.status.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
              {area.items.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    item.status === 'IMPLEMENTED' ? 'bg-emerald-500' :
                    item.status === 'PARTIAL' ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">{item.name}</p>
                      {item.priority === 'CRITICAL' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
