import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';

/**
 * UsersModule
 *
 * Modulo de gestion de usuarios.
 * Exporta UsersService para uso en otros modulos si fuera necesario.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
