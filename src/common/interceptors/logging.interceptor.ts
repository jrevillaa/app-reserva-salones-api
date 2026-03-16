import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * LoggingInterceptor
 *
 * Registra automaticamente cada request HTTP:
 * metodo, URL, codigo de respuesta y duracion en ms.
 * Los requests lentos (>1000ms) se registran con advertencia.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepta el ciclo de vida del request para registrar tiempos.
   *
   * @param context - Contexto de ejecucion
   * @param next - Handler del siguiente elemento en la cadena
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const duration = Date.now() - now;

          if (duration > 1000) {
            this.logger.warn(`${method} ${url} -> ${statusCode} [${duration}ms] LENTO`);
          } else {
            this.logger.log(`${method} ${url} -> ${statusCode} [${duration}ms]`);
          }
        },
        error: (error) => {
          const duration = Date.now() - now;
          const statusCode = error.status || 500;
          this.logger.error(
            `${method} ${url} -> ${statusCode} [${duration}ms] ERROR: ${error.message}`,
          );
        },
      }),
    );
  }
}
