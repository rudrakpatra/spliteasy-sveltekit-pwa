import type { Token, ExpenseAST } from './types';

export const examples = [
    {
        input: 'Alice paid 100+25%',
        tokens: [
            { type: 'member', value: 'Alice', raw: 'Alice', start: 0, end: 5 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 5, end: 6 },
            { type: 'keyword', value: 'paid', raw: 'paid', start: 6, end: 10 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 10, end: 11 },
            { type: 'expression', value: '125', raw: '100+25%', start: 11, end: 18 }
        ] as Token[],
        ast: {
            payer: 'Alice',
            amount: { base: 100, modifier: 0.25, raw: '100+25%' },
            raw: 'Alice paid 100+25%',
            tokens: [],
            isValid: true
        } as ExpenseAST
    },
    {
        input: 'David paid 50 for Burger. Split evenly among Alice and David',
        tokens: [
            { type: 'member', value: 'David', raw: 'David', start: 0, end: 5 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 5, end: 6 },
            { type: 'keyword', value: 'paid', raw: 'paid', start: 6, end: 10 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 10, end: 11 },
            { type: 'expression', value: '50', raw: '50', start: 11, end: 13 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 13, end: 14 },
            { type: 'operator', value: 'for', raw: 'for', start: 14, end: 17 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 17, end: 18 },
            { type: 'item', value: 'Burger', raw: 'Burger', start: 18, end: 24 },
            { type: 'whitespace', value: '. ', raw: '. ', start: 24, end: 26 },
            { type: 'keyword', value: 'Split evenly among', raw: 'Split evenly among', start: 26, end: 44 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 44, end: 45 },
            { type: 'member', value: 'Alice', raw: 'Alice', start: 45, end: 50 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 50, end: 51 },
            { type: 'operator', value: 'and', raw: 'and', start: 51, end: 54 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 54, end: 55 },
            { type: 'member', value: 'David', raw: 'David', start: 55, end: 60 }
        ] as Token[],
        ast: {
            payer: 'David',
            amount: { base: 50, raw: '50' },
            item: 'Burger',
            splitAmong: ['Alice', 'David'],
            splitType: 'evenly',
            raw: 'David paid 50 for Burger. Split evenly among Alice and David',
            tokens: [],
            isValid: true
        } as ExpenseAST
    },
    {
        input: 'Add 200 for Pizza',
        tokens: [
            { type: 'keyword', value: 'Add', raw: 'Add', start: 0, end: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 3, end: 4 },
            { type: 'expression', value: '200', raw: '200', start: 4, end: 7 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 7, end: 8 },
            { type: 'operator', value: 'for', raw: 'for', start: 8, end: 11 },
            { type: 'whitespace', value: ' ', raw: ' ', start: 11, end: 12 },
            { type: 'item', value: 'Pizza', raw: 'Pizza', start: 12, end: 17 }
        ] as Token[],
        ast: {
            amount: { base: 200, raw: '200' },
            item: 'Pizza',
            raw: 'Add 200 for Pizza',
            tokens: [],
            isValid: true
        } as ExpenseAST
    }
] as const;
