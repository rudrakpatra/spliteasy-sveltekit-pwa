import type { PageLoad } from './$types'
import { db } from '$lib/server/db'
import { groups } from '$lib/server/db/schema'

export const load: PageLoad = async ({ parent, fetch }) => {
    const { queryClient } = await parent()

    // Prefetch posts data using SvelteKit's fetch
    await queryClient.prefetchQuery({
        queryKey: ['groups'],
        queryFn: async () => await db.select().from(groups),
    })
}
