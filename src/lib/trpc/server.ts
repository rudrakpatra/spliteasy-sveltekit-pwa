import type { RequestEvent } from "@sveltejs/kit";
import { createContext } from "./context";
import { router } from "./router";
import { t } from "./init";


// Server-side caller for directly calling tRPC procedures
const factory = t.createCallerFactory(router);

export const createCaller = async (event: RequestEvent) => {
    return factory(await createContext(event));
};