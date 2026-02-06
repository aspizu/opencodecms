import OpenCodeMessages from "@/features/opencode-messages"
import OpenCodePromptInput from "@/features/opencode-prompt-input"
import {useOpenCodeEventSubscription} from "@/hooks/use-opencode-session"

export default function AppOpenCode() {
    useOpenCodeEventSubscription()

    return (
        <div className="flex size-full flex-col">
            <OpenCodeMessages />
            <OpenCodePromptInput />
        </div>
    )
}
