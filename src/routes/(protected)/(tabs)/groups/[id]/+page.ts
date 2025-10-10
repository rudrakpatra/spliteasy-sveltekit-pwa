import type { PageLoad } from './$types';

export const load: PageLoad = async (event) => {
    const { params } = event;
    return { id: params.id };
};
