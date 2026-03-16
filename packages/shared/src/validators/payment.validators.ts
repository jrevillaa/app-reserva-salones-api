import { z } from 'zod';

/**
 * Payment Validators
 */

export const validatePaymentSchema = z.object({
  validationNotes: z.string().optional(),
});

export const rejectPaymentSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export const uploadVoucherSchema = z.object({
  file: z.any(), // File validation handled by backend
});

export type ValidatePaymentDto = z.infer<typeof validatePaymentSchema>;
export type RejectPaymentDto = z.infer<typeof rejectPaymentSchema>;
export type UploadVoucherDto = z.infer<typeof uploadVoucherSchema>;
