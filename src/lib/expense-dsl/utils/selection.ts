export function insertStyledNode(html: string, plainText: string): void {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();

    // Create temporary container to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Insert all nodes
    const frag = document.createDocumentFragment();
    const nodes: Node[] = [];

    while (temp.firstChild) {
        const node = temp.firstChild;
        nodes.push(node);
        frag.appendChild(node);
    }

    // Add zero-width space after for cursor positioning
    const zwsp = document.createTextNode('\u200B');
    frag.appendChild(zwsp);
    nodes.push(zwsp);

    range.insertNode(frag);

    // Move cursor AFTER the zero-width space
    const newRange = document.createRange();
    newRange.setStartAfter(zwsp);
    newRange.setEndAfter(zwsp);

    selection.removeAllRanges();
    selection.addRange(newRange);
}

export function saveSelection(): { start: number; end: number } | null {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();

    const container = range.commonAncestorContainer;
    const rootElement = container.nodeType === Node.ELEMENT_NODE
        ? container
        : container.parentElement;

    if (!rootElement) return null;

    preSelectionRange.selectNodeContents(rootElement);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);

    const start = preSelectionRange.toString().length;
    return {
        start,
        end: start + range.toString().length
    };
}

export function restoreSelection(element: HTMLElement, savedSel: { start: number; end: number }): void {
    let charIndex = 0;
    const range = document.createRange();
    range.setStart(element, 0);
    range.collapse(true);

    const nodeStack: Node[] = [element];
    let node: Node | undefined;
    let foundStart = false;
    let stop = false;

    while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nextCharIndex = charIndex + (node.textContent?.length || 0);
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                stop = true;
            }
            charIndex = nextCharIndex;
        } else {
            let i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
}

export function getCaretPosition(element: HTMLElement): number {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);

    return preCaretRange.toString().length;
}

export function setCaretToEnd(element: HTMLElement): void {
    const range = document.createRange();
    const selection = window.getSelection();

    range.selectNodeContents(element);
    range.collapse(false); // Collapse to end

    selection?.removeAllRanges();
    selection?.addRange(range);
}
