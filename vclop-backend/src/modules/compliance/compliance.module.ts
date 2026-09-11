import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';
import { CreditBureauService } from './credit-bureau.service';
import { UsersModule } from '../users/users.module';

@Module({ 
  imports: [HttpModule, UsersModule],
  controllers: [ComplianceController], 
  providers: [ComplianceService, CreditBureauService], 
  exports: [ComplianceService, CreditBureauService] 
})
export class ComplianceModule {}
