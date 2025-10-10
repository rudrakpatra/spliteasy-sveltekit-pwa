import { router as groupsRouter } from './routers/groups';
import { t } from './init';

export const router = t.router({
    groups: groupsRouter,
});

export type Router = typeof router;