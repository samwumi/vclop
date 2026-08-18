import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BusinessException } from '../../common/exceptions/app.exceptions';

export interface CreditReportData {
  creditScore: number;
  scoreRange: string;
  rating: string;
  totalDebt: number;
  activeLoans: Array<{
    lender: string;
    amount: number;
    balance: number;
    status: string;
    paymentStatus: string;
  }>;
  defaultedLoans: Array<{
    lender: string;
    amount: number;
    defaultDate: string;
  }>;
  paymentHistory: {
    onTimePayments: number;
    latePayments: number;
    missedPayments: number;
  };
  creditInquiries: number;
  lastInquiryDate?: string;
  bureauName: string;
  reportDate: string;
  rawData?: unknown;
}

@Injectable()
export class CreditBureauService {
  private readonly logger = new Logger(CreditBureauService.name);
  private readonly monoSecretKey: string;
  private readonly monoBaseUrl = 'https://api.withmono.com';

  constructor(
    private readonly config: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.monoSecretKey = this.config.get<string>('MONO_SECRET_KEY') || '';
    if (!this.monoSecretKey || this.monoSecretKey === 'test_sk_placeholder') {
      this.logger.warn('MONO_SECRET_KEY not configured. Credit bureau features will not work.');
    }
  }

  /**
   * Fetch credit report from Mono (pulls from CRC Credit Bureau)
   * @param bvn Customer's Bank Verification Number
   * @param firstName Customer's first name
   * @param lastName Customer's last name
   * @returns Credit report data
   */
  async fetchCreditReport(bvn: string, firstName: string, lastName: string): Promise<CreditReportData> {
    if (!this.monoSecretKey || this.monoSecretKey === 'test_sk_placeholder') {
      throw new BusinessException(
        'Credit bureau service is not configured. Please contact administrator.',
      );
    }

    try {
      this.logger.log(`Fetching credit report for BVN: ${bvn.substring(0, 3)}****`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.monoBaseUrl}/v1/credit/report`,
          {
            bvn,
            customer: {
              first_name: firstName,
              last_name: lastName,
            },
          },
          {
            headers: {
              'mono-sec-key': this.monoSecretKey,
              'Content-Type': 'application/json',
            },
            timeout: 30000, // 30 seconds timeout
          },
        ),
      );

      if (response.data.status !== 'successful') {
        throw new BusinessException(
          response.data.message || 'Failed to fetch credit report',
        );
      }

      const data = response.data.data;
      
      // Transform Mono response to standardized format
      const creditReport: CreditReportData = {
        creditScore: data.credit_score || 0,
        scoreRange: data.score_range || 'N/A',
        rating: data.rating || 'UNKNOWN',
        totalDebt: data.total_debt || 0,
        activeLoans: (data.active_loans || []).map((loan: any) => ({
          lender: loan.lender || loan.institution || 'Unknown',
          amount: loan.amount || loan.principal || 0,
          balance: loan.balance || loan.outstanding || 0,
          status: loan.status || 'ACTIVE',
          paymentStatus: loan.payment_status || 'UNKNOWN',
        })),
        defaultedLoans: (data.defaulted_loans || []).map((loan: any) => ({
          lender: loan.lender || loan.institution || 'Unknown',
          amount: loan.amount || 0,
          defaultDate: loan.default_date || loan.date || new Date().toISOString(),
        })),
        paymentHistory: {
          onTimePayments: data.payment_history?.on_time_payments || 0,
          latePayments: data.payment_history?.late_payments || 0,
          missedPayments: data.payment_history?.missed_payments || 0,
        },
        creditInquiries: data.credit_inquiries || 0,
        lastInquiryDate: data.last_inquiry_date,
        bureauName: 'CRC Credit Bureau (via Mono)',
        reportDate: new Date().toISOString(),
        rawData: data, // Store raw response for debugging
      };

      this.logger.log(`Credit report fetched successfully. Score: ${creditReport.creditScore}`);
      return creditReport;

    } catch (err) {
      const error = err as any;
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        this.logger.error(`Mono API error (${status}): ${message}`);

        if (status === 401 || status === 403) {
          throw new BusinessException('Invalid Mono API key. Please contact administrator.');
        }

        if (status === 404) {
          throw new BusinessException('No credit history found for this BVN.');
        }

        if (status === 429) {
          throw new BusinessException('Too many requests. Please try again later.');
        }

        throw new BusinessException(
          `Failed to fetch credit report: ${message}`,
        );
      }

      this.logger.error('Unexpected error fetching credit report', error);
      throw new BusinessException('An error occurred while fetching credit report. Please try again.');
    }
  }

  /**
   * Parse credit rating into risk level
   */
  parseRiskLevel(rating: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    const ratingUpper = rating.toUpperCase();
    if (ratingUpper === 'EXCELLENT' || ratingUpper === 'VERY GOOD' || ratingUpper === 'GOOD') {
      return 'LOW';
    }
    if (ratingUpper === 'FAIR' || ratingUpper === 'AVERAGE') {
      return 'MEDIUM';
    }
    if (ratingUpper === 'POOR') {
      return 'HIGH';
    }
    return 'VERY_HIGH';
  }

  /**
   * Calculate risk score from credit report (0-100, higher = more risky)
   */
  calculateRiskScore(creditReport: CreditReportData): number {
    let riskScore = 0;

    // Credit score factor (0-40 points)
    if (creditReport.creditScore < 300) {
      riskScore += 40;
    } else if (creditReport.creditScore < 500) {
      riskScore += 30;
    } else if (creditReport.creditScore < 650) {
      riskScore += 20;
    } else if (creditReport.creditScore < 750) {
      riskScore += 10;
    }

    // Defaulted loans (0-30 points)
    if (creditReport.defaultedLoans.length > 0) {
      riskScore += Math.min(30, creditReport.defaultedLoans.length * 15);
    }

    // Payment history (0-20 points)
    const totalPayments = creditReport.paymentHistory.onTimePayments + 
                          creditReport.paymentHistory.latePayments + 
                          creditReport.paymentHistory.missedPayments;
    if (totalPayments > 0) {
      const lateRate = (creditReport.paymentHistory.latePayments + 
                        creditReport.paymentHistory.missedPayments * 2) / totalPayments;
      riskScore += Math.min(20, Math.floor(lateRate * 100));
    }

    // Active loans count (0-10 points)
    if (creditReport.activeLoans.length > 5) {
      riskScore += 10;
    } else if (creditReport.activeLoans.length > 3) {
      riskScore += 5;
    }

    return Math.min(100, riskScore);
  }

  /**
   * Generate recommendation based on credit report
   */
  generateRecommendation(creditReport: CreditReportData, requestedAmount: number): {
    recommendation: 'APPROVE' | 'REJECT' | 'REQUEST_INFORMATION';
    reason: string;
    suggestedAmount?: number;
  } {
    const riskScore = this.calculateRiskScore(creditReport);

    // Reject if defaulted loans exist
    if (creditReport.defaultedLoans.length > 0) {
      return {
        recommendation: 'REJECT',
        reason: `Customer has ${creditReport.defaultedLoans.length} defaulted loan(s). High risk of default.`,
      };
    }

    // Reject if credit score is very low
    if (creditReport.creditScore < 400) {
      return {
        recommendation: 'REJECT',
        reason: `Credit score (${creditReport.creditScore}) is below acceptable threshold. Very poor credit history.`,
      };
    }

    // Request more info if credit score is low-medium
    if (creditReport.creditScore < 550) {
      return {
        recommendation: 'REQUEST_INFORMATION',
        reason: `Credit score (${creditReport.creditScore}) is low. Request additional collateral or guarantor.`,
        suggestedAmount: Math.floor(requestedAmount * 0.5), // Suggest 50% of requested
      };
    }

    // Check debt-to-income (if total debt is very high)
    if (creditReport.totalDebt > 5000000) { // ₦5M
      return {
        recommendation: 'REQUEST_INFORMATION',
        reason: `High existing debt (₦${creditReport.totalDebt.toLocaleString()}). Verify income and debt service capacity.`,
      };
    }

    // Approve with conditions if risk is medium
    if (riskScore > 40) {
      return {
        recommendation: 'REQUEST_INFORMATION',
        reason: `Moderate risk (score: ${riskScore}/100). Consider reducing loan amount or requiring guarantor.`,
        suggestedAmount: Math.floor(requestedAmount * 0.7), // Suggest 70% of requested
      };
    }

    // Approve if everything looks good
    return {
      recommendation: 'APPROVE',
      reason: `Good credit profile. Score: ${creditReport.creditScore}, Risk: ${riskScore}/100. No red flags.`,
    };
  }
}
