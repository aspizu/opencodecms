interface AppIFrameStore {
    iframe: HTMLIFrameElement | null
    document: Document | null
    window: Window | null
}

export const store: AppIFrameStore = {
    iframe: null,
    document: null,
    window: null,
}

const events: Map<EventListener, string> = new Map()
const loadListeners: Set<() => void> = new Set()

export function onLoad() {
    store.document = store.iframe?.contentDocument ?? null
    store.window = store.iframe?.contentWindow ?? null
    for (const [listener, event] of events.entries()) {
        store.window?.addEventListener(event, listener)
    }
    for (const listener of loadListeners) {
        listener()
    }
}

export function subscribeToLoad(listener: () => void) {
    loadListeners.add(listener)
    return () => {
        loadListeners.delete(listener)
    }
}

export function initialize(iframe: HTMLIFrameElement) {
    store.iframe = iframe
    iframe.src = window.location.origin
    iframe.addEventListener("load", onLoad)
}

export function deinitialize() {
    store.iframe?.removeEventListener("load", onLoad)
    for (const [listener, event] of events.entries()) {
        store.window?.removeEventListener(event, listener)
    }
    store.iframe = null
    store.document = null
    store.window = null
}

export function addEventListener(event: string, listener: EventListener) {
    events.set(listener, event)
    store.window?.addEventListener(event, listener)
}

export function removeEventListener(listener: EventListener) {
    const event = events.get(listener)
    if (!event) return
    events.delete(listener)
    store.window?.removeEventListener(event, listener)
}
