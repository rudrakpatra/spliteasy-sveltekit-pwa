import z from "zod";

export type Email = `${string}@${string}.${string}`;
export const emailSchema = z.email().transform(val => val as Email);