import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

/**
 * Bootstrap del proceso worker.
 *
 * Levanta un ApplicationContext sin servidor HTTP para procesar
 * jobs de BullMQ desde Redis en un contenedor separado.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
async function bootstrapWorker() {
  const logger = new Logger('WorkerBootstrap');

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'error', 'warn', 'debug', 'verbose']
        : ['log', 'error', 'warn'],
  });

  app.enableShutdownHooks();

  logger.log('Worker BullMQ iniciado correctamente');
}

bootstrapWorker().catch((error) => {
  console.error('Error al arrancar el worker:', error);
  process.exit(1);
});
