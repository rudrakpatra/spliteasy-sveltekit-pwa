import { z } from 'zod';

export const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Name is too long'),
    img: z.url('Must be a valid URL').optional().or(z.literal('')),
});

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;
