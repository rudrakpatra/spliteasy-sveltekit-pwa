import Prism from 'prismjs';

// Define custom Expense DSL language for PrismJS
Prism.languages.expense = {
    // Keywords must come before identifiers
    'keyword': {
        pattern: /\b(?:paid|Add|Split|evenly|among)\b/i,
        greedy: true
    },
    
    // Operators
    'operator': {
        pattern: /\b(?:for|and)\b/i,
        greedy: true
    },
    
    // Expressions (numbers with math operators and percentages)
    'number': {
        pattern: /\b\d+(?:\.\d+)?(?:[+\-*\/]\d+(?:\.\d+)?)?%?\b/,
        greedy: true
    },
    
    // Member names (must be registered dynamically)
    'member': {
        pattern: /\b[A-Z][a-z]+\b/,
        greedy: true
    },
    
    // Item names (anything else that looks like a word)
    'string': {
        pattern: /\b[a-z][a-z0-9_]*\b/i,
        greedy: true
    },
    
    // Punctuation
    'punctuation': /[.,]/
};

// Helper to register member names dynamically
export function registerMembers(members: string[]) {
    // Create a pattern that matches any of the member names
    const memberPattern = new RegExp(`\\b(?:${members.join('|')})\\b`, 'i');
    
    Prism.languages.expense['member'] = {
        pattern: memberPattern,
        greedy: true
    };
}

export default Prism;
