import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought"
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState,
    ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
    Message,
    MessageContent,
    MessageResponse,
} from "@/components/ai-elements/message"
import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {useSortedMessages} from "@/stores/opencode-session-store"
import type {
    AssistantMessage,
    Part,
    ReasoningPart,
    TextPart,
    ToolPart,
} from "@opencode-ai/sdk"
import type {LucideIcon} from "lucide-react"
import {
    AlertCircleIcon,
    CheckCircle2Icon,
    FileIcon,
    GlobeIcon,
    SearchIcon,
    SquareTerminalIcon,
    WrenchIcon,
} from "lucide-react"

// ── Tool icon/label mapping ──────────────────────────────────────────

const TOOL_META: Record<string, {icon: LucideIcon; label: string}> = {
    read: {icon: FileIcon, label: "Read file"},
    list: {icon: SearchIcon, label: "List directory"},
    glob: {icon: SearchIcon, label: "Glob search"},
    grep: {icon: SearchIcon, label: "Regex search"},
    webfetch: {icon: GlobeIcon, label: "Fetch webpage"},
    bash: {icon: SquareTerminalIcon, label: "Shell command"},
    edit: {icon: FileIcon, label: "Edit file"},
    write: {icon: FileIcon, label: "Write file"},
    apply_patch: {icon: FileIcon, label: "Apply patch"},
    todowrite: {icon: CheckCircle2Icon, label: "Write todos"},
    todoread: {icon: CheckCircle2Icon, label: "Read todos"},
}

function getToolMeta(tool: string) {
    return (
        TOOL_META[tool] ?? {
            icon: WrenchIcon,
            label: tool,
        }
    )
}

// ── Tool status mapping ──────────────────────────────────────────────

function mapToolStatus(status: string): "complete" | "active" | "pending" {
    switch (status) {
        case "completed":
        case "error":
            return "complete"
        case "running":
            return "active"
        default:
            return "pending"
    }
}

function getToolTitle(part: ToolPart): string {
    const meta = getToolMeta(part.tool)
    if (part.state.status === "completed" || part.state.status === "running") {
        return part.state.title ?? meta.label
    }
    return meta.label
}

// ── Tool chain-of-thought group ──────────────────────────────────────

function ToolChainOfThought({toolParts}: {toolParts: ToolPart[]}) {
    const hasActive = toolParts.some((p) => p.state.status === "running")

    return (
        <ChainOfThought defaultOpen={hasActive}>
            <ChainOfThoughtHeader />
            <ChainOfThoughtContent>
                {toolParts.map((part) => {
                    const meta = getToolMeta(part.tool)
                    const title = getToolTitle(part)

                    return (
                        <ChainOfThoughtStep
                            key={part.id}
                            icon={meta.icon}
                            label={title}
                            status={mapToolStatus(part.state.status)}
                        >
                            {part.state.status === "error" && (
                                <div className="text-destructive text-xs">
                                    {part.state.error}
                                </div>
                            )}
                            {part.state.status === "completed" &&
                                !!part.state.output && (
                                    <pre className="bg-muted/50 max-h-48 overflow-auto rounded-md p-2 text-xs whitespace-pre-wrap">
                                        {part.state.output}
                                    </pre>
                                )}
                        </ChainOfThoughtStep>
                    )
                })}
            </ChainOfThoughtContent>
        </ChainOfThought>
    )
}

// ── Error display ────────────────────────────────────────────────────

function MessageError({message}: {message: AssistantMessage}) {
    if (!message.error) return null

    const errorName = message.error.name
    const errorData = message.error.data as Record<string, unknown>
    const errorMessage =
        typeof errorData.message === "string" ? errorData.message : errorName

    return (
        <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-md px-3 py-2 text-sm">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">
                <p className="font-medium">{errorName}</p>
                <p className="text-destructive/80 text-xs">{errorMessage}</p>
            </div>
        </div>
    )
}

// ── Part renderer dispatcher ─────────────────────────────────────────

function PartDisplay({part, isStreaming}: {part: Part; isStreaming: boolean}) {
    switch (part.type) {
        case "text": {
            const textPart = part as TextPart
            if (!textPart.text.trim()) return null
            return <MessageResponse>{textPart.text}</MessageResponse>
        }

        case "reasoning": {
            const reasoningPart = part as ReasoningPart
            if (!reasoningPart.text.trim()) return null
            const hasEnded = !!reasoningPart.time.end
            const reasoningIsStreaming = isStreaming && !hasEnded
            const duration =
                hasEnded ?
                    Math.ceil(
                        (reasoningPart.time.end! - reasoningPart.time.start) / 1000,
                    )
                :   undefined
            return (
                <Reasoning isStreaming={reasoningIsStreaming} duration={duration}>
                    <ReasoningTrigger />
                    <ReasoningContent>{reasoningPart.text}</ReasoningContent>
                </Reasoning>
            )
        }

        // tool parts are grouped and rendered separately
        case "tool":
        case "step-finish":
            return null

        // step-start, snapshot, patch, agent, retry, compaction, subtask, file
        // are metadata — skip rendering for now
        default:
            return null
    }
}

// ── Assistant message block ──────────────────────────────────────────

/**
 * Groups parts into runs of consecutive tool parts and non-tool parts,
 * so tool parts can be wrapped in a single ChainOfThought component.
 */
function groupParts(parts: Part[]) {
    const groups: Array<
        {type: "tool"; parts: ToolPart[]} | {type: "other"; parts: Part[]}
    > = []

    for (const part of parts) {
        if (part.type === "tool") {
            const last = groups[groups.length - 1]
            if (last?.type === "tool") {
                last.parts.push(part as ToolPart)
            } else {
                groups.push({type: "tool", parts: [part as ToolPart]})
            }
        } else {
            const last = groups[groups.length - 1]
            if (last?.type === "other") {
                last.parts.push(part)
            } else {
                groups.push({type: "other", parts: [part]})
            }
        }
    }

    return groups
}

function AssistantMessageDisplay({
    info,
    parts,
}: {
    info: AssistantMessage
    parts: Part[]
}) {
    const isStreaming = !info.time.completed
    const groups = groupParts(parts)

    return (
        <Message from="assistant">
            <MessageContent>
                {groups.map((group) =>
                    group.type === "tool" ?
                        <ToolChainOfThought
                            key={group.parts[0].id}
                            toolParts={group.parts}
                        />
                    :   group.parts.map((part) => (
                            <PartDisplay
                                key={part.id}
                                part={part}
                                isStreaming={isStreaming}
                            />
                        )),
                )}
                <MessageError message={info} />
            </MessageContent>
        </Message>
    )
}

// ── User message block ───────────────────────────────────────────────

function UserMessageDisplay({parts}: {parts: Part[]}) {
    const textParts = parts.filter((p): p is TextPart => p.type === "text")
    const text = textParts.map((p) => p.text).join("\n")
    if (!text.trim()) return null

    return (
        <Message from="user">
            <MessageContent>
                <p>{text}</p>
            </MessageContent>
        </Message>
    )
}

// ── Main messages view ───────────────────────────────────────────────

export default function OpenCodeMessages() {
    const messages = useSortedMessages()
    return (
        <Conversation>
            <ConversationContent>
                {messages.length === 0 ?
                    <ConversationEmptyState />
                :   messages.map(({info, parts}) =>
                        info.role === "user" ?
                            <UserMessageDisplay key={info.id} parts={parts} />
                        :   <AssistantMessageDisplay
                                key={info.id}
                                info={info as AssistantMessage}
                                parts={parts}
                            />,
                    )
                }
            </ConversationContent>
            <ConversationScrollButton />
        </Conversation>
    )
}
