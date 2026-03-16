import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';

/**
 * UsersService
 *
 * Logica de negocio relacionada con la gestion de usuarios.
 * Delega el acceso a datos al UsersRepository.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Obtiene el perfil completo de un usuario por ID.
   * Incluye datos del workspace al que pertenece.
   *
   * @param id - ID del usuario
   * @returns Perfil del usuario con workspace
   * @throws NotFoundException si el usuario no existe
   */
  async getProfile(id: string) {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return user;
  }

  /**
   * Actualiza los campos de perfil del usuario autenticado.
   * Solo los campos incluidos en el DTO son modificados.
   *
   * @param id - ID del usuario autenticado
   * @param dto - Campos a actualizar
   * @returns Usuario con los datos actualizados
   * @throws NotFoundException si el usuario no existe
   */
  async updateProfile(id: string, dto: UpdateProfileDto) {
    const exists = await this.usersRepository.findById(id);

    if (!exists) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    return this.usersRepository.updateProfile(id, dto);
  }
}
