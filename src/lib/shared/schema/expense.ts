import { z } from 'zod';
import { evaluate } from 'mathjs';
import { categorySchema } from '../category/category';
import { currencyCodeSchema } from '../currency/currency';
import { amountExpressionSchema } from './math';
import { CURRENCY_MAP, DEFAULT_CURRENCY, type CurrencyCode } from '../currency/currency-codes';

export const payerSchema = z.object({
    userId: z.string(),
    amountExpression: amountExpressionSchema.optional(),
});


export const itemSchema = z.object({
    id: z.string(),
    name: z.string(),
    amountExpression: amountExpressionSchema.optional(),
});

export const itemSplitSchema = z.object({
    id: z.string(),
    itemIds: z.array(z.string()).min(1, 'At least one item must be selected'),
    shares: z.array(z.object({
        userId: z.string(),
        shareExpression: amountExpressionSchema.optional(),
    })).min(1, 'At least one user must be selected'),
});


export const createExpenseProposalSchema = z.object({
    name: z.string().min(1, 'Expense name is required').max(100, 'Name is too long'),
    group_id: z.uuid('Group is required'),
    currency: currencyCodeSchema.default(DEFAULT_CURRENCY.code).transform(v => v as CurrencyCode),
    payers: z.array(payerSchema).min(1, 'At least one payer is required'),
    category: categorySchema.optional(),
    notes: z.string().optional(),
    receiptImageUrl: z.url().optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    splits: z.array(itemSplitSchema).min(1, 'At least one split is required'),
})
    .transform((data, ctx) => {
        const payerUserIds = data.payers.map(p => p.userId);
        const splitUserIds = data.splits.flatMap(s => s.shares.map(s => s.userId));
        const userIds = Array.from(new Set([...payerUserIds, ...splitUserIds]))

        const itemIds = new Set(data.items.map(i => i.id));

        const shareReferences = new Set(data.splits.flatMap(split => split.itemIds))

        // Validate splits itemIds exist in items
        for (const split of data.splits) {
            for (const itemId of split.itemIds) {
                if (!itemIds.has(itemId)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `Item ID ${itemId} in splits does not exist in items.`,
                        path: ['splits', 'itemIds'],
                    });
                }
            }
        }

        // Evaluate total amounts for payers and shares
        let totalPaid = 0;
        let totalOwed = 0;

        for (const payer of data.payers) {
            try {
                totalPaid += evaluate(payer.amountExpression || '0');
            } catch (e) {
                ctx.addIssue({
                    code: "custom",
                    message: `Invalid amount expression for payer ${payer.userId}: ${(e as Error).message}`,
                    path: ['payers', 'amountExpression'],
                });
            }
        }

        for (const item of data.items) {
            try {
                if (!shareReferences.has(item.id)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `Item ${item.id} is not referenced in any split`,
                        path: ['items', 'amountExpression'],
                    });
                }
                totalOwed += evaluate(item.amountExpression || '0');
            } catch (e) {
                ctx.addIssue({
                    code: "custom",
                    message: `Invalid amount expression for item ${item.id}: ${(e as Error).message}`,
                    path: ['items', 'amountExpression'],
                });
            }
        }

        const digits = CURRENCY_MAP.get(data.currency)?.digits ?? 2;

        // Check if total paid matches total owed
        if (Math.abs(totalPaid - totalOwed) > Math.pow(10, -digits)) {
            ctx.addIssue({
                code: "custom",
                message: `Total paid (${totalPaid}) does not equal total owed (${totalOwed}).`,
                path: ['payers', 'amountExpression'],
            });
        }


        function getOwesAmount(userId: string) {
            let owesAmount = 0;
            for (const split of data.splits) {
                const totalItems = split.itemIds.reduce((sum, item) => {
                    return sum + evaluate(data.items.find(i => i.id === item)!.amountExpression || '0');
                }, 0)
                const totalShare = split.shares.reduce((sum, share) => {
                    return sum + evaluate(share.shareExpression || '0');
                }, 0)
                for (const share of split.shares) {
                    if (share.userId === userId) {
                        owesAmount += evaluate(share.shareExpression || '0') * totalItems / totalShare;
                    }
                }
            }
            return owesAmount;
        }

        function getPaidAmount(userId: string) {
            let paidAmount = 0;
            for (const payer of data.payers) {
                if (payer.userId === userId) {
                    paidAmount += evaluate(payer.amountExpression || '0');
                }
            }
            return paidAmount;
        }

        return {
            name: data.name,
            group_id: data.group_id,
            is_payment: false,
            splits: userIds.map(userId => {
                return {
                    user_id: userId,
                    currency: data.currency,
                    owes_amount: getOwesAmount(userId).toFixed(digits),
                    paid_amount: getPaidAmount(userId).toFixed(digits),
                }
            }),
            metadata: {
                receiptImageUrl: data.receiptImageUrl || null,
                category: data.category || null,
                notes: data.notes || null,
            }
        };
    });


export const createOneTimeExpenseProposalSchema = z.object({
    currency: currencyCodeSchema.default(DEFAULT_CURRENCY.code).transform(v => v as CurrencyCode),
    payers: z.array(payerSchema.extend({ name: z.string().optional() })).min(1, 'At least one payer is required'),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
    splits: z.array(itemSplitSchema).min(1, 'At least one split is required'),
})
    .transform((data, ctx) => {
        const payerUserIds = data.payers.map(p => p.userId);
        const splitUserIds = data.splits.flatMap(s => s.shares.map(s => s.userId));
        const userIds = Array.from(new Set([...payerUserIds, ...splitUserIds]))

        const itemIds = new Set(data.items.map(i => i.id));

        const shareReferences = new Set(data.splits.flatMap(split => split.itemIds))

        // Validate splits itemIds exist in items
        for (const split of data.splits) {
            for (const itemId of split.itemIds) {
                if (!itemIds.has(itemId)) {
                    ctx.addIssue({
                        code: "custom",
                        message: `Item ID ${itemId} in splits does not exist in items.`,
                        path: ['splits', 'itemIds'],
                    });
                }
            }
        }

        // Evaluate total amounts for payers and shares
        let totalPaid = 0;
        let totalOwed = 0;

        for (const payer of data.payers) {
            const payerIsUnique = data.payers.filter(p => p.userId === payer.userId).length === 1;
            const payer_label = `${payerIsUnique ? payer.name : payer.name ? `${payer.name}(${payer.userId})` : payer.userId}`;
            try {
                totalPaid += evaluate(payer.amountExpression || '0');
            } catch (e) {
                ctx.addIssue({
                    code: "custom",
                    message: `Invalid amount expression for payer ${payer_label}: ${(e as Error).message}`,
                    path: ['payers', 'amountExpression'],
                });
            }
        }

        for (const item of data.items) {
            const itemNameIsUnique = data.items.filter(i => i.name === item.name).length === 1;
            const item_label = `${itemNameIsUnique ? item.name : item.name ? `${item.name}(${item.id})` : item.id}`;
            try {
                if (!shareReferences.has(item.id)) {

                    ctx.addIssue({
                        code: "custom",
                        message: `Item ${item_label} is not referenced in any split`,
                        path: ['items', 'amountExpression'],
                    });
                }
                totalOwed += evaluate(item.amountExpression || '0');
            } catch (e) {
                ctx.addIssue({
                    code: "custom",
                    message: `Invalid amount expression for item ${item_label}: ${(e as Error).message}`,
                    path: ['items', 'amountExpression'],
                });
            }
        }

        const digits = CURRENCY_MAP.get(data.currency)?.digits ?? 2;

        // Check if total paid matches total owed
        if (Math.abs(totalPaid - totalOwed) > Math.pow(10, -digits)) {
            ctx.addIssue({
                code: "custom",
                message: `Total paid (${totalPaid}) does not equal total owed (${totalOwed}).`,
                path: ['payers', 'amountExpression'],
            });
        }


        function getOwesAmount(userId: string) {
            let owesAmount = 0;
            for (const split of data.splits) {
                const totalItems = split.itemIds.reduce((sum, item) => {
                    return sum + evaluate(data.items.find(i => i.id === item)!.amountExpression || '0');
                }, 0)
                const totalShare = split.shares.reduce((sum, share) => {
                    return sum + evaluate(share.shareExpression || '0');
                }, 0)
                for (const share of split.shares) {
                    if (share.userId === userId) {
                        owesAmount += evaluate(share.shareExpression || '0') * totalItems / totalShare;
                    }
                }
            }
            return owesAmount;
        }

        function getPaidAmount(userId: string) {
            let paidAmount = 0;
            for (const payer of data.payers) {
                if (payer.userId === userId) {
                    paidAmount += evaluate(payer.amountExpression || '0');
                }
            }
            return paidAmount;
        }

        return {
            splits: userIds.map(userId => {
                return {
                    user_id: userId,
                    currency: data.currency,
                    owes_amount: getOwesAmount(userId).toFixed(digits),
                    paid_amount: getPaidAmount(userId).toFixed(digits),
                }
            })
        };
    });