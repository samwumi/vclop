import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, CheckCircle2, XCircle, Clock, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { customersService, documentTypesService } from '@/services/customers.service';
import { PageLoader } from '@/components/ui/LoadingScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateTime, normalizeFileUrl } from '@/lib/utils';
import type { CustomerDocument } from '@/types/domain.types';

const STATUS_MAP = {
  PENDING:  { label: 'Pending',  variant: 'yellow' as const, icon: Clock },
  VERIFIED: { label: 'Verified', variant: 'green'  as const, icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', variant: 'red'    as const, icon: XCircle },
  EXPIRED:  { label: 'Expired',  variant: 'gray'   as const, icon: Clock },
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function CustomerDocumentsTab({ customerId }: { customerId: string }) {
  const { hasPermission } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadDocTypeId, setUploadDocTypeId] = useState('');
  const [showUpload, setShowUpload] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['customer-docs', customerId],
    queryFn: () => customersService.getDocuments(customerId),
  });

  const { data: docTypes } = useQuery({
    queryKey: ['document-types'],
    queryFn: () => documentTypesService.list(),
    enabled: showUpload,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, docTypeId }: { file: File; docTypeId: string }) =>
      customersService.uploadDocument(customerId, docTypeId, file),
    onSuccess: () => {
      toast.success('Document uploaded');
      qc.invalidateQueries({ queryKey: ['customer-docs', customerId] });
      qc.invalidateQueries({ queryKey: ['customer360', customerId] });
      setShowUpload(false);
      setUploadDocTypeId('');
    },
    onError: (e: unknown) => toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed'),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ docId, status }: { docId: string; status: 'VERIFIED' | 'REJECTED' }) =>
      customersService.verifyDocument(customerId, docId, status),
    onSuccess: () => { toast.success('Document status updated'); qc.invalidateQueries({ queryKey: ['customer-docs', customerId] }); },
    onError: () => toast.error('Failed to update document'),
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: string) => customersService.deleteDocument(customerId, docId),
    onSuccess: () => { toast.success('Document deleted'); qc.invalidateQueries({ queryKey: ['customer-docs', customerId] }); },
    onError: () => toast.error('Cannot delete verified document'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadDocTypeId) { toast.error('Select a document type first'); return; }
    uploadMutation.mutate({ file, docTypeId: uploadDocTypeId });
  };

  if (isLoading) return <PageLoader />;

  return (
    <div className="space-y-4">
      {hasPermission('documents:upload') && (
        <div className="card">
          <div className="card-body">
            {!showUpload ? (
              <button onClick={() => setShowUpload(true)} className="btn-secondary btn-sm gap-2">
                <Upload className="w-4 h-4" /> Upload Document
              </button>
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label className="form-label text-xs">Document Type</label>
                  <select
                    className="form-input text-sm h-9"
                    value={uploadDocTypeId}
                    onChange={(e) => setUploadDocTypeId(e.target.value)}
                  >
                    <option value="">Select type…</option>
                    {((docTypes ?? []) as { id: string; name: string }[]).map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.name}</option>
                    ))}
                  </select>
                </div>
                <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.docx" />
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={!uploadDocTypeId || uploadMutation.isPending}
                  className="btn-primary btn-sm gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  {uploadMutation.isPending ? 'Uploading…' : 'Choose File'}
                </button>
                <button onClick={() => setShowUpload(false)} className="btn-ghost btn-sm text-gray-500">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      {!docs?.length ? (
        <div className="card">
          <EmptyState title="No documents uploaded" description="Upload required documents for this customer." />
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr><th>Document</th><th>File</th><th>Status</th><th>Uploaded</th><th></th></tr>
            </thead>
            <tbody>
              {docs.map((doc: CustomerDocument) => {
                const s = STATUS_MAP[doc.status] ?? STATUS_MAP.PENDING;
                return (
                  <tr key={doc.id}>
                    <td className="text-sm font-medium text-gray-800">{doc.documentType?.name ?? doc.documentTypeId}</td>
                    <td>
                      <p className="text-xs text-gray-600 max-w-[150px] truncate">{doc.originalName}</p>
                      <p className="text-xs text-gray-400">{formatSize(doc.size)}</p>
                    </td>
                    <td>
                      <Badge variant={s.variant}>{s.label}</Badge>
                      {doc.status === 'REJECTED' && doc.rejectionReason && (
                        <p className="text-xs text-red-500 mt-0.5">{doc.rejectionReason}</p>
                      )}
                    </td>
                    <td className="text-xs text-gray-500">{formatDateTime(doc.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        {hasPermission('documents:verify') && doc.status === 'PENDING' && (
                          <>
                            <button onClick={() => verifyMutation.mutate({ docId: doc.id, status: 'VERIFIED' })}
                              className="btn-ghost btn-sm text-green-600 px-2 py-1 text-xs">Verify</button>
                            <button onClick={() => {
                              const reason = window.prompt('Rejection reason:');
                              if (reason) customersService.verifyDocument(customerId, doc.id, 'REJECTED', reason)
                                .then(() => { toast.success('Document rejected'); qc.invalidateQueries({ queryKey: ['customer-docs', customerId] }); });
                            }}
                              className="btn-ghost btn-sm text-red-600 px-2 py-1 text-xs">Reject</button>
                          </>
                        )}
                        <a
                          href={normalizeFileUrl(doc.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost btn-icon w-7 h-7 text-brand-600"
                          title="View document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        {hasPermission('documents:delete') && doc.status !== 'VERIFIED' && (
                          <button onClick={() => deleteMutation.mutate(doc.id)} className="btn-ghost btn-icon w-7 h-7 text-gray-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
