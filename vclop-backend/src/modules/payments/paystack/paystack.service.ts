import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface PaystackBank {
  id: number;
  name: string;
  code: string;
  active: boolean;
  country: string;
}

export interface PaystackAccountVerification {
  account_number: string;
  account_name: string;
  bank_id: number;
}

export interface PaystackRecipientData {
  type: 'nuban';
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
  description?: string;
}

export interface PaystackRecipient {
  recipient_code: string;
  type: string;
  name: string;
  details: {
    account_number: string;
    account_name: string;
    bank_code: string;
    bank_name: string;
  };
  currency: string;
  active: boolean;
}

export interface PaystackTransferData {
  source: 'balance';
  amount: number; // In kobo (multiply naira by 100)
  recipient: string; // recipient_code
  reason?: string;
  reference?: string;
}

export interface PaystackTransfer {
  transfer_code: string;
  reference: string;
  status: 'pending' | 'success' | 'failed' | 'reversed';
  amount: number;
  currency: string;
  recipient: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly client: AxiosInstance;
  private readonly baseURL = 'https://api.paystack.co';

  constructor() {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    
    if (!secretKey) {
      this.logger.error('PAYSTACK_SECRET_KEY is not configured');
      throw new Error('Paystack is not properly configured');
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Log all requests in development
    if (process.env.NODE_ENV !== 'production') {
      this.client.interceptors.request.use((config) => {
        this.logger.debug(`Paystack API: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      });
    }

    // Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          this.logger.error(
            `Paystack API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
          );
        } else {
          this.logger.error(`Paystack Network Error: ${error.message}`);
        }
        throw error;
      },
    );
  }

  /**
   * Get list of Nigerian banks
   */
  async getBanks(): Promise<PaystackBank[]> {
    try {
      const response = await this.client.get('/bank', {
        params: {
          country: 'nigeria',
          perPage: 100,
        },
      });

      if (!response.data.status) {
        throw new HttpException(
          'Failed to fetch banks from Paystack',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to fetch banks', error);
      throw new HttpException(
        'Failed to fetch banks from Paystack',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Verify account number and get account name
   */
  async verifyAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<PaystackAccountVerification> {
    try {
      const response = await this.client.get('/bank/resolve', {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || 'Account verification failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data.data;
    } catch (error) {
      if (error.response?.status === 422) {
        throw new HttpException(
          'Invalid account number or bank code',
          HttpStatus.BAD_REQUEST,
        );
      }
      this.logger.error('Failed to verify account', error);
      throw new HttpException(
        'Failed to verify account with Paystack',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Create a transfer recipient
   */
  async createRecipient(data: PaystackRecipientData): Promise<PaystackRecipient> {
    try {
      const response = await this.client.post('/transferrecipient', data);

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || 'Failed to create recipient',
          HttpStatus.BAD_REQUEST,
        );
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to create recipient', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to create transfer recipient',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Initiate a transfer
   */
  async initiateTransfer(data: PaystackTransferData): Promise<PaystackTransfer> {
    try {
      const response = await this.client.post('/transfer', data);

      if (!response.data.status) {
        throw new HttpException(
          response.data.message || 'Transfer initiation failed',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Transfer initiated: ${response.data.data.transfer_code} - ${response.data.data.reference}`,
      );

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to initiate transfer', error);
      throw new HttpException(
        error.response?.data?.message || 'Failed to initiate transfer',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get transfer status by reference
   */
  async getTransferStatus(reference: string): Promise<PaystackTransfer> {
    try {
      const response = await this.client.get(`/transfer/verify/${reference}`);

      if (!response.data.status) {
        throw new HttpException(
          'Failed to get transfer status',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return response.data.data;
    } catch (error) {
      this.logger.error('Failed to get transfer status', error);
      throw new HttpException(
        'Failed to get transfer status from Paystack',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * List transfers with pagination
   */
  async listTransfers(params?: {
    perPage?: number;
    page?: number;
    status?: string;
    from?: string;
    to?: string;
  }): Promise<{ data: PaystackTransfer[]; meta: any }> {
    try {
      const response = await this.client.get('/transfer', { params });

      if (!response.data.status) {
        throw new HttpException(
          'Failed to list transfers',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return {
        data: response.data.data,
        meta: response.data.meta,
      };
    } catch (error) {
      this.logger.error('Failed to list transfers', error);
      throw new HttpException(
        'Failed to list transfers from Paystack',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
    
    if (!secret) {
      this.logger.error('Webhook secret not configured');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', secret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Convert Naira to Kobo (Paystack requires amounts in kobo)
   */
  nairaToKobo(naira: number): number {
    return Math.round(naira * 100);
  }

  /**
   * Convert Kobo to Naira
   */
  koboToNaira(kobo: number): number {
    return kobo / 100;
  }
}
