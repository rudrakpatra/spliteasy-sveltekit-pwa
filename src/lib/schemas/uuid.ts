import z from "zod";

export type Uuid = `${string}-${string}-${string}-${string}-${string}`;
export const uuidSchema = z.uuid("Invalid UUID").transform(val => val as Uuid);
