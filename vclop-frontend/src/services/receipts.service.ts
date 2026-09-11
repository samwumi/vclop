import { api } from '@/lib/axios';

export const receiptsService = {
  /** Fetches the PDF as a blob (auth header attached automatically) and opens it in a new tab. */
  async viewReceipt(transactionId: string): Promise<void> {
    const response = await api.get(`/receipts/${transactionId}`, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    window.open(blobUrl, '_blank');
    // Revoke after a delay long enough for the new tab to load it.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  },
};
