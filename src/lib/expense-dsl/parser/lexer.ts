import { createToken, Lexer, type TokenType as ChevrotainTokenType } from 'chevrotain';
import type { IToken } from 'chevrotain';

// Export TokenType for use in parser
export type TokenType = ChevrotainTokenType;

// Define all tokens
export const WhiteSpace = createToken({
    name: 'WhiteSpace',
    pattern: /\s+/,
    group: Lexer.SKIPPED
});

// Keywords (order matters - longer patterns first)
export const SplitEvenlyAmong = createToken({
    name: 'SplitEvenlyAmong',
    pattern: /split\s+evenly\s+among/i
});

export const SplitAmong = createToken({
    name: 'SplitAmong',
    pattern: /split\s+among/i
});

export const Paid = createToken({
    name: 'Paid',
    pattern: /paid/i
});

export const Add = createToken({
    name: 'Add',
    pattern: /add/i
});

export const Split = createToken({
    name: 'Split',
    pattern: /split/i
});

export const Evenly = createToken({
    name: 'Evenly',
    pattern: /evenly/i
});

export const Among = createToken({
    name: 'Among',
    pattern: /among/i
});

export const For = createToken({
    name: 'For',
    pattern: /for/i
});

export const And = createToken({
    name: 'And',
    pattern: /and/i
});

// Expression - numbers with operators and percentage
export const Expression = createToken({
    name: 'Expression',
    pattern: /\d+(?:\.\d+)?(?:[+\-*\/]\d+(?:\.\d+)?)?%?/
});

// Math operators
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Multiply = createToken({ name: 'Multiply', pattern: /\*/ });
export const Divide = createToken({ name: 'Divide', pattern: /\// });
export const Percent = createToken({ name: 'Percent', pattern: /%/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });

// Punctuation
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Period = createToken({ name: 'Period', pattern: /\./ });

// Identifier - member names or item names (anything else)
export const Identifier = createToken({
    name: 'Identifier',
    pattern: /[a-zA-Z][a-zA-Z0-9_]*/
});

// All tokens in order of priority
export const allTokens = [
    WhiteSpace,
    // Multi-word keywords first
    SplitEvenlyAmong,
    SplitAmong,
    // Single-word keywords
    Paid,
    Add,
    Split,
    Evenly,
    Among,
    For,
    And,
    // Expressions and operators
    Expression,
    Plus,
    Minus,
    Multiply,
    Divide,
    Percent,
    LParen,
    RParen,
    // Punctuation
    Comma,
    Period,
    // Identifier last (catches everything else)
    Identifier
];

export const ExpenseLexer = new Lexer(allTokens);

// Helper to tokenize with member context
export function tokenizeWithContext(
    input: string,
    memberNames: string[]
): { tokens: IToken[]; errors: any[] } {
    // Create dynamic member tokens
    const memberTokens = memberNames.map((name) =>
        createToken({
            name: `Member_${name}`,
            pattern: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'),
            longer_alt: Identifier
        })
    );

    // Create lexer with member tokens inserted before other keywords
    const contextualTokens = [
        WhiteSpace,
        SplitEvenlyAmong,
        SplitAmong,
        ...memberTokens, // Members before keywords to prioritize them
        Paid,
        Add,
        Split,
        Evenly,
        Among,
        For,
        And,
        Expression,
        Plus,
        Minus,
        Multiply,
        Divide,
        Percent,
        LParen,
        RParen,
        Comma,
        Period,
        Identifier
    ];

    const contextualLexer = new Lexer(contextualTokens);
    return contextualLexer.tokenize(input);
}
