import { CstParser, type IToken } from 'chevrotain';
import {
    allTokens,
    Identifier,
    Paid,
    Add,
    Expression,
    For,
    SplitEvenlyAmong,
    SplitAmong,
    And,
    tokenizeWithContext,
} from './lexer';
import type { ExpenseAST, ParticipantContext, Token } from './types';

class ExpenseParser extends CstParser {
    constructor() {
        super(allTokens, {
            nodeLocationTracking: 'full'
        });
        this.performSelfAnalysis();
    }

    // Main rule: expense statement
    public expenseStatement = this.RULE('expenseStatement', () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.paymentStatement) },
            { ALT: () => this.SUBRULE(this.addStatement) }
        ]);
        this.OPTION(() => this.SUBRULE(this.splitClause));
    });

    // Payment: "Alice paid 100"
    private paymentStatement = this.RULE('paymentStatement', () => {
        this.CONSUME(Identifier, { LABEL: 'payer' });
        this.CONSUME(Paid);
        this.CONSUME(Expression, { LABEL: 'amount' });
        this.OPTION(() => {
            this.CONSUME(For);
            this.CONSUME2(Identifier, { LABEL: 'item' });
        });
    });

    // Add: "Add 100 for Pizza"
    private addStatement = this.RULE('addStatement', () => {
        this.CONSUME(Add);
        this.CONSUME(Expression, { LABEL: 'amount' });
        this.OPTION(() => {
            this.CONSUME(For);
            this.CONSUME(Identifier, { LABEL: 'item' });
        });
    });

    // Split clause: "Split evenly among Alice and Bob"
    private splitClause = this.RULE('splitClause', () => {
        this.OR([
            { ALT: () => this.CONSUME(SplitEvenlyAmong) },
            { ALT: () => this.CONSUME(SplitAmong) }
        ]);
        this.SUBRULE(this.memberList);
    });

    // Member list: "Alice and Bob and Charlie"
    private memberList = this.RULE('memberList', () => {
        this.CONSUME(Identifier, { LABEL: 'member' });
        this.MANY(() => {
            this.OPTION(() => {
                this.CONSUME(And);
            });
            this.CONSUME2(Identifier, { LABEL: 'member' });
        });
    });
}

// Singleton parser instance
const parserInstance = new ExpenseParser();

// Get expected tokens at current position
export function getExpectedTokens(input: string, context: ParticipantContext) {
    const lexResult = tokenizeWithContext(input, context.members);

    if (lexResult.errors.length > 0) {
        // If there are lex errors, suggest starting tokens
        return [Identifier, Add];
    }

    parserInstance.input = lexResult.tokens;

    try {
        parserInstance.expenseStatement();
    } catch (e) {
        // Ignore parse errors
    }

    // Get expected tokens from parser state
    const expectedTokens = parserInstance.computeContentAssist('expenseStatement', lexResult.tokens);

    return expectedTokens;
}

// Rest of the code remains the same...
// (cstToAst, tokensToSimpleTokens, evaluateExpression, parseExpense functions)


// Visitor to convert CST to AST
function cstToAst(cst: any, tokens: IToken[], context: ParticipantContext): ExpenseAST {
    const ast: ExpenseAST = {
        raw: tokens.map((t) => t.image).join(''),
        tokens: tokensToSimpleTokens(tokens, context),
        isValid: true
    };

    // Extract payer
    if (cst.paymentStatement?.[0]?.children?.payer?.[0]) {
        const payerToken = cst.paymentStatement[0].children.payer[0];
        ast.payer = payerToken.image;
    }

    // Extract amount and evaluate expression
    const amountTokens =
        cst.paymentStatement?.[0]?.children?.amount ||
        cst.addStatement?.[0]?.children?.amount;

    if (amountTokens?.[0]) {
        const amountToken = amountTokens[0];
        const raw = amountToken.image;
        ast.amount = {
            base: evaluateExpression(raw),
            raw
        };

        // Check for percentage modifier
        if (raw.includes('%')) {
            const match = raw.match(/(\d+(?:\.\d+)?)[+\-*\/](\d+(?:\.\d+)?)%/);
            if (match) {
                ast.amount.modifier = parseFloat(match[2]) / 100;
            }
        }
    }

    // Extract item name
    const itemTokens =
        cst.paymentStatement?.[0]?.children?.item ||
        cst.addStatement?.[0]?.children?.item;

    if (itemTokens?.[0]) {
        ast.item = itemTokens[0].image;
    }

    // Extract split type and members
    const splitClause = cst.splitClause?.[0];
    if (splitClause) {
        const hasSplitEvenlyAmong = splitClause.children.SplitEvenlyAmong?.length > 0;
        ast.splitType = hasSplitEvenlyAmong ? 'evenly' : 'custom';

        const memberTokens = splitClause.children.memberList?.[0]?.children?.member || [];
        ast.splitAmong = memberTokens.map((t: IToken) => t.image);
    }

    return ast;
}

// Convert Chevrotain tokens to simple Token type
function tokensToSimpleTokens(tokens: IToken[], context: ParticipantContext): Token[] {
    return tokens
        .filter((token) => token.tokenType.name !== 'WhiteSpace') // Filter out whitespace
        .map((token) => {
            let type: Token['type'] = 'whitespace';

            // Determine token type
            if (context.members.some((m) => m.toLowerCase() === token.image.toLowerCase())) {
                type = 'member';
            } else if (
                ['Paid', 'Add', 'Split', 'Evenly', 'Among', 'SplitEvenlyAmong', 'SplitAmong'].includes(
                    token.tokenType.name
                )
            ) {
                type = 'keyword';
            } else if (token.tokenType.name === 'Expression') {
                type = 'expression';
            } else if (['For', 'And'].includes(token.tokenType.name)) {
                type = 'operator';
            } else if (token.tokenType.name === 'Identifier') {
                type = 'item';
            }

            return {
                type,
                value: token.image,
                raw: token.image,
                start: token.startOffset || 0,
                end: (token.endOffset || 0) + 1,
                metadata: context.members.some((m) => m.toLowerCase() === token.image.toLowerCase())
                    ? { memberId: token.image.toLowerCase() }
                    : undefined
            };
        });
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
                    case '+':
                        return base + base * percent;
                    case '-':
                        return base - base * percent;
                    case '*':
                        return base * percent;
                    case '/':
                        return base / percent;
                }
            }
        }

        // Evaluate basic math expression safely
        const sanitized = expr.replace(/[^0-9+\-*\/().]/g, '');
        return Function(`"use strict"; return (${sanitized})`)();
    } catch {
        return parseFloat(expr) || 0;
    }
}

export function parseExpense(input: string, context: ParticipantContext): ExpenseAST {
    const lexResult = tokenizeWithContext(input, context.members);

    if (lexResult.errors.length > 0) {
        return {
            raw: input,
            tokens: [],
            isValid: false,
            errors: lexResult.errors.map((e) => e.message)
        };
    }

    parserInstance.input = lexResult.tokens;
    const cst = parserInstance.expenseStatement();

    if (parserInstance.errors.length > 0) {
        return {
            raw: input,
            tokens: tokensToSimpleTokens(lexResult.tokens, context),
            isValid: false,
            errors: parserInstance.errors.map((e) => e.message)
        };
    }

    return cstToAst(cst, lexResult.tokens, context);
}

export { tokenizeWithContext as lexExpense };
