import { Module } from '@nestjs/common';
import { OfficerTargetsController } from './officer-targets.controller';
import { OfficerTargetsService } from './officer-targets.service';

@Module({
  controllers: [OfficerTargetsController],
  providers: [OfficerTargetsService],
  exports: [OfficerTargetsService],
})
export class OfficerTargetsModule {}
