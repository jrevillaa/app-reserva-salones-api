import 'dotenv/config';
import { PrismaClient, UserRole, RatePlanType, AuditAction } from '@prisma/client';
import * as argon2 from 'argon2';

/**
 * Seed de la base de datos para SalonPay.
 *
 * Inserta datos de ejemplo de forma idempotente (upsert):
 * - 1 workspace "SalonPay Demo"
 * - 3 usuarios (OWNER, ADMIN, CLIENT) ya verificados
 * - 2 salas de ejemplo con rate plans
 * - Audit logs de ejemplo
 *
 * Puede ejecutarse multiples veces sin duplicar datos.
 * Uso: pnpm --filter api db:seed
 *
 * @author Jair Revilla <jrevilla492@gmail.com>
 */
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed de la base de datos...');

  // Crear workspace demo
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'salonpay-demo' },
    update: { name: 'SalonPay Demo' },
    create: {
      name: 'SalonPay Demo',
      slug: 'salonpay-demo',
      currency: 'PEN',
      timezone: 'America/Lima',
      plan: 'FREE',
    },
  });

  console.log(`Workspace: ${workspace.name} (${workspace.id})`);

  // Hashear contrasenas de los usuarios seed
  const [ownerHash, adminHash, clientHash] = await Promise.all([
    argon2.hash('Owner1234!'),
    argon2.hash('Admin1234!'),
    argon2.hash('Client1234!'),
  ]);

  // Crear usuario OWNER
  const owner = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'owner@salonpay.com' } },
    update: { passwordHash: ownerHash },
    create: {
      email: 'owner@salonpay.com',
      passwordHash: ownerHash,
      firstName: 'Carlos',
      lastName: 'Duenas',
      role: UserRole.OWNER,
      workspaceId: workspace.id,
      emailVerified: true,
      emailNotifications: true,
    },
  });

  // Crear usuario ADMIN
  const admin = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'admin@salonpay.com' } },
    update: { passwordHash: adminHash },
    create: {
      email: 'admin@salonpay.com',
      passwordHash: adminHash,
      firstName: 'Maria',
      lastName: 'Lopez',
      role: UserRole.ADMIN,
      workspaceId: workspace.id,
      emailVerified: true,
      emailNotifications: true,
    },
  });

  // Crear usuario CLIENT
  const client = await prisma.user.upsert({
    where: { workspaceId_email: { workspaceId: workspace.id, email: 'cliente@salonpay.com' } },
    update: { passwordHash: clientHash },
    create: {
      email: 'cliente@salonpay.com',
      passwordHash: clientHash,
      firstName: 'Ana',
      lastName: 'Torres',
      role: UserRole.CLIENT,
      workspaceId: workspace.id,
      emailVerified: true,
      emailNotifications: true,
    },
  });

  console.log(`Usuarios creados: ${owner.email}, ${admin.email}, ${client.email}`);

  // Crear sala 1: Sala de Reuniones Principal
  const room1 = await prisma.room.upsert({
    where: { id: 'seed-room-001' },
    update: {},
    create: {
      id: 'seed-room-001',
      workspaceId: workspace.id,
      name: 'Sala de Reuniones Principal',
      description: 'Sala amplia con proyector, pizarra y capacidad para 20 personas.',
      capacity: 20,
      cleanupBuffer: 15,
      amenities: ['WiFi', 'Proyector', 'Pizarra', 'Aire acondicionado'],
      isActive: true,
    },
  });

  // Rate plan por hora para sala 1
  await prisma.ratePlan.upsert({
    where: { id: 'seed-rp-001' },
    update: {},
    create: {
      id: 'seed-rp-001',
      workspaceId: workspace.id,
      roomId: room1.id,
      name: 'Tarifa Por Hora',
      type: RatePlanType.HOURLY,
      price: 80.00,
      currency: 'PEN',
      depositPercent: 30,
      isActive: true,
    },
  });

  // Rate plan diario para sala 1
  await prisma.ratePlan.upsert({
    where: { id: 'seed-rp-002' },
    update: {},
    create: {
      id: 'seed-rp-002',
      workspaceId: workspace.id,
      roomId: room1.id,
      name: 'Tarifa Diaria',
      type: RatePlanType.DAILY,
      price: 500.00,
      currency: 'PEN',
      depositPercent: 50,
      isActive: true,
    },
  });

  // Crear sala 2: Estudio de Fotografia
  const room2 = await prisma.room.upsert({
    where: { id: 'seed-room-002' },
    update: {},
    create: {
      id: 'seed-room-002',
      workspaceId: workspace.id,
      name: 'Estudio de Fotografia',
      description: 'Estudio profesional con ciclorama, iluminacion y fondos variados.',
      capacity: 10,
      cleanupBuffer: 30,
      amenities: ['Ciclorama', 'Iluminacion profesional', 'Fondos variados', 'Vestuario'],
      isActive: true,
    },
  });

  // Rate plan por hora para sala 2
  await prisma.ratePlan.upsert({
    where: { id: 'seed-rp-003' },
    update: {},
    create: {
      id: 'seed-rp-003',
      workspaceId: workspace.id,
      roomId: room2.id,
      name: 'Tarifa Por Hora Studio',
      type: RatePlanType.HOURLY,
      price: 120.00,
      currency: 'PEN',
      depositPercent: 50,
      isActive: true,
    },
  });

  console.log(`Salas creadas: ${room1.name}, ${room2.name}`);

  // Crear audit logs de ejemplo
  const now = new Date();
  await prisma.auditLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: owner.id,
        action: AuditAction.USER_REGISTER,
        entityType: 'User',
        entityId: owner.id,
        metadata: { email: owner.email, role: owner.role, seed: true },
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // hace 7 dias
      },
      {
        workspaceId: workspace.id,
        userId: owner.id,
        action: AuditAction.USER_EMAIL_VERIFIED,
        entityType: 'User',
        entityId: owner.id,
        metadata: { email: owner.email, seed: true },
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000 + 300000),
      },
      {
        workspaceId: workspace.id,
        userId: owner.id,
        action: AuditAction.USER_LOGIN,
        entityType: 'User',
        entityId: owner.id,
        metadata: { success: true, seed: true },
        createdAt: new Date(now.getTime() - 60 * 60 * 1000), // hace 1 hora
      },
    ],
    skipDuplicates: true,
  });

  console.log('Audit logs de ejemplo creados.');
  console.log('Seed completado exitosamente.');
  console.log('---');
  console.log('Credenciales de acceso:');
  console.log('  OWNER: owner@salonpay.com / Owner1234!');
  console.log('  ADMIN: admin@salonpay.com / Admin1234!');
  console.log('  CLIENT: cliente@salonpay.com / Client1234!');
}

main()
  .catch((error) => {
    console.error('Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
