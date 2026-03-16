import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
  LoggingInterceptor,
  JwtAuthGuard,
} from './common';

/**
 * Bootstrap - Funcion de inicializacion de la aplicacion NestJS.
 *
 * Configura en orden:
 * 1. Helmet (headers de seguridad HTTP)
 * 2. CORS desde configuracion de entorno
 * 3. Prefijo global /api
 * 4. Filtros de excepciones globales
 * 5. Interceptor de logging
 * 6. Guard JWT global (con soporte para @Public())
 * 7. Swagger en /api/docs
 * 8. Shutdown hooks para cierre limpio
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['log', 'error', 'warn'],
  });

  const configService = app.get(ConfigService);

  // Helmet: headers de seguridad HTTP (Content-Security-Policy, X-Frame-Options, etc.)
  app.use(helmet());

  // CORS: permite que el frontend haga requests al backend
  app.enableCors({
    origin: configService.get<string>('server.corsOrigin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Prefijo global para todos los endpoints
  app.setGlobalPrefix('api');

  // Filtros globales de excepciones
  // Orden importante: AllExceptionsFilter captura todo lo que HttpExceptionFilter no capture
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new HttpExceptionFilter(),
  );

  // Interceptor de logging global
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Guard JWT global - protege todos los endpoints excepto los marcados con @Public()
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));

  // Documentacion Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SalonPay API')
    .setDescription(
      'API REST para SalonPay - Sistema de Reservaciones y Pagos Multi-tenant\n\n' +
      'Para usar endpoints protegidos incluye el header:\n' +
      'Authorization: Bearer {access_token}\n\n' +
      'Obtén el token desde POST /api/auth/login',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa el JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticacion y gestion de sesion')
    .addTag('Users', 'Gestion de perfil de usuario')
    .addTag('Dashboard', 'Panel principal y estadisticas')
    .addTag('Health', 'Health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SalonPay API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayRequestDuration: true,
    },
  });

  // Shutdown hooks para cierre limpio de conexiones
  app.enableShutdownHooks();

  const port = configService.get<number>('server.port') || 3001;
  const nodeEnv = configService.get<string>('server.nodeEnv') || 'development';

  await app.listen(port);

  logger.log(`Aplicacion corriendo en: http://localhost:${port}/api`);
  logger.log(`Entorno: ${nodeEnv}`);
  logger.log(`CORS habilitado para: ${configService.get('server.corsOrigin')}`);
  logger.log(`Documentacion Swagger: http://localhost:${port}/api/docs`);
}

bootstrap().catch((error) => {
  console.error('Error al arrancar la aplicacion:', error);
  process.exit(1);
});
