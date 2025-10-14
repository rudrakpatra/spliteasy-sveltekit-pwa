import { t } from './init';
import { groupRouter } from './routers/group';
import { userRouter } from './routers/user';
import { expenseRouter } from './routers/expense';

export const router = t.router({
    group: groupRouter,
    user: userRouter,
    expense: expenseRouter,
});

export type Router = typeof router;