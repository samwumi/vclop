import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { PrismaService } from '@/prisma/prisma.service';

/**
 * Public health-check endpoint — no auth required.
 *
 * Used by:
 *  - Docker / Kubernetes liveness and readiness probes
 *  - Load-balancer health checks
 *  - Uptime monitoring services
 *
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
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness & readiness health check' })
  check() {
    return this.health.check([
      // 1. Database connectivity — tries SELECT 1
      () => this.prismaIndicator.pingCheck('database', this.prisma),

      // 2. Heap memory — fail if > 512 MB
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // 3. RSS memory — fail if > 1 GB
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),

      // 4. Disk — fail if less than 10% free space remains
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
