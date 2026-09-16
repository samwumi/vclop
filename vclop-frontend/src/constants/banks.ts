/**
 * Nigerian Banks List with CBN Codes
 * Updated to include fintech banks (OPay, PalmPay, Kuda, etc.)
 * Source: Central Bank of Nigeria (CBN) and Paystack Bank List
 */

export interface Bank {
  name: string;
  code: string;
  type: 'commercial' | 'fintech' | 'microfinance';
}

export const NIGERIAN_BANKS: Bank[] = [
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

  // Fintech Banks (Digital Banks)
  { name: 'Carbon (Formerly One Finance)', code: '565', type: 'fintech' },
  { name: 'Kuda Bank', code: '50211', type: 'fintech' },
  { name: 'Moniepoint (Formerly TeamApt)', code: '50515', type: 'fintech' },
  { name: 'OPay', code: '999992', type: 'fintech' },
  { name: 'PalmPay', code: '999991', type: 'fintech' },
  { name: 'Paycom (Opay)', code: '999992', type: 'fintech' }, // OPay alternative name
  { name: 'Rubies Bank', code: '125', type: 'fintech' },
  { name: 'VFD Microfinance Bank', code: '566', type: 'fintech' },

  // Microfinance Banks
  { name: 'LAPO Microfinance Bank', code: '50563', type: 'microfinance' },
  { name: 'AB Microfinance Bank', code: '51204', type: 'microfinance' },
  { name: 'Accion Microfinance Bank', code: '602', type: 'microfinance' },
  { name: 'Covenant Microfinance Bank', code: '551', type: 'microfinance' },
  { name: 'Ekondo Microfinance Bank', code: '562', type: 'microfinance' },
  { name: 'Fina Trust Microfinance Bank', code: '608', type: 'microfinance' },
  { name: 'Fortis Microfinance Bank', code: '501', type: 'microfinance' },
  { name: 'IBILE Microfinance Bank', code: '51244', type: 'microfinance' },
  { name: 'Infinity MFB', code: '50457', type: 'microfinance' },
  { name: 'Mutual Benefits Microfinance Bank', code: '50552', type: 'microfinance' },
  { name: 'NPF Microfinance Bank', code: '552', type: 'microfinance' },
  { name: 'Regent Microfinance Bank', code: '50767', type: 'microfinance' },
  { name: 'Rephidim Microfinance Bank', code: '50994', type: 'microfinance' },
  { name: 'Page Financials', code: '50746', type: 'microfinance' },
];

/**
 * Get bank by code
 */
export function getBankByCode(code: string): Bank | undefined {
  return NIGERIAN_BANKS.find(b => b.code === code);
}

/**
 * Get bank name by code (for display)
 */
export function getBankName(code: string): string {
  const bank = getBankByCode(code);
  return bank ? `${bank.name} (${bank.code})` : code;
}

/**
 * Search banks by name or code
 */
export function searchBanks(query: string): Bank[] {
  if (!query) return NIGERIAN_BANKS;
  const lowerQuery = query.toLowerCase();
  return NIGERIAN_BANKS.filter(
    b => b.name.toLowerCase().includes(lowerQuery) || b.code.includes(query)
  );
}
