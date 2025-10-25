import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GOOGLE_GENERATIVE_AI_API_KEY } from '$env/static/private';
import { z } from 'zod';
import type { RequestHandler } from './$types';

// Create Google provider instance with explicit API key
const google = createGoogleGenerativeAI({
    apiKey: GOOGLE_GENERATIVE_AI_API_KEY
});

const receiptAnalysisSchema = z.object({
    name: z.string().describe('The name/description of the expense'),
    currency: z.string().describe('Currency code (e.g., INR, USD)').default('INR'),
    category: z.string().describe('Expense category like Transport, Food, etc.').optional(),
    notes: z.string().describe('Additional notes about the expense').optional(),
    items: z.array(z.object({
        name: z.string().describe('Item name'),
        amountExpression: z.string().describe('Amount as a string expression')
    })).min(1, 'At least one item required'),
    suggestedSplits: z.array(z.object({
        itemNames: z.array(z.string()),
        shareExpression: z.string().describe('Equal share expression like "1"')
    })).optional()
});

export const POST: RequestHandler = async ({ request }) => {
    console.log('Receipt analysis request received');
    try {
        const { imageUrl, prompt } = await request.json();

        const { object } = await generateObject({
            model: google('gemini-2.5-flash'), // Now uses the configured instance
            schema: receiptAnalysisSchema,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: prompt || 'Analyze this receipt and extract expense details including items and amounts. For currency, use INR for Indian receipts.'
                        },
                        {
                            type: 'image',
                            image: imageUrl
                        }
                    ]
                }
            ]
        });

        return new Response(JSON.stringify({ success: true, data: object }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Receipt analysis error:', error);
        return new Response(
            JSON.stringify({ success: false, error: 'Failed to analyze receipt' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
