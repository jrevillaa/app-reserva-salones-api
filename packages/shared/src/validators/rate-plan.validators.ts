import { z } from 'zod';
import { RatePlanType } from '../constants';

/**
 * Rate Plan Validators
 */

export const createRatePlanSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  type: z.nativeEnum(RatePlanType),
  price: z.number().positive('Price must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., PEN)').default('PEN'),
  depositPercent: z.number().min(0).max(100).default(30),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().default(true),
});

export const updateRatePlanSchema = createRatePlanSchema.partial().omit({ roomId: true });

export type CreateRatePlanDto = z.infer<typeof createRatePlanSchema>;
export type UpdateRatePlanDto = z.infer<typeof updateRatePlanSchema>;
