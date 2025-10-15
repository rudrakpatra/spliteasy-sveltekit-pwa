import type { ParticipantContext, AutocompleteItem, ExpenseAST } from '../parser/types';

export function getRankedSuggestions(
    ast: ExpenseAST | null,
    text: string,
    caretPosition: number,
    context: ParticipantContext,
    showMath: boolean
): AutocompleteItem[] {
    if (showMath) {
        return getMathOperators();
    }

    const beforeCaret = text.slice(0, caretPosition);
    const lastWord = beforeCaret.split(/\s+/).pop() || '';

    // Determine what tokens we expect based on parse state
    const expectedType = getExpectedTokenType(ast, text, caretPosition);

    const allSuggestions: AutocompleteItem[] = [
        ...getMemberSuggestions(context.members, lastWord, expectedType),
        ...getKeywordSuggestions(lastWord, expectedType),
        ...getOperatorSuggestions(expectedType)
    ];

    // Sort by priority (higher priority first)
    return allSuggestions
        .filter(s => s.priority > 0)
        .sort((a, b) => b.priority - a.priority);
}

function getExpectedTokenType(
    ast: ExpenseAST | null,
    text: string,
    caretPosition: number
): string {
    if (!ast || ast.tokens.length === 0) {
        return 'start'; // Expect member name or "Add"
    }

    const beforeCaret = text.slice(0, caretPosition).trim();
    const tokens = ast.tokens;
    const lastToken = tokens[tokens.length - 1];

    // After member name at start -> expect "paid"
    if (tokens.length === 1 && lastToken.type === 'member' && beforeCaret.endsWith(lastToken.value)) {
        return 'keyword-paid';
    }

    // After "Add" -> expect expression
    if (lastToken.type === 'keyword' && lastToken.value.toLowerCase() === 'add') {
        return 'expression';
    }

    // After "paid" -> expect expression
    if (lastToken.type === 'keyword' && lastToken.value.toLowerCase() === 'paid') {
        return 'expression';
    }

    // After expression -> expect "for" or "Split"
    if (lastToken.type === 'expression') {
        return 'operator-for-or-split';
    }

    // After "for" -> expect item name
    if (lastToken.type === 'operator' && lastToken.value.toLowerCase() === 'for') {
        return 'item';
    }

    // After item or expression without "for" -> expect "Split"
    if (lastToken.type === 'item' ||
        (lastToken.type === 'expression' && !tokens.some(t => t.type === 'operator' && t.value === 'for'))) {
        return 'keyword-split';
    }

    // After "Split" keywords -> expect member names
    if (lastToken.type === 'keyword' && lastToken.value.toLowerCase().includes('split')) {
        return 'member-list';
    }

    // After member in split list -> expect "and" or another member
    if (lastToken.type === 'member' && tokens.some(t => t.value.toLowerCase().includes('split'))) {
        return 'operator-and-or-member';
    }

    // After "and" in member list -> expect member
    if (lastToken.type === 'operator' && lastToken.value.toLowerCase() === 'and') {
        return 'member-list';
    }

    return 'unknown';
}

function getMemberSuggestions(
    members: string[],
    lastWord: string,
    expectedType: string
): AutocompleteItem[] {
    const filtered = members.filter(m =>
        m.toLowerCase().startsWith(lastWord.toLowerCase())
    );

    let priority = 50; // Default priority

    if (expectedType === 'start') {
        priority = 100; // High priority at start
    } else if (expectedType === 'member-list' || expectedType === 'operator-and-or-member') {
        priority = 90;
    } else if (expectedType.includes('keyword') || expectedType === 'expression') {
        priority = 10; // Low priority when expecting keywords/expressions
    }

    return filtered.map(member => ({
        type: 'member' as const,
        value: member + ' ',
        label: member,
        html: `<span class="dsl-member" data-member="${member.toLowerCase()}">${member}</span>`,
        priority
    }));
}

function getKeywordSuggestions(lastWord: string, expectedType: string): AutocompleteItem[] {
    const keywords = [
        { value: 'Add ', label: 'Add', expected: ['start'], priority: 95 },
        { value: 'paid ', label: 'paid', expected: ['keyword-paid'], priority: 100 },
        { value: 'for ', label: 'for', expected: ['operator-for-or-split'], priority: 100 },
        { value: 'Split ', label: 'Split', expected: ['keyword-split', 'operator-for-or-split'], priority: 95 },
        { value: 'evenly ', label: 'evenly', expected: ['keyword-split'], priority: 80 },
        { value: 'among ', label: 'among', expected: ['keyword-split'], priority: 80 }
    ];

    return keywords
        .filter(kw =>
            kw.label.toLowerCase().startsWith(lastWord.toLowerCase()) &&
            (kw.expected.includes(expectedType) || expectedType === 'unknown')
        )
        .map(kw => ({
            type: 'keyword' as const,
            value: kw.value,
            label: kw.label,
            html: `<span class="dsl-keyword">${kw.label}</span>`,
            priority: kw.expected.includes(expectedType) ? kw.priority : 20
        }));
}

function getOperatorSuggestions(expectedType: string): AutocompleteItem[] {
    if (expectedType === 'operator-and-or-member') {
        return [{
            type: 'operator' as const,
            value: 'and ',
            label: 'and',
            html: '<span class="dsl-operator">and</span>',
            priority: 85
        }];
    }

    return [];
}

function getMathOperators(): AutocompleteItem[] {
    return [
        { type: 'math' as const, value: '+', label: '+', priority: 100 },
        { type: 'math' as const, value: '-', label: '-', priority: 100 },
        { type: 'math' as const, value: '*', label: '×', priority: 100 },
        { type: 'math' as const, value: '/', label: '÷', priority: 100 },
        { type: 'math' as const, value: '%', label: '%', priority: 100 },
        { type: 'math' as const, value: '(', label: '(', priority: 90 },
        { type: 'math' as const, value: ')', label: ')', priority: 90 }
    ];
}

export function shouldShowMathOperators(text: string, caretPosition: number): boolean {
    const beforeCaret = text.slice(0, caretPosition);
    // Show math when cursor is after a number
    return /\d$/.test(beforeCaret.trim());
}
