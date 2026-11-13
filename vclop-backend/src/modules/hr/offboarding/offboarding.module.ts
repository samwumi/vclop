import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { OffboardingService } from './offboarding.service';
import { OffboardingController } from './offboarding.controller';

@Module({
  imports: [PrismaModule],
  controllers: [OffboardingController],
  providers: [OffboardingService],
  exports: [OffboardingService],
})
export class OffboardingModule {}
