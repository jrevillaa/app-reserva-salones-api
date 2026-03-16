import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * DatabaseModule
 *
 * Modulo global que provee PrismaService a todos los modulos.
 * Al ser global no es necesario importarlo en cada modulo.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
