import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VirtualAccountProviderType } from '@prisma/client';
import { BusinessException } from '../../../common/exceptions/app.exceptions';
import { LocalVirtualAccountProvider } from './local-virtual-account.provider';
import { PaystackVirtualAccountProvider } from './paystack-virtual-account.provider';
import { VirtualAccountProvider } from './virtual-account-provider.interface';

@Injectable()
export class VirtualAccountProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly localProvider: LocalVirtualAccountProvider,
    private readonly paystackProvider: PaystackVirtualAccountProvider,
    // Real bank providers register here once built, e.g.:
    // private readonly providusProvider: ProvidusVirtualAccountProvider,
  ) {}

  /** Returns the currently configured provider (VIRTUAL_ACCOUNT_PROVIDER env var, defaults to LOCAL) unless a specific one is requested. */
  getActiveProvider(): VirtualAccountProvider {
    const configured = (this.config.get<string>('VIRTUAL_ACCOUNT_PROVIDER') ?? 'LOCAL') as VirtualAccountProviderType;
    return this.getProvider(configured);
  }

  getProvider(type: VirtualAccountProviderType): VirtualAccountProvider {
    switch (type) {
      case 'LOCAL':
        return this.localProvider;
      case 'PAYSTACK':
        return this.paystackProvider;
      case 'PROVIDUS':
      case 'MONNIFY':
      case 'FLUTTERWAVE':
      case 'WEMA':
        throw new BusinessException(
          `The ${type} provider is not implemented yet — only LOCAL and PAYSTACK are available today. Add a class implementing VirtualAccountProvider and register it here once the integration is built.`,
        );
      default:
        throw new BusinessException(`Unsupported virtual account provider: ${type}`);
    }
  }
}
