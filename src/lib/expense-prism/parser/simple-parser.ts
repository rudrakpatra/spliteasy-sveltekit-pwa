import type { ExpenseData, ExpenseToken, ParticipantContext } from './types';

// Simple regex-based parser (no heavy dependencies)
export function parseExpense(text: string, context: ParticipantContext): ExpenseData {
    const data: ExpenseData = {};
    
    // Extract payer: "Alice paid..."
    const payerMatch = text.match(/^(\w+)\s+paid\s+/i);
    if (payerMatch) {
        data.payer = payerMatch[1];
    }
    
    // Extract amount: numbers with optional math
    const amountMatch = text.match(/\b(\d+(?:\.\d+)?(?:[+\-*\/]\d+(?:\.\d+)?)?%?)\b/);
    if (amountMatch) {
        data.amountRaw = amountMatch[1];
        data.amount = evaluateExpression(amountMatch[1]);
    }
    
    // Extract item: "for Pizza"
    const itemMatch = text.match(/for\s+(\w+)/i);
    if (itemMatch) {
        data.item = itemMatch[1];
    }
    
    // Extract split type and members
    const splitMatch = text.match(/split\s+(evenly\s+)?among\s+(.*)/i);
    if (splitMatch) {
        data.splitType = splitMatch[1] ? 'evenly' : 'custom';
        
        // Extract member names from the split clause
        const memberText = splitMatch[2];
        const memberNames = memberText
            .split(/\s+and\s+/i)
            .map(m => m.trim())
            .filter(m => context.members.includes(m));
        
        data.splitAmong = memberNames;
    }
    
    return data;
}

function evaluateExpression(expr: string): number {
    try {
        // Handle percentage
        if (expr.includes('%')) {
            const match = expr.match(/^(\d+(?:\.\d+)?)([+\-*\/])(\d+(?:\.\d+)?)%$/);
            if (match) {
                const base = parseFloat(match[1]);
                const operator = match[2];
                const percent = parseFloat(match[3]) / 100;

                switch (operator) {
                    case '+': return base + base * percent;
                    case '-': return base - base * percent;
                    case '*': return base * percent;
                    case '/': return base / percent;
                }
            }
        }

        // Evaluate basic math expression
        const sanitized = expr.replace(/[^0-9+\-*\/().]/g, '');
        return Function(`"use strict"; return (${sanitized})`)();
    } catch {
        return parseFloat(expr) || 0;
    }
}

// Get expected token type based on what's been typed
export function getExpectedType(text: string): string {
    if (!text.trim()) return 'start';
    
    if (/^\w+$/.test(text.trim())) return 'keyword-paid';
    if (/paid\s*$/i.test(text)) return 'expression';
    if (/add\s*$/i.test(text)) return 'expression';
    if (/\d+\s*$/i.test(text)) return 'operator-for';
    if (/for\s*$/i.test(text)) return 'item';
    if (/\w+\s*$/i.test(text) && /for\s+\w+/i.test(text)) return 'keyword-split';
    if (/split\s+(?:evenly\s+)?among\s*$/i.test(text)) return 'member-list';
    if (/among\s+\w+\s*$/i.test(text)) return 'operator-and';
    
    return 'unknown';
}
