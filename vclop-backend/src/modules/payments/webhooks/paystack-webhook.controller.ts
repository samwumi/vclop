import {
  Controller,
  Post,
  Body,
  Headers,
  Logger,
  HttpCode,
  HttpStatus,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { PaystackService } from '../paystack/paystack.service';
import { DisbursementService } from '../disbursements/disbursement.service';

@Controller('webhooks/paystack')
export class PaystackWebhookController {
  private readonly logger = new Logger(PaystackWebhookController.name);

  constructor(
    private readonly paystackService: PaystackService,
    private readonly disbursementService: DisbursementService,
  ) {}

  /**
   * Handle Paystack webhook events
   * https://paystack.com/docs/payments/webhooks/
   */
  @Post('transfers')
  @HttpCode(HttpStatus.OK)
  async handleTransferWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
    @Body() event: any,
  ) {
    this.logger.log(`Received Paystack webhook: ${event.event}`);

    // Verify signature
    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(event);
    
    if (!signature) {
      this.logger.warn('Missing Paystack signature');
      return { success: false, message: 'Missing signature' };
    }

    const isValid = this.paystackService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      this.logger.error('Invalid Paystack webhook signature');
      return { success: false, message: 'Invalid signature' };
    }

    // Process the event
    try {
      await this.disbursementService.handleWebhookEvent(event);
      this.logger.log(`Successfully processed webhook: ${event.event}`);
      return { success: true };
    } catch (error) {
      this.logger.error('Failed to process webhook', error);
      // Return 200 anyway to prevent Paystack retries
      return { success: true, message: 'Event logged' };
    }
  }
}
