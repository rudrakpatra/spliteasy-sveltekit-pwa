import { getContext, setContext } from 'svelte';
import type { createGroupSchema } from '$lib/shared/schema/group';
import type { SuperForm } from 'sveltekit-superforms';
import type z from 'zod';

type GroupAddFormContext = {
    form: SuperForm<z.infer<typeof createGroupSchema>>;
    image: {
        readonly blobUrl: string | undefined;
        readonly file: File | null;
        readonly isUploading: boolean;
        onChange: (event: Event) => void;
        onRemove: () => void;
    };
    submitting: boolean;
};

const KEY = Symbol('GROUP_ADD_FORM');

export function setGroupAddFormContext(ctx: GroupAddFormContext) {
    return setContext(KEY, ctx);
}

export function getGroupAddFormContext() {
    return getContext<GroupAddFormContext>(KEY);
}

export function generateId() {
    return crypto.randomUUID().substring(0, 6);
}
