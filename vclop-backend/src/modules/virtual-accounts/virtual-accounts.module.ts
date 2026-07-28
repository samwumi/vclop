import { Module } from '@nestjs/common';
import { LoanApplicationsModule } from '../loan-applications/loan-applications.module';
import { VirtualAccountsController } from './virtual-accounts.controller';
import { VirtualAccountsService } from './virtual-accounts.service';
import { VirtualAccountProviderFactory } from './providers/virtual-account-provider.factory';
import { LocalVirtualAccountProvider } from './providers/local-virtual-account.provider';
import { PaystackVirtualAccountProvider } from './providers/paystack-virtual-account.provider';

@Module({
  imports: [LoanApplicationsModule],
  controllers: [VirtualAccountsController],
  providers: [VirtualAccountsService, VirtualAccountProviderFactory, LocalVirtualAccountProvider, PaystackVirtualAccountProvider],
  exports: [VirtualAccountsService],
})
export class VirtualAccountsModule {}
