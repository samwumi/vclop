import { Module } from '@nestjs/common';
import { DisbursementService } from './disbursement.service';
import { DisbursementController } from './disbursement.controller';
import { PaystackModule } from '../paystack/paystack.module';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PaystackModule, PrismaModule],
  controllers: [DisbursementController],
  providers: [DisbursementService],
  exports: [DisbursementService],
})
export class DisbursementModule {}
