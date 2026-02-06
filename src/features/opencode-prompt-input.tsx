import {
    PromptInput,
    PromptInputBody,
    PromptInputFooter,
    type PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input"
import OpenCodeModelSelector from "@/features/opencode-model-selector"
import {useDefaultModel} from "@/hooks/use-providers"
import {getElementPath} from "@/lib/dom-utils"
import opencode from "@/services/opencode"
import * as iframe from "@/stores/app-iframe-store"
import {useAppStore} from "@/stores/app-store"
import {useCreateSession} from "@/stores/opencode-session-store"
import {useEffect, useState} from "react"

interface SelectedModel {
    providerID: string
    modelID: string
}

export default function OpenCodePromptInput() {
    const createSession = useCreateSession()
    const [text, setText] = useState("")
    const [model, setModel] = useState<SelectedModel | null>(null)
    const defaultModel = useDefaultModel()
    const activeModel = model ?? defaultModel

    const selectedElement = useAppStore((state) => state.selectedElement)
    const pendingEditPrompt = useAppStore((state) => state.pendingEditPrompt)
    const setPendingEditPrompt = useAppStore((state) => state.setPendingEditPrompt)

    const sendPromptText = (promptText: string) => {
        const sendPrompt = (sessionId: string) => {
            opencode.session.promptAsync({
                path: {id: sessionId},
                body: {
                    parts: [{type: "text", text: promptText}],
                    ...(activeModel && {
                        model: {
                            providerID: activeModel.providerID,
                            modelID: activeModel.modelID,
                        },
                    }),
                },
            })
        }

        if (createSession.isSuccess) {
            sendPrompt(createSession.data.id)
        } else {
            createSession.mutate(undefined, {
                onSuccess: (session) => {
                    sendPrompt(session.id)
                },
            })
        }
    }

    // Auto-send pending edit prompts from the inspector
    useEffect(() => {
        if (pendingEditPrompt) {
            sendPromptText(pendingEditPrompt)
            setPendingEditPrompt(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingEditPrompt])

    const handleSubmit = (message: PromptInputMessage) => {
        if (!message.text) {
            return
        }

        let promptText = message.text
        if (selectedElement) {
            const currentUrl = iframe.store.window?.location.href ?? "unknown"
            const elementPath = getElementPath(selectedElement)
            promptText += `\n\nCurrent URL: ${currentUrl}`
            promptText += `\nElement path: ${elementPath}`
            promptText += `\n\`\`\`html\n${selectedElement.outerHTML}\n\`\`\``
        }

        sendPromptText(promptText)
        setText("")
    }

    return (
        <div className="flex flex-col p-1">
            <PromptInput
                aria-disabled={createSession.isPending}
                onSubmit={handleSubmit}
            >
                <PromptInputBody>
                    <PromptInputTextarea
                        onChange={(e) => setText(e.target.value)}
                        value={text}
                    />
                </PromptInputBody>
                <PromptInputFooter>
                    <PromptInputTools>
                        <OpenCodeModelSelector
                            model={activeModel}
                            onModelChange={setModel}
                        />
                    </PromptInputTools>
                    <PromptInputSubmit disabled={!text} />
                </PromptInputFooter>
            </PromptInput>
        </div>
    )
}
