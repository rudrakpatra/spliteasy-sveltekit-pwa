import { t } from './init';
import { groupRouter } from './routers/group';
import { userRouter } from './routers/user';
import { expenseRouter } from './routers/expense';
import { aiRouter } from './routers/ai';

export const router = t.router({
    ai: aiRouter,
    group: groupRouter,
    user: userRouter,
    expense: expenseRouter,
});

export type Router = typeof router;