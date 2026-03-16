import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

/**
 * DashboardModule
 *
 * Modulo del panel de control principal.
 * Provee estadisticas y datos de resumen al usuario autenticado.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
