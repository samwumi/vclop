import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import authConfig from './config/auth.config';
import storageConfig from './config/storage.config';
import mailConfig from './config/mail.config';
import { buildWinstonConfig } from './config/logger.config';
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
import { PerformanceModule } from './modules/performance/performance.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, storageConfig, mailConfig],
      envFilePath: ['.env'],
      expandVariables: true,
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

    // Scheduled tasks
    ScheduleModule.forRoot(),

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
    PerformanceModule,
  ],
})
export class AppModule {}
