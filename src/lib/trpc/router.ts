import { t } from './init';
import { router as groupsRouter } from './routers/group';
import { router as userRouter } from './routers/user';

export const router = t.router({
    group: groupsRouter,
    user: userRouter,
});

export type Router = typeof router;