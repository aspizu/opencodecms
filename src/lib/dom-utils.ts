/** Build a CSS selector path from element to root, using IDs as anchors. */
export function getElementPath(element: Element): string {
    const parts: string[] = []
    let current: Element | null = element
    while (current && current !== current.ownerDocument.documentElement) {
        let selector = current.tagName.toLowerCase()
        if (current.id) {
            selector += `#${current.id}`
            parts.unshift(selector)
            break
        }
        const parent: Element | null = current.parentElement
        if (parent) {
            const siblings = Array.from(parent.children).filter(
                (c: Element) => c.tagName === current!.tagName,
            )
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1
                selector += `:nth-of-type(${index})`
            }
        }
        parts.unshift(selector)
        current = parent
    }
    return parts.join(" > ")
}
