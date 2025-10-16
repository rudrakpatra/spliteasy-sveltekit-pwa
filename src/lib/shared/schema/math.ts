import { z } from "zod";
import { derivative, evaluate, simplify } from "mathjs/number";
export { evaluate } from "mathjs/number";
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
        try {
            const result = evaluate(value);
            return typeof result === 'number' && !isNaN(result);
        } catch {
            return false;
        }
    }, 'Invalid amount expression');

/**
 * Share expression schema - must evaluate to a number (with optional variable x)
 */
export const shareExpressionSchema = z
    .string()
    .refine((value) => {
        try {
            const result = evaluate(value, { x: 1 });
            return typeof result === 'number' && !isNaN(result);
        } catch {
            return false;
        }
    }, 'Invalid share expression');

export type ItemAmountExpressionSchema = z.infer<typeof amountExpressionSchema>;
export type ShareExpressionSchema = z.infer<typeof shareExpressionSchema>;

/**
 * Evaluates share expressions and solves for variable x if present
 * @param itemExpression - Expression for total item amount
 * @param shareExpressions - Array of share expressions (may contain variable x)
 * @returns Array of evaluated share values
 */
export const evaluateShares = (
    itemExpression: string,
    shareExpressions: string[]
): number[] => {
    // Step 1: Evaluate total item amount
    const totalValue = evaluate(itemExpression);

    if (typeof totalValue !== 'number' || isNaN(totalValue)) {
        throw new Error('Item expression must evaluate to a valid number');
    }

    // Step 2: Parse shares and identify variable expressions
    const shares: number[] = [];
    let totalFixedShares = 0;
    const variableIndices: number[] = [];

    shareExpressions.forEach((expr, index) => {
        const simplified = simplify(expr).toString();

        if (simplified.includes('x')) {
            variableIndices.push(index);
            shares.push(NaN); // Placeholder
        } else {
            const value = evaluate(simplified);
            if (typeof value !== 'number' || isNaN(value)) {
                throw new Error(`Invalid share expression at index ${index}`);
            }
            shares.push(value);
            totalFixedShares += value;
        }
    });

    // Step 3: Solve for x if variables exist
    if (variableIndices.length > 0) {
        const remainingValue = totalValue - totalFixedShares;

        // Combine all variable expressions
        const xExpression = variableIndices
            .map((index) => `(${shareExpressions[index]})`)
            .join(' + ');

        // Solve: xExpression = remainingValue
        const equation = `${xExpression} - ${remainingValue}`;
        const simplified = simplify(equation);

        // Extract coefficient and constant
        const coefficient = evaluate(derivative(simplified, 'x').toString());

        if (typeof coefficient !== 'number' || Math.abs(coefficient) < 1e-10) {
            throw new Error('Cannot solve for x: invalid or zero coefficient');
        }

        const constant = evaluate(simplified.toString(), { x: 0 });
        const xValue = -constant / coefficient;

        // Evaluate variable shares with computed x value
        variableIndices.forEach((index) => {
            shares[index] = evaluate(shareExpressions[index], { x: xValue });
        });
    }

    return shares;
};