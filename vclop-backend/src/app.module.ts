import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WinstonModule } from 'nest-winston';
import { AppThrottlerGuard } from './common/guards/throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import storageConfig from './config/storage.config';
import mailConfig from './config/mail.config';
import { buildWinstonConfig } from './config/logger.config';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { BranchesModule } from './modules/branches/branches.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FormsModule } from './modules/forms/forms.module';
import { CustomersModule } from './modules/customers/customers.module';
import { LoanProductsModule } from './modules/loan-products/loan-products.module';
import { LoanApplicationsModule } from './modules/loan-applications/loan-applications.module';
import { VirtualAccountsModule } from './modules/virtual-accounts/virtual-accounts.module';
import { ReceiptsModule } from './modules/receipts/receipts.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { TransportModule } from './modules/transport/transport.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ReconciliationModule } from './modules/reconciliation/reconciliation.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, storageConfig, mailConfig],
      envFilePath: ['.env'],
      expandVariables: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true,   // allow env vars not declared in schema
        abortEarly: false,    // report all validation errors at once
      },
    }),

    // Logger
    WinstonModule.forRootAsync({
      useFactory: buildWinstonConfig,
      inject: [],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 50,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 200,
      },
    ]),

    // Event system
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Core infrastructure
    PrismaModule,
    StorageModule,
    NotificationsModule,

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    DepartmentsModule,
    BranchesModule,
    SettingsModule,
    AuditModule,
    DashboardModule,
    FormsModule,
    CustomersModule,
    LoanProductsModule,
    LoanApplicationsModule,
    VirtualAccountsModule,
    ReceiptsModule,
    WorkflowsModule,
    ComplianceModule,
    TransportModule,
    CollectionsModule,
    ReportsModule,
    ReconciliationModule,
    PerformanceModule,
    HealthModule,
  ],
  providers: [
    // ── Global guards (applied to every route in declaration order) ──────
    // 1. Rate limiter — blocks abusive request bursts before any auth work
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
    // 2. JWT auth — validates bearer token and populates req.user
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 3. Permission check — verifies @RequirePermissions() against req.user roles
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
