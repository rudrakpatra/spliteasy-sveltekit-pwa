import type { Token } from '../parser/types';

export function tokenToHtml(token: Token): string {
    switch (token.type) {
        case 'member':
            return `<span class="dsl-member" data-member="${token.metadata?.memberId || token.value}">${token.raw}</span>`;
        case 'keyword':
            return `<span class="dsl-keyword">${token.raw}</span>`;
        case 'expression':
            return `<span class="dsl-expression" data-value="${token.value}">${token.raw}</span>`;
        case 'operator':
            return `<span class="dsl-operator">${token.raw}</span>`;
        case 'item':
            return `<span class="dsl-item">${token.raw}</span>`;
        case 'whitespace':
            return token.raw;
        default:
            return token.raw;
    }
}

export function renderTokens(tokens: Token[]): string {
    console.log(tokens.map(t => t.type));
    return tokens.map(tokenToHtml).join('');
}

export function stripHtmlToPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || '';
}
