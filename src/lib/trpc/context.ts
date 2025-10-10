import { db } from "$lib/server/db";
import type { RequestEvent } from "@sveltejs/kit";

export async function createContext(event: RequestEvent) {
    return {
        event,
        db,
    };
}

export type Context = Awaited<ReturnType<typeof createContext>>;