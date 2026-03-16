import { Injectable, Logger } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../database';

/**
 * Datos necesarios para registrar una entrada de auditoria.
 */
export interface AuditLogData {
  workspaceId: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditService
 *
 * Servicio global para registrar acciones de auditoria en la base de datos.
 * Se usa en toda la aplicacion para trazar operaciones importantes:
 * logins, registros, cambios de rol, operaciones CRUD criticas, etc.
 *
 * No lanza excepciones para no afectar el flujo principal del negocio.
 * Los errores de auditoria se registran en el log pero no interrumpen la operacion.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada en el log de auditoria.
   * Opera de forma fire-and-forget: no bloquea el flujo principal.
   *
   * @param data - Datos de la accion a registrar
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          workspaceId: data.workspaceId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // No relanzar el error para no afectar el flujo principal
      this.logger.error(
        `Error al registrar auditoria [${data.action}]: ${(error as Error).message}`,
      );
    }
  }
}
