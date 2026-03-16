import { z } from 'zod';

/**
 * Room Validators
 */

export const roomScheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  openTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  closeTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  isClosed: z.boolean().default(false),
});

export const createRoomSchema = z.object({
  name: z.string().min(3, 'Room name must be at least 3 characters'),
  description: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').default(1),
  cleanupBuffer: z.number().min(0, 'Cleanup buffer cannot be negative').default(15),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string().url()).optional(),
  schedules: z.array(roomScheduleSchema).optional(),
});

export const updateRoomSchema = createRoomSchema.partial();

export type RoomScheduleDto = z.infer<typeof roomScheduleSchema>;
export type CreateRoomDto = z.infer<typeof createRoomSchema>;
export type UpdateRoomDto = z.infer<typeof updateRoomSchema>;
