import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { recoveryService } from '@/services/recovery.service';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ImportRow {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  originalPrincipal: number;
  disbursementDate: string;
  originalReference?: string;
  historicalRepayments: number;
  outstandingBalance: number;
  priorityLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  notes?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
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
      // Use FileReader to read the file as text (CSV) or ArrayBuffer (Excel)
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        
        // Simple CSV parsing (assuming comma-separated)
        const lines = content.split('\n').filter((line) => line.trim());
        
        if (lines.length < 2) {
          setErrors([{ row: 0, field: 'file', message: 'File appears to be empty or invalid' }]);
          setIsProcessing(false);
          return;
        }

        // Parse header
        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
        
        // Validate required headers
        const requiredHeaders = [
          'customer_name',
          'customer_phone',
          'original_principal',
          'disbursement_date',
          'historical_repayments',
          'outstanding_balance',
        ];

        const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
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

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          
          if (values.length !== headers.length) {
            validationErrors.push({
              row: i + 1,
              field: 'row',
              message: 'Column count mismatch',
            });
            continue;
          }

          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index];
          });

          // Validate and transform
          try {
            const importRow: ImportRow = {
              customerName: row.customer_name || '',
              customerPhone: row.customer_phone || '',
              customerEmail: row.customer_email || undefined,
              customerAddress: row.customer_address || undefined,
              originalPrincipal: parseFloat(row.original_principal) || 0,
              disbursementDate: row.disbursement_date || '',
              originalReference: row.original_reference || undefined,
              historicalRepayments: parseFloat(row.historical_repayments) || 0,
              outstandingBalance: parseFloat(row.outstanding_balance) || 0,
              priorityLevel: (row.priority_level?.toUpperCase() || 'MEDIUM') as any,
              notes: row.notes || undefined,
            };

            // Validate required fields
            if (!importRow.customerName) {
              validationErrors.push({ row: i + 1, field: 'customer_name', message: 'Required' });
            }
            if (!importRow.customerPhone) {
              validationErrors.push({ row: i + 1, field: 'customer_phone', message: 'Required' });
            }
            if (importRow.originalPrincipal <= 0) {
              validationErrors.push({ row: i + 1, field: 'original_principal', message: 'Must be > 0' });
            }
            if (!importRow.disbursementDate) {
              validationErrors.push({ row: i + 1, field: 'disbursement_date', message: 'Required' });
            }
            if (importRow.outstandingBalance < 0) {
              validationErrors.push({
                row: i + 1,
                field: 'outstanding_balance',
                message: 'Cannot be negative',
              });
            }

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

      reader.readAsText(file);
    } catch (error) {
      console.error('Error parsing file:', error);
      setErrors([{ row: 0, field: 'file', message: 'Failed to parse file' }]);
      setIsProcessing(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      const promises = parsedData.map((row) =>
        recoveryService.createAccount({
          source: 'LEGACY',
          customerName: row.customerName,
          customerPhone: row.customerPhone,
          customerEmail: row.customerEmail,
          customerAddress: row.customerAddress,
          originalPrincipal: row.originalPrincipal,
          disbursementDate: row.disbursementDate,
          originalReference: row.originalReference,
          historicalRepayments: row.historicalRepayments,
          outstandingBalance: row.outstandingBalance,
          priorityLevel: row.priorityLevel,
          notes: row.notes,
        }),
      );
      
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
      'customer_name,customer_phone,customer_email,customer_address,original_principal,disbursement_date,original_reference,historical_repayments,outstanding_balance,priority_level,notes',
      'John Doe,08012345678,john@example.com,123 Main St,500000,2024-01-15,REF-001,100000,400000,HIGH,Customer relocated',
      'Jane Smith,08087654321,jane@example.com,456 Oak Ave,300000,2023-12-20,REF-002,50000,250000,MEDIUM,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
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
        <div className="card-mobile bg-blue-50 border-blue-200">
          <div className="card-body">
            <h3 className="text-responsive-sm font-semibold mb-3 text-blue-900">
              Import Instructions
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-responsive-sm text-blue-800">
              <li>Download the CSV template below</li>
              <li>Fill in your recovery account data (one account per row)</li>
              <li>Upload the completed CSV file</li>
              <li>Review and validate the data</li>
              <li>Click "Import Accounts" to complete the import</li>
            </ol>
            <div className="mt-4">
              <button onClick={downloadTemplate} className="btn-primary btn-responsive">
                <Download className="w-4 h-4" />
                <span>Download CSV Template</span>
              </button>
            </div>
          </div>
        </div>

        {/* Required Fields */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Required Fields
            </p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-responsive-sm">
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • customer_name
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Full name of the customer
                </p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • customer_phone
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Phone number (e.g., 08012345678)
                </p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • original_principal
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Original loan amount (number only)
                </p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • disbursement_date
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Date format: YYYY-MM-DD
                </p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • historical_repayments
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Amount already repaid (number only)
                </p>
              </div>
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  • outstanding_balance
                </p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Current balance owed (number only)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="card-mobile">
          <div className="card-header">
            <p className="text-responsive-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Upload File
            </p>
          </div>
          <div className="card-body">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileSpreadsheet className="w-12 h-12 mb-4 text-gray-400" />
                  {file ? (
                    <div className="text-center">
                      <p className="text-responsive-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {file.name}
                      </p>
                      <p className="text-responsive-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="mb-2 text-responsive-sm" style={{ color: 'var(--text-primary)' }}>
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-responsive-xs" style={{ color: 'var(--text-secondary)' }}>
                        CSV files only
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {file && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => parseExcelFile(file)}
                  disabled={isProcessing}
                  className="btn-primary btn-responsive"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessing ? 'Processing...' : 'Parse File'}</span>
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
          <div className="card-mobile border-2 border-red-200 bg-red-50">
            <div className="card-header">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-responsive-sm font-semibold text-red-800">
                  Validation Errors ({errors.length})
                </p>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {errors.map((error, index) => (
                  <div key={index} className="flex items-start gap-2 text-responsive-sm text-red-800">
                    <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>
                      <strong>Row {error.row}:</strong> {error.field} - {error.message}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-responsive-xs mt-3 text-red-700">
                Please fix the errors in your CSV file and try again.
              </p>
            </div>
          </div>
        )}

        {/* Parsed Data Preview */}
        {parsedData.length > 0 && errors.length === 0 && (
          <div className="card-mobile border-2 border-green-200 bg-green-50">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <p className="text-responsive-sm font-semibold text-green-800">
                    Ready to Import ({parsedData.length} accounts)
                  </p>
                </div>
                <button
                  onClick={() => importMutation.mutate()}
                  disabled={importMutation.isPending}
                  className="btn-primary btn-responsive"
                >
                  {importMutation.isPending ? 'Importing...' : 'Import Accounts'}
                </button>
              </div>
            </div>
            <div className="card-body">
              <div className="overflow-x-auto -mx-4 md:mx-0">
                <table className="w-full text-responsive-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Customer</th>
                      <th className="text-left py-2 px-3">Phone</th>
                      <th className="text-right py-2 px-3">Principal</th>
                      <th className="text-right py-2 px-3">Outstanding</th>
                      <th className="text-left py-2 px-3">Date</th>
                      <th className="text-left py-2 px-3">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-green-100">
                        <td className="py-2 px-3">{row.customerName}</td>
                        <td className="py-2 px-3">{row.customerPhone}</td>
                        <td className="py-2 px-3 text-right">₦{row.originalPrincipal.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right">₦{row.outstandingBalance.toLocaleString()}</td>
                        <td className="py-2 px-3">{row.disbursementDate}</td>
                        <td className="py-2 px-3">{row.priorityLevel || 'MEDIUM'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 10 && (
                <p className="text-responsive-xs mt-3 text-green-700">
                  ... and {parsedData.length - 10} more accounts
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
