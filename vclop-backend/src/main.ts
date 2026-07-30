import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { execSync } from 'child_process';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  // ── Run DB migrations before starting (production only) ───────────────────
  if (process.env.NODE_ENV === 'production') {
    try {
      console.log('[bootstrap] Running Prisma migrations...');
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '../../'),
      });
      console.log('[bootstrap] Migrations complete.');
    } catch (err) {
      // Log but don't exit — app may still work if migrations already applied
      console.error('[bootstrap] Migration warning:', err instanceof Error ? err.message : err);
    }
  }

  // ── Process-level safety nets ─────────────────────────────────────────────
  // These catch errors that escape NestJS's own exception handling
  // (e.g. from a background timer, event emitter, or third-party callback).
  process.on('uncaughtException', (err: Error) => {
    console.error('[uncaughtException]', err.message, err.stack);
    // Give the logger a moment to flush before exiting
    setTimeout(() => process.exit(1), 500);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    console.error('[unhandledRejection]', reason);
    // Do NOT exit — NestJS and most production environments tolerate
    // unhandled rejections from third-party code. Log and keep running.
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  const isProduction = configService.get<string>('app.env') === 'production';

  app.useLogger(logger);

  // ── Serve uploaded files as static assets ────────────────────────────────
  const uploadDir = path.resolve(
    configService.get<string>('app.uploadDir') ?? './uploads',
  );
  app.useStaticAssets(uploadDir, { prefix: '/uploads' });

  // ── Serve React frontend from same process (production only) ─────────────
  // Frontend is built into vclop-backend/public by the build process.
  if (isProduction) {
    const frontendDist = path.resolve(__dirname, '../../public');
    const fs = require('fs') as typeof import('fs');
    if (fs.existsSync(frontendDist)) {
      app.useStaticAssets(frontendDist, { prefix: '/' });
      // SPA fallback — serve index.html for any unmatched non-API route
      app.use((req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => {
        if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) return next();
        const indexFile = path.join(frontendDist, 'index.html');
        if (fs.existsSync(indexFile)) res.sendFile(indexFile);
        else next();
      });
    }
  }

  // ── Graceful shutdown ────────────────────────────────────────────────────
  // Enables NestJS lifecycle hooks (OnApplicationShutdown) and listens for
  // OS signals so open DB connections / queues are flushed before exit.
  app.enableShutdownHooks();

  // ── Security ─────────────────────────────────────────────────────────────
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        // Allow opening uploaded files (PDFs, images) in a new tab
        frameAncestors: ["'self'"],
        objectSrc: ["'self'"],
      },
    },
  }));
  app.use(compression());
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: configService.get<string>('app.frontendUrl'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
  });

  // ── API Versioning ────────────────────────────────────────────────────────
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global interceptors ───────────────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
    new LoggingInterceptor(logger),
  );

  // ── Global filters ────────────────────────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter(logger));

  // ── Swagger ───────────────────────────────────────────────────────────────
  // In production: only expose docs if SWAGGER_ENABLED=true (opt-in).
  // In development: always enabled for convenience.
  const swaggerEnabled =
    !isProduction || process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VCLOP API')
      .setDescription('Vertical Capital Lending & Operations Platform — REST API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('Auth', 'Authentication & token management')
      .addTag('Users', 'User management')
      .addTag('Roles', 'Role management')
      .addTag('Permissions', 'Permission catalog')
      .addTag('Departments', 'Department management')
      .addTag('Branches', 'Branch management')
      .addTag('Settings', 'System configuration')
      .addTag('Audit', 'Audit trail')
      .addTag('Dashboard', 'Dynamic dashboard & widgets')
      .addTag('Health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = configService.get<number>('app.port') ?? 3000;
  await app.listen(port);

  logger.log(`VCLOP Backend running on port ${port} [${isProduction ? 'production' : 'development'}]`, 'Bootstrap');
  if (swaggerEnabled) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap();
