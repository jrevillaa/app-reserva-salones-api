import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database';

/**
 * DashboardService
 *
 * Provee datos de resumen para el panel principal del usuario.
 * Las estadisticas son mock por ahora (Sprint 1).
 * En sprints futuros se reemplazaran con queries reales a la BD.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retorna el resumen del dashboard para el usuario autenticado.
   * Incluye datos del usuario, workspace y estadisticas (mock por ahora).
   *
   * @param userId - ID del usuario autenticado
   * @returns Resumen del dashboard
   * @throws NotFoundException si el usuario no existe
   */
  async getSummary(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            plan: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Estadisticas mock - se reemplazaran con queries reales en sprints futuros
    return {
      user,
      stats: {
        totalReservations: 0,
        pendingPayments: 0,
        confirmedReservations: 0,
      },
    };
  }
}
