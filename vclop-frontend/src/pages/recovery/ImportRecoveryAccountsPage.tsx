import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { recoveryService } from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ImportRow {
  customerName: string;
  loanOfficer?: string;
  disbursedDate: string;
  expiredDate?: string;
  amountDisbursed: number;
  interest?: number;
  balance: number;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

// Helper function to parse date from various formats
function parseDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Try parsing DD-MMM-YYYY format (18-Apr-2025)
  const parts = dateStr.trim().split('-');
  if (parts.length === 3) {
    const day = parts[0];
    const monthStr = parts[1];
    const year = parts[2];
    
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    
    const month = months[monthStr];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }
  
  // If already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  return dateStr;
}

// Helper to clean and parse number
function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    // Remove commas and parse
    return parseFloat(val.replace(/,/g, '')) || 0;
  }
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function ImportRecoveryAccountsPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setParsedData([]);
      setErrors([]);
    }
  };

  const parseExcelFile = async (file: File): Promise<void> => {
    setIsProcessing(true);
    setErrors([]);

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result;
        let rows: string[][] = [];

        // Check file type and parse accordingly
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          // Parse Excel file
          const workbook = XLSX.read(content, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' }) as any[][];
          rows = jsonData.map(row => row.map(cell => String(cell || '')));
        } else {
          // Parse CSV file
          const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content as ArrayBuffer);
          const lines = textContent.split('\n').filter((line) => line.trim());
          rows = lines.map(line => line.split(',').map(v => v.trim()));
        }
        
        if (rows.length < 2) {
          setErrors([{ row: 0, field: 'file', message: 'File appears to be empty or invalid' }]);
          setIsProcessing(false);
          return;
        }

        // Parse header (case-insensitive)
        const headers = rows[0].map((h) => String(h).trim().toUpperCase());
        
        // Map headers to expected column names
        const headerMap: Record<string, number> = {};
        headers.forEach((header, index) => {
          headerMap[header] = index;
        });

        // Validate required headers
        const requiredHeaders = ['CUSTOMER NAME', 'DISBURSED DATE', 'AMOUNT DISBURSED', 'BALANCE'];
        const missingHeaders = requiredHeaders.filter((h) => headerMap[h] === undefined);
        
        if (missingHeaders.length > 0) {
          setErrors([
            {
              row: 0,
              field: 'headers',
              message: `Missing required columns: ${missingHeaders.join(', ')}`,
            },
          ]);
          setIsProcessing(false);
          return;
        }

        // Parse data rows
        const data: ImportRow[] = [];
        const validationErrors: ValidationError[] = [];

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i];
          
          if (values.length === 0 || values.every(v => !v)) {
            continue; // Skip empty rows
          }

          try {
            const customerName = values[headerMap['CUSTOMER NAME']] || '';
            const disbursedDate = values[headerMap['DISBURSED DATE']] || '';
            const amountDisbursed = parseNumber(values[headerMap['AMOUNT DISBURSED']]);
            const balance = parseNumber(values[headerMap['BALANCE']]);
            const customerPhone = values[headerMap['CUSTOMER PHONE']] || values[headerMap['PHONE']] || 'N/A'; // Make phone optional

            const importRow: ImportRow = {
              customerName,
              loanOfficer: values[headerMap['LOAN OFFICER']],
              disbursedDate: parseDate(disbursedDate),
              expiredDate: values[headerMap['EXPIRED DATE']] ? parseDate(values[headerMap['EXPIRED DATE']]) : undefined,
              amountDisbursed,
              interest: parseNumber(values[headerMap['INTEREST']]),
              balance,
              customerPhone,
              customerEmail: values[headerMap['CUSTOMER EMAIL']],
              customerAddress: values[headerMap['CUSTOMER ADDRESS']],
              notes: values[headerMap['NOTES']],
            };

            // Validate required fields
            if (!importRow.customerName) {
              validationErrors.push({ row: i + 1, field: 'CUSTOMER NAME', message: 'Required' });
            }
            if (importRow.amountDisbursed <= 0) {
              validationErrors.push({ row: i + 1, field: 'AMOUNT DISBURSED', message: 'Must be > 0' });
            }
            if (!importRow.disbursedDate) {
              validationErrors.push({ row: i + 1, field: 'DISBURSED DATE', message: 'Required' });
            }
            // Allow negative balance (overpayment/credit)
            // No validation needed for balance

            data.push(importRow);
          } catch (err) {
            validationErrors.push({
              row: i + 1,
              field: 'row',
              message: 'Failed to parse row',
            });
          }
        }

        setParsedData(data);
        setErrors(validationErrors);
        setIsProcessing(false);
      };

      reader.onerror = () => {
        setErrors([{ row: 0, field: 'file', message: 'Failed to read file' }]);
        setIsProcessing(false);
      };

      // Read as ArrayBuffer for both CSV and Excel
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      setErrors([{ row: 0, field: 'file', message: 'Failed to parse file' }]);
      setIsProcessing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const promises = parsedData.map((row) => {
        // Calculate historical repayments (original amount - balance)
        const historicalRepayments = row.amountDisbursed - row.balance;
        
        return recoveryService.createAccount({
          source: 'LEGACY',
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          customerEmail: row.customerEmail,
          customerAddress: row.customerAddress,
          originalPrincipal: row.amountDisbursed,
          disbursementDate: row.disbursedDate,
          originalReference: row.loanOfficer ? `Officer: ${row.loanOfficer}` : undefined,
          historicalRepayments: historicalRepayments > 0 ? historicalRepayments : 0,
          outstandingBalance: row.balance,
          priorityLevel: 'MEDIUM',
          notes: [
            row.notes,
            row.expiredDate ? `Expired: ${row.expiredDate}` : null,
            row.interest ? `Interest: ₦${row.interest.toLocaleString()}` : null,
          ].filter(Boolean).join(' | '),
        });
      });
      
      return Promise.all(promises);
    },
    onSuccess: (results) => {
      toast.success(`Successfully imported ${results.length} recovery accounts`);
      navigate('/recovery/accounts');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Import failed');
    },
  });

  const downloadTemplate = () => {
    const csvContent = [
      'CUSTOMER NAME,LOAN OFFICER,DISBURSED DATE,EXPIRED DATE,AMOUNT DISBURSED,INTEREST,BALANCE,CUSTOMER PHONE,CUSTOMER EMAIL,CUSTOMER ADDRESS,NOTES',
      'OJIKUTU REMILEKUN,Martha,18-Apr-2025,22-May-2025,200000.00,50000.00,103000.00,08012345678,customer@example.com,1 Main Street Lagos,Sample legacy loan',
      'Joseph Eyo Asuquo,Martha,30-Apr-2025,3-Jun-2025,75000.00,11250.00,10650.00,08087654321,joseph@example.com,2 Oak Avenue Abuja,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recovery_accounts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header-mobile">
        <Breadcrumbs />
        <div className="flex-mobile-col items-start md:items-center justify-between mt-3 md:mt-4 gap-3">
          <div>
            <h1 className="text-responsive-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Import Recovery Accounts
            </h1>
            <p className="text-responsive-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Bulk import historical loan accounts from Excel/CSV
            </p>
          </div>
          <button onClick={() => navigate('/recovery/accounts')} className="btn-ghost btn-responsive">
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 p-mobile md:p-0">
        {/* Instructions */}
        <div className="card-mobile">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-responsive-base mb-2" style={{ color: 'var(--text-primary)' }}>
                  Import Instructions
                </h3>
                <ol className="text-responsive-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
                  <li>1. Upload your Excel (.xlsx) file directly OR download CSV template</li>
                  <li>2. Required columns: CUSTOMER NAME, DISBURSED DATE, AMOUNT DISBURSED, BALANCE</li>
                  <li>3. Optional columns: CUSTOMER PHONE, LOAN OFFICER, INTEREST, EXPIRED DATE, etc.</li>
                  <li>4. Upload, review preview, and click Import</li>
                </ol>
                <div className="mt-4">
                  <button onClick={downloadTemplate} className="btn-secondary btn-responsive">
                    <Download className="w-4 h-4" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Upload File
            </p>
          </div>
          <div className="card-body">
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
              <Upload className="w-12 h-12 text-gray-400 mb-4" />
              <label className="cursor-pointer">
                <span className="btn-primary btn-responsive">Choose Excel or CSV File</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <p className="text-responsive-sm mt-3" style={{ color: 'var(--text-secondary)' }}>
                  {file.name}
                </p>
              )}
            </div>

            {file && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => parseExcelFile(file)}
                  disabled={isProcessing}
                  className="btn-primary btn-responsive"
                >
                  {isProcessing ? 'Processing...' : 'Parse File'}
                </button>
                <button
                  onClick={() => {
                    setFile(null);
                    setParsedData([]);
                    setErrors([]);
                  }}
                  className="btn-ghost btn-responsive"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="card-mobile border-l-4 border-red-500">
            <div className="card-body">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-responsive-base mb-2 text-red-600">
                    Validation Errors ({errors.length})
                  </h3>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {errors.slice(0, 20).map((error, idx) => (
                      <p key={idx} className="text-responsive-sm text-red-600">
                        Row {error.row}, {error.field}: {error.message}
                      </p>
                    ))}
                    {errors.length > 20 && (
                      <p className="text-responsive-sm text-red-600 italic">
                        ... and {errors.length - 20} more errors
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {parsedData.length > 0 && (
          <div className="card-mobile">
            <div className="card-header flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-responsive-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Preview ({parsedData.length} accounts)
                </p>
              </div>
              {errors.length === 0 && (
                <button
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                  className="btn-primary btn-responsive"
                >
                  {importMutation.isPending ? 'Importing...' : `Import ${parsedData.length} Accounts`}
                </button>
              )}
            </div>
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-responsive-sm">
                  <thead style={{ backgroundColor: 'var(--bg-secondary)' }}>
                    <tr>
                      <th className="py-2 px-3 text-left">#</th>
                      <th className="py-2 px-3 text-left">Customer</th>
                      <th className="py-2 px-3 text-left">Phone</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                      <th className="py-2 px-3 text-right">Balance</th>
                      <th className="py-2 px-3 text-left">Disbursed</th>
                      <th className="py-2 px-3 text-left">Officer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2 px-3">{idx + 1}</td>
                        <td className="py-2 px-3">{row.customerName}</td>
                        <td className="py-2 px-3">{row.customerPhone}</td>
                        <td className="py-2 px-3 text-right">₦{row.amountDisbursed.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">₦{row.balance.toLocaleString()}</td>
                        <td className="py-2 px-3">{row.disbursedDate}</td>
                        <td className="py-2 px-3">{row.loanOfficer || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 50 && (
                  <div className="p-3 text-center text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                    Showing first 50 of {parsedData.length} accounts
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning */}
        {parsedData.length > 0 && errors.length > 0 && (
          <div className="card-mobile border-l-4 border-yellow-500">
            <div className="card-body">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-responsive-sm" style={{ color: 'var(--text-secondary)' }}>
                    Please fix all validation errors before importing. Only valid rows will be imported.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
