// trpc/routers/receipt.ts
import { z } from 'zod';
import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GOOGLE_GENERATIVE_AI_API_KEY } from '$env/static/private';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, publicProcedure, t } from '../init';
import { categorySchema } from '$lib/shared/category/category';
import { currencyCodeSchema } from '$lib/shared/currency/currency';

// Create Google provider instance with explicit API key
const google = createGoogleGenerativeAI({
    apiKey: GOOGLE_GENERATIVE_AI_API_KEY
});

const receiptAnalysisSchema = z.object({
    name: z.string().describe('The short name for the expense'),
    currencyCode: currencyCodeSchema,
    categoryCode: categorySchema.optional(),
    notes: z.string().describe('Additional notes about the expense').optional(),
    items: z
        .array(
            z.object({
                name: z.string().describe('Item name').min(1, 'Item name is required'),
                amount: z.string().describe('Amount as a string expression unit prefer price * quantity + tax - discount')
            })
        )
        .min(1, 'At least one item required'),
    splits: z
        .array(
            z.object({
                itemNames: z.array(z.string()).describe('List of item names, the item total is to be split between these users'),
                shares: z.array(z.object({
                    userId: z.string().describe('User ID'),
                    amount: z.string().describe('Share expression').default('1')
                })).describe('List of shares, the share expression is to be evaluated for each user')
            })
        ).describe('List of suggested splits')
});

export const aiRouter = t.router({
    // Analyze receipt from image
    analyze: publicProcedure
        .input(
            z.object({
                imageUrl: z.url('Must be a valid image URL'),
                prompt: z
                    .string()
                    .optional()
                    .default(
                        'Analyze this receipt & extract all items with amounts.'
                    )
            })
        )
        .mutation(async ({ input, ctx }) => {
            try {
                const { object } = await generateObject({
                    model: google('gemini-2.5-flash'),
                    schema: receiptAnalysisSchema,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: input.prompt
                                },
                                {
                                    type: 'image',
                                    image: input.imageUrl
                                }
                            ]
                        }
                    ]
                });

                return {
                    success: true,
                    data: object
                };
            } catch (error) {
                console.error('Receipt analysis error:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to analyze receipt',
                    cause: error
                });
            }
        })
});
