import {create} from "zustand"
import {immer} from "zustand/middleware/immer"

type State = {
    inspectorState: null | "selecting" | "selected"
    selectedElement: Element | null
    /** Prompt text queued by the inspector's content-editable diff flow. */
    pendingEditPrompt: string | null
}

type Actions = {
    setInspectorState: (active: null | "selecting" | "selected") => void
    setSelectedElement: (element: Element | null) => void
    setPendingEditPrompt: (prompt: string | null) => void
}

export const useAppStore = create<State & Actions>()(
    immer((set) => ({
        inspectorState: null,
        selectedElement: null,
        pendingEditPrompt: null,
        setInspectorState: (active) =>
            set((state) => {
                state.inspectorState = active
                if (active === null) {
                    state.selectedElement = null as any
                }
            }),
        setSelectedElement: (element) =>
            set((state) => {
                state.selectedElement = element as any
            }),
        setPendingEditPrompt: (prompt) =>
            set((state) => {
                state.pendingEditPrompt = prompt
            }),
    })),
)
