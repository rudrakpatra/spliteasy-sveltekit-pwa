import { z } from "zod";

export type DecimalString = `${number}`;
export const decimalStringSchema = z.string().regex(/^-?\d+(\.\d+)?$/, {
    message: 'Must be a string representing a number',
}).transform((value) => value as DecimalString);