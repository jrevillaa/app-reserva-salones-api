import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Estructura de respuesta de error estandarizada.
 */
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}

/**
 * HttpExceptionFilter
 *
 * Captura excepciones HTTP y las formatea de manera consistente.
 * Todas las respuestas de error tienen la misma estructura JSON.
 * Oculta stack traces en produccion para no exponer informacion sensible.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Intercepta la excepcion HTTP y construye respuesta estandarizada.
   *
   * @param exception - Excepcion HTTP lanzada
   * @param host - Contexto de ejecucion
   */
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extrae el mensaje: puede ser string o array de errores de validacion
    let message: string | string[];
    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      message = (exceptionResponse as any).message;
    } else {
      message = 'Error interno del servidor';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: exception.name || 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= 500) {
      this.logger.error(
        `Error ${status} en ${request.method} ${request.url}`,
        exception.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(
        `Error ${status} en ${request.method} ${request.url}: ${JSON.stringify(message)}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}

/**
 * AllExceptionsFilter
 *
 * Captura cualquier excepcion no HTTP (errores inesperados, bugs, etc.)
 * y la convierte en una respuesta HTTP 500 generica.
 * En produccion nunca se expone el stack trace.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  /**
   * Captura cualquier tipo de excepcion no controlada.
   *
   * @param exception - Excepcion desconocida
   * @param host - Contexto de ejecucion
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Error interno del servidor';
    if (process.env.NODE_ENV === 'development' && exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Error no manejado en ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      message,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }
}
