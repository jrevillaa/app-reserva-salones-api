import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService
 *
 * Wrapper de Prisma Client para integracion con NestJS.
 * Maneja el ciclo de vida de la conexion a la base de datos:
 * conecta al iniciar el modulo y desconecta al destruirlo.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Prisma v7: la URL de la base de datos se inyecta aqui
      datasourceUrl: process.env.DATABASE_URL,
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    } as any);
  }

  /**
   * Establece la conexion con la base de datos al iniciar el modulo.
   * Lanza error si no puede conectar (fail fast).
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Conexion a base de datos establecida');
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos', error);
      throw error;
    }
  }

  /**
   * Cierra la conexion con la base de datos al destruir el modulo.
   * Garantiza shutdown limpio de la aplicacion.
   */
  async onModuleDestroy() {
    try {
      await this.$disconnect();
      this.logger.log('Conexion a base de datos cerrada');
    } catch (error) {
      this.logger.error('Error al desconectar de la base de datos', error);
    }
  }

  /**
   * Limpia la base de datos solo en entorno de pruebas.
   * Precondicion: NODE_ENV debe ser 'test'.
   *
   * @throws Error si se intenta usar fuera del entorno de pruebas
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase solo puede usarse en entorno de pruebas');
    }

    const models = Reflect.ownKeys(this).filter(
      (key) => typeof key === 'string' && key[0] !== '_' && key[0] !== '$',
    );

    return Promise.all(
      models.map((modelKey) => {
        const model = this[modelKey as keyof this] as any;
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany();
        }
        return Promise.resolve();
      }),
    );
  }
}
