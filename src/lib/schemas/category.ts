import { z } from 'zod';

export const categorySchema = z.object({ name: z.string().trim().min(1) });

export const categoryUpdateSchema = categorySchema.extend({ id: z.uuid() });

export const categoryIdSchema = z.object({ id: z.uuid() });
