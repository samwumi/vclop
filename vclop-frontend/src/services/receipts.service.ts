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

  /** Downloads shareable image receipt */
  async downloadImageReceipt(transactionId: string): Promise<void> {
    const response = await api.get(`/receipts/${transactionId}/image`, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt-${transactionId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Cleanup
    setTimeout(() => URL.revokeObjectURL(url), 100);
  },
};
