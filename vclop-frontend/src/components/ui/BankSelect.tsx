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
    onChange(bank.code);
    setIsOpen(false);
    setSearchQuery('');
  };

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
      {isOpen && containerRef.current && (
        <div style={{
          position: 'fixed',
          top: containerRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
          left: containerRef.current.getBoundingClientRect().left + window.scrollX,
          width: containerRef.current.offsetWidth,
          zIndex: 9999,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Search input */}
          <div style={{ 
            flexShrink: 0,
            backgroundColor: 'white', 
            borderBottom: '1px solid #e5e7eb', 
            padding: '8px',
            borderRadius: '12px 12px 0 0'
          }}>
            <div style={{ position: 'relative' }}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Type to search banks..."
                style={{
                  width: '100%',
                  paddingLeft: '36px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Bank list */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto', 
            padding: '4px'
          }}>
            {filteredBanks.length === 0 ? (
              <p style={{ padding: '24px 16px', textAlign: 'center', fontSize: '14px', color: '#9ca3af' }}>
                No banks found matching "{searchQuery}"
              </p>
            ) : (
              <div>
                {filteredBanks.map(bank => (
                  <button
                    key={bank.code}
                    type="button"
                    onClick={() => handleSelect(bank)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      margin: '2px 0',
                      border: 'none',
                      backgroundColor: bank.code === value ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      fontSize: '14px',
                      borderRadius: '6px',
                      color: bank.code === value ? '#1e40af' : '#374151',
                      fontWeight: bank.code === value ? '500' : '400'
                    }}
                    onMouseOver={(e) => {
                      if (bank.code !== value) e.currentTarget.style.backgroundColor = '#f9fafb';
                    }}
                    onMouseOut={(e) => {
                      if (bank.code !== value) e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{bank.name}</span>
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{bank.code}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
