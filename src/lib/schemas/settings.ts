import { z } from 'zod';
import { jsonField } from './common';

export const daysThresholdSchema = z.int().min(0).max(365);

export const excludedCategoryIdsSchema = z.array(z.uuid());

export const settingsUpdateSchema = z.object({
	suggestionDaysThreshold: daysThresholdSchema.optional(),
	suggestionUseDayOfWeek: z.boolean().optional(),
	suggestionExcludedCategoryIds: excludedCategoryIdsSchema.optional()
});

/** Form fields arrive as text: the threshold as a number string, the ids as a JSON array. */
export const settingsFormSchema = z.object({
	suggestionDaysThreshold: z.coerce.number().pipe(daysThresholdSchema),
	suggestionUseDayOfWeek: z.boolean(),
	suggestionExcludedCategoryIds: jsonField(excludedCategoryIdsSchema)
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
