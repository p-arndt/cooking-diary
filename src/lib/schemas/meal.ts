import { z } from 'zod';
import { jsonField, photoUrlSchema } from './common';

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export const difficultySchema = z.enum(DIFFICULTIES);

export type Difficulty = z.infer<typeof difficultySchema>;

export const mealSchema = z.object({
	title: z.string().trim().min(1),
	defaultNotes: z.string().nullish(),
	defaultPhotoUrl: photoUrlSchema.nullish(),
	prepTime: z.string().nullish(),
	cookTime: z.string().nullish(),
	difficulty: difficultySchema.nullish(),
	categoryIds: z.array(z.uuid()).optional()
});

export const mealUpdateSchema = mealSchema.partial();

/** The web forms send the selected category ids as a JSON array in a single field. */
export const mealFormSchema = mealSchema.extend({
	categoryIds: jsonField(z.array(z.uuid()))
});

export type MealInput = z.infer<typeof mealSchema>;
export type MealUpdateInput = z.infer<typeof mealUpdateSchema>;
