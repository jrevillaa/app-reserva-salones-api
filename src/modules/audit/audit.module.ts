import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * AuditModule
 *
 * Modulo global de auditoria. Al ser global, AuditService esta disponible
 * para inyeccion en cualquier modulo sin necesidad de importarlo.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
