import { z } from 'zod';

/**
 * Esquema Zod para validar variables de entorno al inicio de la aplicacion.
 * Si alguna variable requerida falta o es invalida, la app falla rapidamente (fail fast).
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export const envSchema = z.object({
  // Servidor
  PORT: z.string().default('3001').transform(Number).pipe(z.number().min(1).max(65535)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Base de datos
  DATABASE_URL: z.string().url(),

  // Redis (para BullMQ)
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform(Number).pipe(z.number()),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform(Number).pipe(z.number()),
  REDIS_QUEUE_PREFIX: z.string().default('salonpay'),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // CORS
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // URL del frontend (para links en emails)
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Email (Nodemailer)
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().default('587').transform(Number).pipe(z.number()),
  EMAIL_SECURE: z
    .string()
    .default('false')
    .transform((val) => val === 'true'),
  EMAIL_USER: z.string().email().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@salonpay.com'),

  // Subida de archivos
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z
    .string()
    .default('5242880')
    .transform(Number)
    .pipe(z.number()),

  // Rate Limiting
  THROTTLE_TTL: z
    .string()
    .default('60000')
    .transform(Number)
    .pipe(z.number()),
  THROTTLE_LIMIT: z.string().default('10').transform(Number).pipe(z.number()),

  // AWS S3 (opcional, para produccion)
  AWS_REGION: z.string().optional(),
  AWS_BUCKET: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Valida las variables de entorno al inicio.
 * Lanza un error descriptivo si falla alguna validacion.
 *
 * @param config - Variables de entorno crudas
 * @returns Variables validadas y con tipos correctos
 * @throws Error si alguna variable es invalida o falta
 */
export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.format();
    const errorMessages = Object.entries(errors)
      .filter(([key]) => key !== '_errors')
      .map(([key, value]) => {
        const error = value as { _errors?: string[] };
        return `${key}: ${error._errors?.join(', ') || 'Valor invalido'}`;
      })
      .join('\n');

    throw new Error(`Validacion de variables de entorno fallida:\n${errorMessages}`);
  }

  return result.data;
}
