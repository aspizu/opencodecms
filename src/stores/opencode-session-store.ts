import opencode from "@/services/opencode"
import type {Message as OcMessage, Part} from "@opencode-ai/sdk"
import {useMutation} from "@tanstack/react-query"
import {create} from "zustand"
import {immer} from "zustand/middleware/immer"

export interface MessageEntry {
    info: OcMessage
    parts: Part[]
}

type State = {
    messages: Map<string, MessageEntry>
    sessionId: string | null
}

type Actions = {
    setSessionId: (id: string) => void
    handleEvent: (event: {type: string; properties: Record<string, unknown>}) => void
}

export const useOpenCodeSessionStore = create<State & Actions>()(
    immer((set, get) => ({
        messages: new Map(),
        sessionId: null,

        setSessionId: (id) =>
            set((state) => {
                state.sessionId = id
            }),

        handleEvent: (event) => {
            const sessionId = get().sessionId
            if (!sessionId) return

            switch (event.type) {
                case "message.updated": {
                    const {info} = event.properties as {info: OcMessage}
                    if (info.sessionID !== sessionId) return
                    set((state) => {
                        const existing = state.messages.get(info.id)
                        state.messages.set(info.id, {
                            info,
                            parts: existing?.parts ?? [],
                        })
                    })
                    break
                }
                case "message.removed": {
                    const {sessionID, messageID} = event.properties as {
                        sessionID: string
                        messageID: string
                    }
                    if (sessionID !== sessionId) return
                    set((state) => {
                        state.messages.delete(messageID)
                    })
                    break
                }
                case "message.part.updated": {
                    const {part} = event.properties as {part: Part; delta?: string}
                    if (part.sessionID !== sessionId) return
                    set((state) => {
                        const entry = state.messages.get(part.messageID)
                        if (!entry) return
                        const partIndex = entry.parts.findIndex((p) => p.id === part.id)
                        if (partIndex >= 0) {
                            entry.parts[partIndex] = part
                        } else {
                            entry.parts.push(part)
                        }
                    })
                    break
                }
                case "message.part.removed": {
                    const {sessionID, messageID, partID} = event.properties as {
                        sessionID: string
                        messageID: string
                        partID: string
                    }
                    if (sessionID !== sessionId) return
                    set((state) => {
                        const entry = state.messages.get(messageID)
                        if (!entry) return
                        entry.parts = entry.parts.filter((p) => p.id !== partID)
                    })
                    break
                }
            }
        },
    })),
)

export function useSortedMessages() {
    const messages = useOpenCodeSessionStore((s) => s.messages)
    return Array.from(messages.values()).sort(
        (a, b) => a.info.time.created - b.info.time.created,
    )
}

export function useCreateSession() {
    const setSessionId = useOpenCodeSessionStore((s) => s.setSessionId)

    return useMutation({
        mutationKey: ["createSession"],
        mutationFn: async () => {
            const session = await opencode.session.create({
                query: {
                    directory: "targetsite",
                },
            })
            if (session.error) {
                throw session.error
            }
            setSessionId(session.data.id)
            return session.data
        },
    })
}
