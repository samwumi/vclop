import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Public health-check endpoint — no auth required.
 * GET /api/v1/health
 */
@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness & readiness health check' })
  check() {
    return this.health.check([
      // Database connectivity
      () => this.prismaIndicator.pingCheck('database', this.prisma),
      // Heap memory — fail if > 512 MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
    ]);
  }
}
