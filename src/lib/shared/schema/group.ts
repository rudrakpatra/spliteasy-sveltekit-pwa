import type { insertGroupSchema } from '$lib/trpc/routers/group';
import { z } from 'zod';

export const createGroupSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Name is too long'),
    img: z.url('Must be a valid URL').optional().or(z.literal('')),
    members: z.array(z.uuid().min(1, 'User is required')),
});


export const transformedCreateGroupSchema = createGroupSchema.transform((data) => {
    const out: z.infer<typeof insertGroupSchema> = {
        ...data,
        img: data.img || '',
        members: data.members.map((member) => member as string),
    };
    return out;
});
