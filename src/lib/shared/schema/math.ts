import { z } from "zod";
import { evaluate } from "mathjs/number";
export { evaluate as evaluateAmountExpression } from "mathjs/number";
export type NumberString = `${number}`;

export const numberStringSchema = z
    .string()
    .regex(/^-?\d+(\.\d+)?$/, {
        message: 'Must be a string representing a number',
    })
    .transform((value) => value as NumberString);

/**
 * Item amount expression schema - must evaluate to a number
 */
export const amountExpressionSchema = z
    .string()
    .refine((value) => {
        if (value == "") return true;
        try {
            const result = evaluate(value);
            return typeof result === 'number' && !isNaN(result);
        } catch {
            return false;
        }
    }, 'Invalid amount expression');

export type AmountExpression = z.infer<typeof amountExpressionSchema>;