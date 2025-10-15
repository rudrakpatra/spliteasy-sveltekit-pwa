import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css'; // Or your preferred theme
import { registerMembers } from '$lib/expense-prism/language/expense-lang';
import type { ParticipantContext } from '$lib/expense-prism/parser/types';

export function highlightExpense(
    code: string,
    context: ParticipantContext
): string {
    // Register members before highlighting
    registerMembers(context.members);
    
    // Highlight the code
    return Prism.highlight(code, Prism.languages.expense, 'expense');
}

export function applyHighlighting(
    element: HTMLElement,
    context: ParticipantContext
) {
    const code = element.textContent || '';
    const highlighted = highlightExpense(code, context);
    element.innerHTML = highlighted;
}
