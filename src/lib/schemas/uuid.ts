import z from "zod";

export type Uuid = `${string}-${string}-${string}-${string}-${string}`;
export const uuidSchema = z.string().regex(/^[0-9]+$/).transform(val => val as Uuid);
