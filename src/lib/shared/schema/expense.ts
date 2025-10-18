import { z } from 'zod';
import { categorySchema } from '../category/category';
import { currencyCodeSchema } from '../currency/currency';
import { evaluate, evaluateShares, amountExpressionSchema, numberStringSchema, shareExpressionSchema, type NumberString } from './math';
import { type UserId, userIdSchema } from './user';
import { CURRENCY_MAP, type CurrencyCode } from '../currency/currency-codes';
import type { insertExpenseInputSchema } from '$lib/trpc/routers/expense';

export const expenseItemsSchema = z
    .array(
        z.object({
            name: z.string().min(1, 'Name is required'),
            amountExpression: amountExpressionSchema,
            split: z.array(
                z.object({
                    userId: userIdSchema,
                    shareExpression: shareExpressionSchema,
                })
            ),
        })
    )

export const payersSchema = z.array(
    z.object({
        userId: userIdSchema,
        amountExpression: amountExpressionSchema, // e.g., "200", "150.50"
    })
).min(1, 'At least one payer is required')

export const createExpenseSchema = z.object({
    name: z.string().min(1, 'Expense name is required').max(100, 'Name is too long'),
    groupId: z.uuid({ error: 'Group is required' }),
    currency: currencyCodeSchema.nullable().refine((value) => value !== null, {
        message: 'Currency is required',
    }).transform((value) => value as CurrencyCode),
    payers: payersSchema,
    items: expenseItemsSchema,
    category: categorySchema.optional(),
    notes: z.string().optional(),
    receiptImageUrl: z.url().optional(),
}).superRefine((data, ctx) => {
    data.items.forEach((item, itemIndex) => {
        const { amountExpression, split } = item;
        const shareExpressions = split.map((s) => s.shareExpression);

        let shares: number[];
        let itemAmount: number;

        try {
            shares = evaluateShares(amountExpression, shareExpressions);
            itemAmount = evaluate(amountExpression);
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: error instanceof Error ? error.message : 'Invalid expression',
                path: [itemIndex, 'amountExpression'],
            });
            return; // Early return to prevent cascading errors
        }

        // Validate each share
        shares.forEach((share, splitIndex) => {
            if (isNaN(share)) {
                ctx.addIssue({
                    code: "custom",
                    message: 'Share expression resulted in invalid number',
                    path: [itemIndex, 'split', splitIndex, 'shareExpression'],
                });
            } else if (share < 0) {
                ctx.addIssue({
                    code: "custom",
                    message: 'Share cannot be negative',
                    path: [itemIndex, 'split', splitIndex, 'shareExpression'],
                });
            }
        });

        // Validate total shares equal item amount (with small tolerance for floating point)
        const totalShares = shares.reduce((sum, share) => sum + share, 0);
        // find tolerance from currency

        const digits = CURRENCY_MAP.get(data.currency)?.digits || 2;
        const tolerance = 10 ** -digits;

        if (Math.abs(totalShares - itemAmount) > tolerance) {
            ctx.addIssue({
                code: "custom",
                message: `Shares (${totalShares.toFixed(digits)}) must equal item amount (${itemAmount.toFixed(digits)})`,
                path: [itemIndex, 'split'],
            });
        }
    });

    const totalPaid = data.payers.reduce((sum, payer) => {
        try {
            return sum + evaluate(payer.amountExpression);
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: 'Invalid payment amount',
                path: ['payers', data.payers.indexOf(payer), 'amountExpression'],
            });
            return sum;
        }
    }, 0);


    const totalItemAmount = data.items.reduce((sum, item) => {
        try {
            return sum + evaluate(item.amountExpression);
        } catch {
            return sum;
        }
    }, 0);

    const digits = CURRENCY_MAP.get(data.currency)?.digits || 2;
    const tolerance = 10 ** -digits;

    // Ensure total paid matches total items
    if (Math.abs(totalPaid - totalItemAmount) > tolerance) {
        ctx.addIssue({
            code: 'custom',
            message: `Total paid (${totalPaid.toFixed(digits)}) must equal total items (${totalItemAmount.toFixed(digits)})`,
            path: ['payers'],
        });
    }
})

export const editExpenseSchema = createExpenseSchema.safeExtend({
    id: z.uuid().min(1, 'Expense id is required'),
});

export const transformedCreateExpenseSchema = createExpenseSchema.transform((data) => {
    const digits = CURRENCY_MAP.get(data.currency)?.digits || 2;
    const userIds = new Set([
        ...data.payers.map(p => p.userId),
        ...data.items.flatMap((item) => item.split.map((s) => s.userId))
    ]);

    const splits: z.infer<typeof insertExpenseInputSchema>['splits'] = [];

    // Calculate how much each user owes from items
    const getOwesAmount = (items: z.infer<typeof expenseItemsSchema>, userId: UserId): NumberString => {
        const owesAmount = items.reduce((total, item) => {
            const shareValues = evaluateShares(item.amountExpression, item.split.map((s) => s.shareExpression));
            const userIndex = item.split.findIndex((s) => s.userId === userId);
            const userShare = shareValues[userIndex];
            if (userShare && userShare > 0) {
                return total + userShare;
            }
            return total;
        }, 0);
        return numberStringSchema.decode(owesAmount.toFixed(digits));
    };

    // Calculate how much each user paid from payers
    const getPaidAmount = (payers: typeof data.payers, userId: UserId): NumberString => {
        const paidAmount = payers.reduce((total, payer) => {
            if (payer.userId === userId) {
                try {
                    return total + evaluate(payer.amountExpression);
                } catch {
                    return total;
                }
            }
            return total;
        }, 0);
        return numberStringSchema.decode(paidAmount.toFixed(digits));
    };

    // Create splits for all users involved
    userIds.forEach(userId => {
        splits.push({
            userId,
            currency: data.currency,
            owesAmount: getOwesAmount(data.items, userId),
            paidAmount: getPaidAmount(data.payers, userId),
        });
    });

    return {
        groupId: data.groupId,
        name: data.name,
        metadata: {
            category: data.category || null,
            notes: data.notes || null,
            receiptImageUrl: data.receiptImageUrl || null,
        },
        splits,
    };
});


