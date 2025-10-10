import { t } from './init';
import { router as groupsRouter } from './routers/group';
import { router as userRouter } from './routers/user';
import { router as expenseRouter } from './routers/expense';

export const router = t.router({
    group: groupsRouter,
    user: userRouter,
    expense: expenseRouter,
});

export type Router = typeof router;