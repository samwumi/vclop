import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Inline banks list (fallback if constants/banks not available)
interface Bank {
  name: string;
  code: string;
  type: 'commercial' | 'fintech' | 'microfinance';
}

const NIGERIAN_BANKS: Bank[] = [
  // Commercial Banks
  { name: 'Access Bank', code: '044', type: 'commercial' },
  { name: 'Citibank Nigeria', code: '023', type: 'commercial' },
  { name: 'Ecobank Nigeria', code: '050', type: 'commercial' },
  { name: 'Fidelity Bank', code: '070', type: 'commercial' },
  { name: 'First Bank of Nigeria', code: '011', type: 'commercial' },
  { name: 'First City Monument Bank (FCMB)', code: '214', type: 'commercial' },
  { name: 'Globus Bank', code: '00103', type: 'commercial' },
  { name: 'Guaranty Trust Bank (GTBank)', code: '058', type: 'commercial' },
  { name: 'Heritage Bank', code: '030', type: 'commercial' },
  { name: 'Keystone Bank', code: '082', type: 'commercial' },
  { name: 'Polaris Bank', code: '076', type: 'commercial' },
  { name: 'Providus Bank', code: '101', type: 'commercial' },
  { name: 'Stanbic IBTC Bank', code: '221', type: 'commercial' },
  { name: 'Standard Chartered Bank', code: '068', type: 'commercial' },
  { name: 'Sterling Bank', code: '232', type: 'commercial' },
  { name: 'SunTrust Bank', code: '100', type: 'commercial' },
  { name: 'Titan Trust Bank', code: '102', type: 'commercial' },
  { name: 'Union Bank of Nigeria', code: '032', type: 'commercial' },
  { name: 'United Bank for Africa (UBA)', code: '033', type: 'commercial' },
  { name: 'Unity Bank', code: '215', type: 'commercial' },
  { name: 'Wema Bank', code: '035', type: 'commercial' },
  { name: 'Zenith Bank', code: '057', type: 'commercial' },
  // Fintech Banks
  { name: 'Carbon', code: '565', type: 'fintech' },
  { name: 'Kuda Bank', code: '50211', type: 'fintech' },
  { name: 'Moniepoint', code: '50515', type: 'fintech' },
  { name: 'OPay', code: '999992', type: 'fintech' },
  { name: 'PalmPay', code: '999991', type: 'fintech' },
  { name: 'Rubies Bank', code: '125', type: 'fintech' },
  { name: 'VFD Microfinance Bank', code: '566', type: 'fintech' },
  // Microfinance Banks
  { name: 'LAPO Microfinance Bank', code: '50563', type: 'microfinance' },
  { name: 'AB Microfinance Bank', code: '51204', type: 'microfinance' },
  { name: 'Accion Microfinance Bank', code: '602', type: 'microfinance' },
  { name: 'Covenant Microfinance Bank', code: '551', type: 'microfinance' },
  { name: 'Ekondo Microfinance Bank', code: '562', type: 'microfinance' },
  { name: 'NPF Microfinance Bank', code: '552', type: 'microfinance' },
];

interface BankSelectProps {
  value: string;
  onChange: (bankCode: string) => void;
  className?: string;
  placeholder?: string;
}

export function BankSelect({ value, onChange, className = '', placeholder = 'Search or select bank...' }: BankSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // DEBUG: Log banks array
  console.log('BankSelect: NIGERIAN_BANKS count =', NIGERIAN_BANKS.length);
  console.log('BankSelect: First 3 banks =', NIGERIAN_BANKS.slice(0, 3));

  // Get selected bank
  const selectedBank = NIGERIAN_BANKS.find(b => b.code === value);

  // Filter banks by search query
  const filteredBanks = searchQuery
    ? NIGERIAN_BANKS.filter(
        b =>
          b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          b.code.includes(searchQuery)
      )
    : NIGERIAN_BANKS;

  // Group filtered banks by type
  const groupedBanks = {
    commercial: filteredBanks.filter(b => b.type === 'commercial'),
    fintech: filteredBanks.filter(b => b.type === 'fintech'),
    microfinance: filteredBanks.filter(b => b.type === 'microfinance'),
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (bank: Bank) => {
    console.log('BankSelect: Selected bank =', bank);
    onChange(bank.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  // DEBUG: Log when dropdown opens/closes
  useEffect(() => {
    console.log('BankSelect: isOpen =', isOpen);
    console.log('BankSelect: filteredBanks count =', filteredBanks.length);
  }, [isOpen, filteredBanks.length]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Selected value or trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="form-input flex items-center justify-between w-full text-left cursor-pointer hover:border-gray-300"
      >
        <span className={selectedBank ? 'text-gray-900' : 'text-gray-400'}>
          {selectedBank ? `${selectedBank.name} (${selectedBank.code})` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-80 overflow-hidden">
          {/* Search input */}
          <div className="sticky top-0 bg-white border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to search banks..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>
          </div>

          {/* Bank list */}
          <div className="overflow-y-auto max-h-64">
            {filteredBanks.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No banks found matching "{searchQuery}"
              </div>
            ) : (
              <>
                {/* Commercial Banks */}
                {groupedBanks.commercial.length > 0 && (
                  <div>
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-100">
                      Commercial Banks
                    </div>
                    {groupedBanks.commercial.map(bank => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => handleSelect(bank)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                          bank.code === value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{bank.name}</span>
                          <span className="text-xs text-gray-400 font-mono">{bank.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Fintech Banks */}
                {groupedBanks.fintech.length > 0 && (
                  <div>
                    <div className="sticky top-0 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 uppercase tracking-wide border-b border-emerald-100">
                      Fintech Banks (OPay, PalmPay, Kuda, etc.)
                    </div>
                    {groupedBanks.fintech.map(bank => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => handleSelect(bank)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                          bank.code === value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{bank.name}</span>
                          <span className="text-xs text-gray-400 font-mono">{bank.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Microfinance Banks */}
                {groupedBanks.microfinance.length > 0 && (
                  <div>
                    <div className="sticky top-0 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-100">
                      Microfinance Banks
                    </div>
                    {groupedBanks.microfinance.map(bank => (
                      <button
                        key={bank.code}
                        type="button"
                        onClick={() => handleSelect(bank)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 transition-colors ${
                          bank.code === value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{bank.name}</span>
                          <span className="text-xs text-gray-400 font-mono">{bank.code}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
