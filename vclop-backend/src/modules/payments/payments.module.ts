import { Module } from '@nestjs/common';
import { PaystackModule } from './paystack/paystack.module';
import { DisbursementModule } from './disbursements/disbursement.module';
import { WebhookModule } from './webhooks/webhook.module';

@Module({
  imports: [PaystackModule, DisbursementModule, WebhookModule],
  exports: [PaystackModule, DisbursementModule],
})
export class PaymentsModule {}
