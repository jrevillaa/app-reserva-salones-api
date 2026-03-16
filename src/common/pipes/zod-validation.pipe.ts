import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

/**
 * ZodValidationPipe
 *
 * Pipe de validacion que usa esquemas Zod para validar y transformar
 * el body de las peticiones HTTP antes de llegar al controlador.
 * Si la validacion falla, lanza BadRequestException con mensajes claros.
 *
 * Uso:
 * @Body(new ZodValidationPipe(mySchema)) dto: MyDto
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  /**
   * Valida y transforma el valor de entrada usando el esquema Zod.
   * Lanza BadRequestException si la validacion falla.
   *
   * @param value - Valor recibido en el body del request
   * @returns Valor validado y transformado por Zod
   * @throws BadRequestException si el schema no es valido
   */
  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const zodError = result.error as ZodError;
      // Extraer mensajes de error legibles de los errores de Zod
      const errors = zodError.issues.map(
        (e) => `${e.path.join('.')}: ${e.message}`,
      );
      throw new BadRequestException(errors);
    }

    return result.data;
  }
}
