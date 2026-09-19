/**
 * Thrown when a record is missing or belongs to another user. Both cases look the same to
 * the caller so ids of other users' rows can't be probed.
 */
export class NotFoundError extends Error {
	constructor(readonly entity: string) {
		super(`${entity} not found`);
		this.name = 'NotFoundError';
	}
}

/** Input that passed schema validation but breaks a rule that needs the database to check. */
export class InvalidInputError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidInputError';
	}
}
