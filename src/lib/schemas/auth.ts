import { z } from 'zod/v4';

export const loginSchema = z.object({
	username: z
		.string()
		.min(3, 'Username must be at least 3 characters')
		.max(31, 'Username must be at most 31 characters')
		.regex(/^[a-z0-9_-]+$/, 'Username must be alphanumeric with dashes or underscores'),
	password: z
		.string()
		.min(6, 'Password must be at least 6 characters')
		.max(255, 'Password must be at most 255 characters')
});

export type LoginSchema = z.infer<typeof loginSchema>;
