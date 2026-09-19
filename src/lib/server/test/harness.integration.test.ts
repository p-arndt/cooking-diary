import { describe, expect, it } from 'vitest';
import { createMeal, createUser } from './factories';
import { MealService } from '$lib/server/services/meal.service';

describe('integration harness', () => {
	it('reads rows through the production db client', async () => {
		const owner = await createUser();
		const meal = await createMeal(owner.id, 'Lasagne');
		expect((await MealService.getMealById(meal.id, owner.id))?.title).toBe('Lasagne');
	});
});
