import opencode from "@/services/opencode"
import {useOpenCodeSessionStore} from "@/stores/opencode-session-store"
import {useEffect} from "react"

export type {MessageEntry} from "@/stores/opencode-session-store"

/** Call once at the app level to subscribe to opencode events. */
export function useOpenCodeEventSubscription() {
    const handleEvent = useOpenCodeSessionStore((s) => s.handleEvent)

    useEffect(() => {
        let cancelled = false

        async function subscribe() {
            const events = await opencode.event.subscribe()
            for await (const event of events.stream) {
                if (cancelled) break
                handleEvent(
                    event as {
                        type: string
                        properties: Record<string, unknown>
                    },
                )
            }
        }

        subscribe()
        return () => {
            cancelled = true
        }
    }, [handleEvent])
}
