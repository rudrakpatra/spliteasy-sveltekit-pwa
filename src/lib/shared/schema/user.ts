import z from "zod";

export type UserId = `${number}`;
export const userIdSchema = z.string().regex(/^[0-9]+$/).transform(val => val as UserId);