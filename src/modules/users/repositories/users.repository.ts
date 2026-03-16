import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database';
import { UpdateProfileDto } from '../dto/update-profile.dto';

/**
 * UsersRepository
 *
 * Capa de acceso a datos para la entidad User.
 * Centraliza todas las queries de usuarios para facilitar
 * el testing y evitar queries duplicadas en servicios.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca un usuario por ID con su workspace incluido.
   * Retorna null si no existe.
   *
   * @param id - ID del usuario
   */
  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        emailVerified: true,
        emailNotifications: true,
        createdAt: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            timezone: true,
            plan: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza los campos de perfil del usuario.
   * Solo modifica los campos presentes en el DTO.
   *
   * @param id - ID del usuario
   * @param dto - Campos a actualizar
   */
  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });
  }
}
