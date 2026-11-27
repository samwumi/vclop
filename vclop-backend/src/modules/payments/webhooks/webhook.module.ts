import { Module } from '@nestjs/common';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { PaystackModule } from '../paystack/paystack.module';
import { DisbursementModule } from '../disbursements/disbursement.module';

@Module({
  imports: [PaystackModule, DisbursementModule],
  controllers: [PaystackWebhookController],
})
export class WebhookModule {}
