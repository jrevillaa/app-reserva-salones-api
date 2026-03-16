import { z } from 'zod';

/**
 * Reservation Validators
 */

export const createReservationSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  ratePlanId: z.string().min(1, 'Rate plan ID is required'),
  clientId: z.string().min(1, 'Client ID is required'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return end > start;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const checkAvailabilitySchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
});

export const cancelReservationSchema = z.object({
  reason: z.string().optional(),
});

export type CreateReservationDto = z.infer<typeof createReservationSchema>;
export type CheckAvailabilityDto = z.infer<typeof checkAvailabilitySchema>;
export type CancelReservationDto = z.infer<typeof cancelReservationSchema>;
