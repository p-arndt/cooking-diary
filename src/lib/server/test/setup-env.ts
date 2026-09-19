import { inject, vi } from 'vitest';

// Without this, $lib/server/db would connect to whatever database .env points at.
vi.mock('$env/dynamic/private', () => ({ env: { ...process.env, ...inject('dbEnv') } }));
