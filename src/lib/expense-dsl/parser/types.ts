export interface Token {
    type: 'member' | 'keyword' | 'expression' | 'operator' | 'item' | 'whitespace';
    value: string;
    raw: string;
    start: number;
    end: number;
    metadata?: Record<string, unknown>;
}

export interface ParticipantContext {
    members: string[];
}

export interface ExpenseAST {
    payer?: string;
    amount?: {
        base: number;
        modifier?: number;
        raw: string;
    };
    item?: string;
    splitAmong?: string[];
    splitType?: 'evenly' | 'custom';
    raw: string;
    tokens: Token[];
    isValid: boolean;
    errors?: string[];
}

export type AutocompleteItem = {
    type: 'member' | 'keyword' | 'operator' | 'expression' | 'math';
    value: string;
    label: string;
    html?: string;
    priority: number; // NEW: For ranking suggestions
};

export type ExpectedTokenType =
    | 'start'
    | 'member'
    | 'keyword-paid'
    | 'keyword-add'
    | 'expression'
    | 'operator-for'
    | 'item'
    | 'keyword-split'
    | 'member-list'
    | 'operator-and';
