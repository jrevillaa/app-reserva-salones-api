import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from './common/decorators';

/**
 * AppController
 *
 * Controlador raiz de la aplicacion.
 * Provee el endpoint de health check para monitoreo.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@ApiTags('Health')
@Controller()
export class AppController {
  /**
   * GET /health
   * Retorna el estado actual de la aplicacion.
   * Endpoint publico para monitoring y health checks.
   */
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check de la aplicacion' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'SalonPay API',
      version: '1.0.0',
    };
  }
}
