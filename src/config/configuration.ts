import { EnvConfig } from './env.validation';

/**
 * Funcion de configuracion para ConfigModule de NestJS.
 * Centraliza el acceso a variables de entorno con namespaces.
 * Acceso: ConfigService.get('server.port'), ConfigService.get('jwt.secret'), etc.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export default () => {
  const config = process.env as unknown as EnvConfig;

  return {
    server: {
      port: config.PORT,
      nodeEnv: config.NODE_ENV,
      corsOrigin: config.CORS_ORIGIN,
      frontendUrl: config.FRONTEND_URL,
    },
    database: {
      url: config.DATABASE_URL,
    },
    redis: {
      host: config.REDIS_HOST,
      port: config.REDIS_PORT,
      password: config.REDIS_PASSWORD,
      db: config.REDIS_DB,
      queuePrefix: config.REDIS_QUEUE_PREFIX,
    },
    jwt: {
      secret: config.JWT_SECRET,
      refreshSecret: config.JWT_REFRESH_SECRET,
      expiresIn: config.JWT_EXPIRES_IN,
      refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
    },
    email: {
      host: config.EMAIL_HOST,
      port: config.EMAIL_PORT,
      secure: config.EMAIL_SECURE,
      user: config.EMAIL_USER,
      password: config.EMAIL_PASSWORD,
      from: config.EMAIL_FROM,
    },
    upload: {
      dir: config.UPLOAD_DIR,
      maxFileSize: config.MAX_FILE_SIZE,
    },
    throttle: {
      ttl: config.THROTTLE_TTL,
      limit: config.THROTTLE_LIMIT,
    },
    aws: {
      region: config.AWS_REGION,
      bucket: config.AWS_BUCKET,
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  };
};
