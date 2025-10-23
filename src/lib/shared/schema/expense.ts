// lib/shared/schema/expense.ts
import { z } from 'zod';
import { categorySchema } from '../category/category';
import { currencyCodeSchema } from '../currency/currency';
import { evaluate, evaluateShares, amountExpressionSchema, numberStringSchema, shareExpressionSchema, type NumberString } from './math';
import { type UserId, userIdSchema } from './user';
import { CURRENCY_MAP, DEFAULT_CURRENCY, type CurrencyCode } from '../currency/currency-codes';
import type { insertExpenseInputSchema } from '$lib/trpc/routers/expense';

// Schema for payers
export const payersSchema = z.array(
    z.object({
        userId: userIdSchema,
        amountExpression: amountExpressionSchema,
    })
).min(1, 'At least one payer is required');

// Item split schema - for ITEMS mode
export const itemSchema = z.object({
    id: z.uuid(),
    name: z.string().min(1, 'Name is required'),
    amountExpression: amountExpressionSchema,
});

export const itemSplitSchema = z.object({
    id: z.uuid(),
    itemIds: z.array(z.uuid()).min(1, 'At least one item must be selected'),
    shares: z.array(z.object({
        userId: userIdSchema,
        shareExpression: shareExpressionSchema,
    })).min(1, 'At least one user must be selected'),
});

// Main expense schema with only ITEMS split
export const createExpenseSchema = z.object({
    name: z.string().min(1, 'Expense name is required').max(100, 'Name is too long'),
    groupId: z.uuid('Group is required'),
    currency: currencyCodeSchema.default(DEFAULT_CURRENCY.code).transform((value) => value as CurrencyCode),
    payers: payersSchema,
    category: categorySchema.optional(),
    notes: z.string().optional(),
    receiptImageUrl: z.url().optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    splits: z.array(itemSplitSchema).min(1, 'At least one split is required'),
}).superRefine((data, ctx) => {
    const digits = CURRENCY_MAP.get(data.currency)?.digits || 2;
    const tolerance = 10 ** -digits;

    // Calculate total paid by all payers
    let totalPaid = 0;
    data.payers.forEach((payer, payerIndex) => {
        try {
            const amount = evaluate(payer.amountExpression);
            if (amount < 0) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Payment amount cannot be negative',
                    path: ['payers', payerIndex, 'amountExpression'],
                });
            }
            totalPaid += amount;
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: error instanceof Error ? error.message : 'Invalid payment expression',
                path: ['payers', payerIndex, 'amountExpression'],
            });
        }
    });

    // Validate items
    const itemAmountsMap = new Map<string, number>();
    data.items.forEach((item, itemIndex) => {
        try {
            const amount = evaluate(item.amountExpression);
            if (amount < 0) {
                ctx.addIssue({
                    code: 'custom',
                    message: 'Item amount cannot be negative',
                    path: ['items', itemIndex, 'amountExpression'],
                });
            }
            itemAmountsMap.set(item.id, amount);
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: error instanceof Error ? error.message : 'Invalid expression',
                path: ['items', itemIndex, 'amountExpression'],
            });
        }
    });

    // Validate splits
    data.splits.forEach((split, splitIndex) => {
        const { itemIds, shares } = split;

        // Validate all itemIds exist
        itemIds.forEach((itemId, itemIdIndex) => {
            if (!itemAmountsMap.has(itemId)) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Item with id ${itemId} does not exist`,
                    path: ['splits', splitIndex, 'itemIds', itemIdIndex],
                });
            }
        });

        // Calculate total amount for items in this split
        const splitTotalAmount = itemIds.reduce((sum, itemId) => {
            return sum + (itemAmountsMap.get(itemId) || 0);
        }, 0);

        // Evaluate shares
        const shareExpressions = shares.map(s => s.shareExpression);

        try {
            const evaluatedShares = evaluateShares(splitTotalAmount.toFixed(digits), shareExpressions);

            // Validate each share
            evaluatedShares.forEach((share, shareIndex) => {
                if (isNaN(share)) {
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Share expression resulted in invalid number',
                        path: ['splits', splitIndex, 'shares', shareIndex, 'shareExpression'],
                    });
                } else if (share < 0) {
                    ctx.addIssue({
                        code: 'custom',
                        message: 'Share cannot be negative',
                        path: ['splits', splitIndex, 'shares', shareIndex, 'shareExpression'],
                    });
                }
            });

            // Validate total shares equal split total
            const totalShares = evaluatedShares.reduce((sum, share) => sum + share, 0);
            if (Math.abs(totalShares - splitTotalAmount) > tolerance) {
                ctx.addIssue({
                    code: 'custom',
                    message: `Shares (${totalShares.toFixed(digits)}) must equal items total (${splitTotalAmount.toFixed(digits)})`,
                    path: ['splits', splitIndex, 'shares'],
                });
            }
        } catch (error) {
            ctx.addIssue({
                code: 'custom',
                message: error instanceof Error ? error.message : 'Invalid share expression',
                path: ['splits', splitIndex, 'shares'],
            });
        }
    });

    // Validate each item is in at least one split
    const itemsInSplits = new Set<string>();
    data.splits.forEach(split => {
        split.itemIds.forEach(itemId => itemsInSplits.add(itemId));
    });

    data.items.forEach((item, itemIndex) => {
        if (!itemsInSplits.has(item.id)) {
            ctx.addIssue({
                code: 'custom',
                message: `Item "${item.name}" must be included in at least one split`,
                path: ['items', itemIndex],
            });
        }
    });

    // Validate total items equal total paid
    const totalItemAmount = Array.from(itemAmountsMap.values()).reduce((sum, amt) => sum + amt, 0);
    if (Math.abs(totalPaid - totalItemAmount) > tolerance) {
        ctx.addIssue({
            code: 'custom',
            message: `Total paid (${totalPaid.toFixed(digits)}) must equal total items (${totalItemAmount.toFixed(digits)})`,
            path: ['payers'],
        });
    }
});

// Transform to backend format
export const transformedCreateExpenseSchema = createExpenseSchema.transform((data) => {
    const digits = CURRENCY_MAP.get(data.currency)?.digits || 2;

    // Calculate total paid
    const totalPaid = data.payers.reduce((sum, payer) => {
        try {
            return sum + evaluate(payer.amountExpression);
        } catch {
            return sum;
        }
    }, 0);

    // Build owes map for items-based split
    const owesMap = new Map<UserId, number>();

    // Calculate item amounts
    const itemAmountsMap = new Map<string, number>();
    data.items.forEach(item => {
        try {
            itemAmountsMap.set(item.id, evaluate(item.amountExpression));
        } catch {
            itemAmountsMap.set(item.id, 0);
        }
    });

    // Process each split
    data.splits.forEach(split => {
        const splitTotalAmount = split.itemIds.reduce((sum, itemId) => {
            return sum + (itemAmountsMap.get(itemId) || 0);
        }, 0);

        const shareExpressions = split.shares.map(s => s.shareExpression);
        const evaluatedShares = evaluateShares(splitTotalAmount.toFixed(digits), shareExpressions);

        split.shares.forEach((share, idx) => {
            const currentOwes = owesMap.get(share.userId) || 0;
            owesMap.set(share.userId, currentOwes + evaluatedShares[idx]);
        });
    });

    // Get all unique user IDs
    const userIds = new Set([
        ...data.payers.map(p => p.userId),
        ...owesMap.keys()
    ]);

    // Build splits output
    const outputSplits: z.infer<typeof insertExpenseInputSchema>['splits'] = [];

    userIds.forEach(userId => {
        const owes = owesMap.get(userId) || 0;
        const paid = data.payers.reduce((sum, payer) => {
            if (payer.userId === userId) {
                try {
                    return sum + evaluate(payer.amountExpression);
                } catch {
                    return sum;
                }
            }
            return sum;
        }, 0);

        outputSplits.push({
            userId,
            currency: data.currency,
            owesAmount: numberStringSchema.decode(owes.toFixed(digits)),
            paidAmount: numberStringSchema.decode(paid.toFixed(digits)),
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
        splits: outputSplits,
    };
});
