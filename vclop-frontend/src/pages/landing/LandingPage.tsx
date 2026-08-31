import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Check,
  Clock,
  Shield,
  Zap,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  Users,
  CheckCircle2
} from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const loanProducts = [
    {
      title: 'Daily Loans',
      rate: '0.625%',
      period: '24 days',
      icon: Zap,
      features: [
        'Get funded in 2-4 hours',
        'Repay daily for 24 business days',
        'Flexible repayment schedule',
        'No hidden charges',
      ],
      color: 'purple',
    },
    {
      title: 'Weekly Loans',
      rate: '0.446%',
      period: '8 weeks',
      icon: Calendar,
      features: [
        'Fast approval process',
        'Weekly repayments for 8 weeks',
        'Ideal for longer projects',
        'Competitive interest rates',
      ],
      color: 'blue',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Apply Online',
      description: 'Complete our simple application form in minutes. No paperwork, no long queues.',
    },
    {
      step: '2',
      title: 'Get Approved',
      description: 'Our team reviews your application instantly. Most approvals happen within hours.',
    },
    {
      step: '3',
      title: 'Receive Funds',
      description: 'Money hits your account the same day. Start growing your business immediately.',
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: 'Fast Approval',
      description: 'Get your loan approved in 2-4 hours, not days',
    },
    {
      icon: Shield,
      title: 'Secure & Licensed',
      description: 'Fully licensed microfinance bank with CBN approval',
    },
    {
      icon: TrendingUp,
      title: 'Grow Your Business',
      description: 'Access working capital to expand and scale',
    },
    {
      icon: Users,
      title: 'Trusted by Thousands',
      description: 'Join businesses already growing with us',
    },
  ];

  const faqs = [
    {
      q: 'What documents do I need?',
      a: 'Valid ID, proof of business registration, and bank statement.',
    },
    {
      q: 'How fast can I get my loan?',
      a: 'Most applications are approved within 2-4 hours. Funds are disbursed the same day.',
    },
    {
      q: 'Can I repay early?',
      a: 'Yes! You can repay your loan early without any penalties.',
    },
    {
      q: 'What if I miss a payment?',
      a: 'Contact us immediately. We work with you to find a solution.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-lg border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">VCLOP</span>
                <span className="text-xs text-gray-500 block -mt-1">Microfinance Bank</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="#loans" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                Loans
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                How It Works
              </a>
              <button
                onClick={() => navigate('/login')}
                className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-6">
            Licensed Microfinance Bank
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Get business loans in hours, not weeks
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
            Fast, flexible loans for Nigerian businesses. Apply online today and get funded the same day.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Apply for a loan
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="tel:+2348000000000"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-gray-200 text-gray-900 rounded-full font-semibold text-lg hover:border-gray-300 transition-all"
            >
              <Phone className="w-5 h-5" />
              Call us
            </a>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>CBN Licensed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>Same Day Approval</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span>No Hidden Fees</span>
            </div>
          </div>
        </div>
      </section>

      {/* Loan Products */}
      <section id="loans" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose your loan plan
            </h2>
            <p className="text-lg text-gray-600">
              Flexible options designed for Nigerian businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {loanProducts.map((product, idx) => {
              const Icon = product.icon;
              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-8 lg:p-10 shadow-lg hover:shadow-2xl transition-all border-2 ${
                    product.color === 'purple' ? 'border-purple-200' : 'border-blue-200'
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6 ${
                    product.color === 'purple' ? 'bg-purple-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-7 h-7 ${
                      product.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h3>
                  <div className="flex items-baseline gap-2 mb-6">
                    <span className={`text-5xl font-bold ${
                      product.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                    }`}>
                      {product.rate}
                    </span>
                    <span className="text-gray-600">daily</span>
                  </div>
                  <div className="text-gray-600 mb-6">
                    <span className="font-semibold">Repayment period:</span> {product.period}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {product.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          product.color === 'purple' ? 'text-purple-600' : 'text-blue-600'
                        }`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full py-4 rounded-full font-semibold text-lg transition-all ${
                      product.color === 'purple'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Apply now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-lg text-gray-600">
              Get your business loan in 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {howItWorks.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Why businesses trust us
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div key={idx} className="text-center">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
                    <Icon className="w-7 h-7 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">
              Join thousands of businesses growing with VCLOP
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">₦2.4B+</div>
                <div className="text-purple-200">Disbursed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5,000+</div>
                <div className="text-purple-200">Active Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-purple-200">Satisfaction Rate</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2-4hrs</div>
                <div className="text-purple-200">Average Approval</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Apply now and get your loan approved in hours
          </p>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-purple-600 text-white rounded-full font-semibold text-lg hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            Apply for a loan
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">V</span>
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-900">VCLOP</span>
                  <span className="text-xs text-gray-500 block -mt-1">Microfinance Bank</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed max-w-sm mb-4">
                Licensed microfinance bank providing fast, flexible business loans to Nigerian entrepreneurs.
              </p>
              <p className="text-xs text-gray-500">
                CBN Licensed | RC 123456
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#loans" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Our Loans
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    Apply Now
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  +234 (0) 800 000 0000
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  loans@vclop.com
                </li>
                <li className="text-sm text-gray-600">
                  123 Business District,<br />
                  Lagos, Nigeria
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">© 2026 VCLOP Microfinance Bank. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Terms & Conditions
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
