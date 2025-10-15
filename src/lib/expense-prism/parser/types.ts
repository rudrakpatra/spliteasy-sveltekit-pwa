export interface ExpenseToken {
    type: 'member' | 'keyword' | 'expression' | 'operator' | 'item';
    value: string;
}

export interface ExpenseData {
    payer?: string;
    amount?: number;
    amountRaw?: string;
    item?: string;
    splitAmong?: string[];
    splitType?: 'evenly' | 'custom';
}

export interface ParticipantContext {
    members: string[];
}

export interface AutocompleteSuggestion {
    type: 'member' | 'keyword' | 'operator' | 'math';
    value: string;
    label: string;
    priority: number;
}
