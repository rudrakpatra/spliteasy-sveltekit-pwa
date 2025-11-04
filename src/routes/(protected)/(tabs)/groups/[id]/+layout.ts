import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async (event) => {
    const { params } = event;
    return { groupId: params.id };
};
