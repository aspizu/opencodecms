/**
 * Simple unified diff generator for HTML before/after comparison.
 * Used to create diffs from contentEditable changes in the inspector.
 */

/** Format HTML with basic indentation so diffs are line-level meaningful. */
export function formatHTML(html: string): string {
    // Normalize whitespace between tags
    let formatted = html.replace(/>\s+</g, ">\n<")
    // Put each opening/closing tag on its own line
    formatted = formatted.replace(/(<\/?[^>]+>)/g, "\n$1\n")
    // Clean up multiple newlines and trim
    const lines = formatted
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

    // Simple indentation
    const result: string[] = []
    let indent = 0
    for (const line of lines) {
        const isClosing = /^<\//.test(line)
        const isSelfClosing =
            /\/>$/.test(line) || /^<(br|hr|img|input|meta|link)\b/i.test(line)

        if (isClosing) indent = Math.max(0, indent - 1)
        result.push("  ".repeat(indent) + line)
        if (
            !isClosing &&
            !isSelfClosing &&
            /^<[a-zA-Z]/.test(line) &&
            !line.includes("</")
        ) {
            indent++
        }
    }
    return result.join("\n")
}

/** Compute the longest common subsequence table for two string arrays. */
function lcsTable(a: string[], b: string[]): number[][] {
    const m = a.length
    const n = b.length
    const dp: number[][] = Array.from({length: m + 1}, () => Array(n + 1).fill(0))
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
            }
        }
    }
    return dp
}

/** Generate a unified diff string from before/after text. */
export function createUnifiedDiff(before: string, after: string): string {
    const beforeLines = before.split("\n")
    const afterLines = after.split("\n")
    const dp = lcsTable(beforeLines, afterLines)

    const diff: string[] = []
    let i = beforeLines.length
    let j = afterLines.length

    // Backtrack through LCS table to build diff
    const ops: Array<{type: "keep" | "remove" | "add"; line: string}> = []
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && beforeLines[i - 1] === afterLines[j - 1]) {
            ops.unshift({type: "keep", line: beforeLines[i - 1]})
            i--
            j--
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            ops.unshift({type: "add", line: afterLines[j - 1]})
            j--
        } else {
            ops.unshift({type: "remove", line: beforeLines[i - 1]})
            i--
        }
    }

    for (const op of ops) {
        switch (op.type) {
            case "keep":
                diff.push(` ${op.line}`)
                break
            case "remove":
                diff.push(`-${op.line}`)
                break
            case "add":
                diff.push(`+${op.line}`)
                break
        }
    }

    return diff.join("\n")
}

/** Build the full diff prompt for the AI from before/after outerHTML. */
export function buildEditDiffPrompt(
    beforeHTML: string,
    afterHTML: string,
    elementPath: string,
    currentUrl: string,
): string {
    const formattedBefore = formatHTML(beforeHTML)
    const formattedAfter = formatHTML(afterHTML)
    const diff = createUnifiedDiff(formattedBefore, formattedAfter)

    return [
        `I made a visual edit to an element on the page. Find the source file that renders this element and apply the same change to the source code.`,
        ``,
        `Current URL: ${currentUrl}`,
        `Element path: ${elementPath}`,
        ``,
        `Diff of the change:`,
        "```diff",
        diff,
        "```",
        ``,
        `Original HTML:`,
        "```html",
        formattedBefore,
        "```",
        ``,
        `Modified HTML:`,
        "```html",
        formattedAfter,
        "```",
    ].join("\n")
}
