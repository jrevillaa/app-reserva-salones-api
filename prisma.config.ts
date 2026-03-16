import 'dotenv/config';
// @ts-ignore - Prisma v7 config module
import { defineConfig } from 'prisma/config';

/**
 * Configuracion de Prisma v7.
 * Define esquema, rutas de migraciones, seed y fuente de datos.
 * La URL de la base de datos se lee desde la variable DATABASE_URL.
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
