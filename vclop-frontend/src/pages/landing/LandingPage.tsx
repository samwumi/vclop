import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Users, 
  FileCheck, 
  BarChart3, 
  Zap,
  CheckCircle2,
  Clock,
  Lock,
  Globe
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Comprehensive customer profiles with KYC verification, credit scoring, and 360° view of all interactions.',
      color: 'blue',
    },
    {
      icon: TrendingUp,
      title: 'Loan Origination',
      description: 'Streamlined loan application workflow with automated approval chains and disbursement tracking.',
      color: 'emerald',
    },
    {
      icon: BarChart3,
      title: 'Automated Collections',
      description: 'Virtual account integration with Paystack for automatic payment reconciliation and daily/weekly repayments.',
      color: 'purple',
    },
    {
      icon: FileCheck,
      title: 'Compliance & Audit',
      description: 'Built-in compliance checks, NDPA consent tracking, and comprehensive audit trails for regulatory requirements.',
      color: 'amber',
    },
    {
      icon: Shield,
      title: 'Risk Management',
      description: 'Real-time portfolio monitoring, delinquency tracking, and early warning systems for at-risk accounts.',
      color: 'red',
    },
    {
      icon: Zap,
      title: 'Real-time Reporting',
      description: 'Dynamic dashboards with PAR analysis, collection metrics, and operational KPIs at your fingertips.',
      color: 'indigo',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Save Time',
      text: 'Reduce loan processing time from days to hours with automated workflows',
    },
    {
      icon: Lock,
      title: 'Stay Compliant',
      text: 'Meet regulatory requirements with built-in compliance and audit features',
    },
    {
      icon: Globe,
      title: 'Scale Efficiently',
      text: 'Support multiple branches and thousands of customers on one platform',
    },
  ];

  const stats = [
    { value: '24hrs', label: 'Loan Processing' },
    { value: '100%', label: 'Audit Coverage' },
    { value: 'Real-time', label: 'Reconciliation' },
    { value: '24/7', label: 'Access' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VCLOP</h1>
                <p className="text-xs text-gray-500">Microfinance Management Platform</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary btn-sm flex items-center gap-2"
            >
              Staff Login
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-purple-50 py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Modern Microfinance Management
                </span>
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Streamline Your
                <span className="text-brand-600"> Lending Operations</span>
              </h1>
              <p className="text-lg text-gray-600 leading-relaxed">
                VCLOP is a comprehensive loan and operations management platform designed for microfinance institutions. 
                Manage customers, process loans, automate collections, and stay compliant—all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="btn-primary btn-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                  Access Platform
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="#features"
                  className="btn-secondary btn-lg"
                >
                  Learn More
                </a>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-gray-200">
                {stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-2xl font-bold text-brand-600">{stat.value}</div>
                    <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="bg-gradient-to-r from-brand-600 to-purple-600 h-12 flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  <span className="ml-4 text-white text-sm font-medium">VCLOP Dashboard</span>
                </div>
                <div className="p-6 space-y-4">
                  {/* Mock Dashboard */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="text-xs text-blue-600 font-medium mb-1">Active Loans</div>
                      <div className="text-2xl font-bold text-blue-900">1,247</div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                      <div className="text-xs text-emerald-600 font-medium mb-1">Collections</div>
                      <div className="text-2xl font-bold text-emerald-900">₦2.4M</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-700">Portfolio Health</span>
                      <span className="text-xs text-emerald-600 font-semibold">98.5%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-3 bg-gray-300 rounded w-32 mb-1"></div>
                          <div className="h-2 bg-gray-200 rounded w-24"></div>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-200 rounded-full opacity-50 blur-3xl"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-brand-200 rounded-full opacity-50 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-brand-100 text-brand-700 rounded-full text-sm font-medium mb-4">
              Platform Features
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your MFI
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From customer onboarding to loan disbursement and collections, VCLOP handles it all with enterprise-grade security and reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 border-blue-200',
                emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
                purple: 'bg-purple-100 text-purple-600 border-purple-200',
                amber: 'bg-amber-100 text-amber-600 border-amber-200',
                red: 'bg-red-100 text-red-600 border-red-200',
                indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200',
              };
              return (
                <div
                  key={idx}
                  className="group p-6 bg-white border border-gray-200 rounded-xl hover:shadow-lg hover:border-brand-300 transition-all duration-300"
                >
                  <div className={`w-14 h-14 rounded-lg border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform ${colorClasses[feature.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-brand-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Why Microfinance Institutions Choose VCLOP
            </h2>
            <p className="text-lg text-brand-100 max-w-2xl mx-auto">
              Built by industry experts with deep understanding of microfinance operations
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center mx-auto mb-5 border border-white/20">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                  <p className="text-brand-100 leading-relaxed">{benefit.text}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => navigate('/login')}
              className="btn-lg bg-white text-brand-600 hover:bg-gray-50 font-semibold shadow-xl hover:shadow-2xl transition-all inline-flex items-center gap-2"
            >
              Get Started Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-6 text-brand-600" />
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Operations?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join leading microfinance institutions using VCLOP to streamline operations, reduce risk, and grow their portfolios.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary btn-lg shadow-lg hover:shadow-xl transition-shadow inline-flex items-center gap-2"
          >
            Access Platform
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">V</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">VCLOP</h3>
                  <p className="text-xs text-gray-500">Virtual Credit and Loan Operations Platform</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                A comprehensive microfinance management solution designed to streamline loan operations, 
                automate collections, and ensure regulatory compliance.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Staff Login</button></li>
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 VCLOP. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .bg-grid-pattern {
          background-image: 
            linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
}
