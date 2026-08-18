import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { CreditBureauService } from './credit-bureau.service';

@Module({ 
  imports: [HttpModule],
  controllers: [ComplianceController], 
  providers: [ComplianceService, CreditBureauService], 
  exports: [ComplianceService, CreditBureauService] 
})
export class ComplianceModule {}
