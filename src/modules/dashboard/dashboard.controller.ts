import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';

/**
 * DashboardController
 *
 * Endpoints del panel principal del usuario.
 * Todos los endpoints requieren autenticacion JWT.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /dashboard/summary
   * Retorna el resumen del dashboard para el usuario autenticado.
   * Incluye datos del usuario, workspace y estadisticas.
   */
  @Get('summary')
  @ApiOperation({ summary: 'Resumen del dashboard del usuario' })
  async getSummary(@CurrentUser() user: any) {
    return this.dashboardService.getSummary(user.id);
  }
}
