import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Check,
  Users,
  TrendingUp,
  Shield,
  Zap,
  Clock,
  DollarSign,
  Phone,
  Mail
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Acquire',
      description: 'Onboard customers digitally with KYC verification, credit scoring, and instant account creation.',
      cta: 'Start onboarding',
    },
    {
      icon: TrendingUp,
      title: 'Lend',
      description: 'Process loan applications in minutes with automated approval workflows and instant disbursement.',
      cta: 'Process loans',
    },
    {
      icon: DollarSign,
      title: 'Collect',
      description: 'Automate collections with virtual accounts, daily/weekly repayments, and instant reconciliation.',
      cta: 'Automate collections',
    },
  ];

  const stats = [
    { value: '10x', label: 'Faster loan processing' },
    { value: '99%', label: 'Uptime guarantee' },
    { value: '24/7', label: 'Customer access' },
    { value: '100%', label: 'Compliance coverage' },
  ];

  const comparisonData = [
    { 
      feature: 'Loan processing time',
      vclop: '2-4 hours',
      traditional: '3-7 days'
    },
    { 
      feature: 'Collection automation',
      vclop: 'Fully automated',
      traditional: 'Manual tracking'
    },
    { 
      feature: 'Payment reconciliation',
      vclop: 'Real-time',
      traditional: 'Weekly/Monthly'
    },
    { 
      feature: 'Compliance reporting',
      vclop: 'One-click export',
      traditional: 'Manual compilation'
    },
    { 
      feature: 'Branch coordination',
      vclop: 'Unified dashboard',
      traditional: 'Spreadsheet sharing'
    },
    { 
      feature: 'Customer insights',
      vclop: '360° view',
      traditional: 'Fragmented data'
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VCLOP</span>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            The digital platform built for microfinance
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-12 leading-relaxed">
            Acquire customers faster, lend with confidence, and collect automatically with VCLOP.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="max-w-5xl mx-auto mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-purple-600 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-12">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-6">{feature.description}</p>
                  <button
                    onClick={() => navigate('/login')}
                    className="text-purple-600 font-semibold hover:text-purple-700 transition-colors inline-flex items-center gap-2"
                  >
                    {feature.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Highlights */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-16">
            {/* Benefit 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
                  For Your Customers
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Get loans in minutes, not days
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Your customers submit applications digitally, get instant credit decisions, and receive funds directly to their accounts—all automated.
                </p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 text-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6" />
                    <span className="text-lg">2-4 hour processing</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <span className="text-lg">Secure KYC verification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6" />
                    <span className="text-lg">Instant disbursement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
              <div className="flex-1">
                <div className="inline-block px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-4">
                  For Your Operations
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Scale without hiring more staff
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Automate loan origination, collections, and reconciliation. Free your team to focus on customer relationships, not paperwork.
                </p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-8 text-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6" />
                    <span className="text-lg">Automated workflows</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6" />
                    <span className="text-lg">Real-time reconciliation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-6 h-6" />
                    <span className="text-lg">Multi-branch coordination</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
                  For Compliance
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                  Stay compliant, stay confident
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  Built-in regulatory compliance, complete audit trails, and one-click reporting. Always ready for regulators.
                </p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <span className="text-lg">NDPA compliant</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <span className="text-lg">Complete audit logs</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6" />
                    <span className="text-lg">Regulatory reports</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-4">
            Switch to smarter operations
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12">
            See how VCLOP compares to traditional methods
          </p>

          <div className="bg-white rounded-3xl overflow-hidden shadow-lg">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="p-4"></div>
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-purple-600">VCLOP</div>
              </div>
              <div className="p-4 text-center">
                <div className="text-sm font-semibold text-gray-500">Traditional</div>
              </div>
            </div>

            {comparisonData.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-3 border-b border-gray-100 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className="p-4 text-sm font-medium text-gray-900">{row.feature}</div>
                <div className="p-4 text-center">
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600 font-semibold">
                    <Check className="w-4 h-4" />
                    {row.vclop}
                  </span>
                </div>
                <div className="p-4 text-center text-sm text-gray-500">{row.traditional}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Join microfinance institutions modernizing with VCLOP
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start processing loans faster, collecting automatically, and scaling efficiently today.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <span className="text-xl font-bold text-gray-900">VCLOP</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                Virtual Credit and Loan Operations Platform. Modern microfinance management for forward-thinking institutions.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Sign in
                  </button>
                </li>
                <li>
                  <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Features
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  support@vclop.com
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  +234 (0) 800 000 0000
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">© 2026 VCLOP. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
