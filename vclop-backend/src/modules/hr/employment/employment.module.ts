import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { EmploymentService } from './employment.service';
import { EmploymentController } from './employment.controller';

@Module({
  imports: [PrismaModule],
  controllers: [EmploymentController],
  providers: [EmploymentService],
  exports: [EmploymentService],
})
export class EmploymentModule {}
