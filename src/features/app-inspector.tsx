import {Button} from "@/components/ui/button"
import {getElementPath} from "@/lib/dom-utils"
import {buildEditDiffPrompt} from "@/lib/html-diff"
import {cn} from "@/lib/utils"
import * as iframe from "@/stores/app-iframe-store"
import {useAppStore} from "@/stores/app-store"
import {Check, Pencil, X} from "lucide-react"
import {useEffect, useRef, useState} from "react"

interface Rect {
    top: number
    left: number
    width: number
    height: number
}

function calculateHoveredBounds(hovered: Element | null): Rect | undefined {
    const iframeRect = iframe.store.iframe?.getBoundingClientRect()
    const hoveredRect_ = hovered?.getBoundingClientRect()

    if (!hoveredRect_) return undefined

    const hoveredRect = {
        top: hoveredRect_.top,
        left: hoveredRect_.left,
        width: hoveredRect_.width,
        height: hoveredRect_.height,
    }

    if (iframeRect) {
        hoveredRect.top += iframeRect.top
        hoveredRect.left += iframeRect.left
        hoveredRect.top = Math.max(hoveredRect.top, iframeRect.top)
        hoveredRect.left = Math.max(hoveredRect.left, iframeRect.left)
        hoveredRect.width = Math.min(
            hoveredRect.width,
            iframeRect.left + iframeRect.width - hoveredRect.left,
        )
        hoveredRect.height = Math.min(
            hoveredRect.height,
            iframeRect.top + iframeRect.height - hoveredRect.top,
        )
    }

    return hoveredRect
}

export default function AppInspector() {
    const inspectorState = useAppStore((state) => state.inspectorState)
    const setInspectorState = useAppStore((state) => state.setInspectorState)
    const [hovered, setHovered] = useState<Element | null>(null)
    const [hoveredRect, setHoveredRect] = useState<Rect | undefined>(undefined)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        if (inspectorState === null) {
            return
        }

        const interval = setInterval(() => {
            setHoveredRect(calculateHoveredBounds(hovered))
        }, 40) // 25 FPS = 1000ms / 25 = 40ms

        return () => {
            clearInterval(interval)
            setHoveredRect(undefined)
        }
    }, [inspectorState, hovered])

    useEffect(() => {
        function onMouseMove(e_: Event) {
            const e = e_ as MouseEvent
            const x = e.clientX
            const y = e.clientY
            const el = iframe.store.document?.elementFromPoint(x, y)
            setHovered(el ?? null)
        }
        if (inspectorState === "selecting") {
            iframe.addEventListener("mousemove", onMouseMove)
            return () => iframe.removeEventListener(onMouseMove)
        }
    }, [inspectorState])
    const setSelectedElement = useAppStore((state) => state.setSelectedElement)
    useEffect(() => {
        function onClick(e: Event) {
            if (inspectorState === "selecting") {
                setInspectorState("selected")
                setSelectedElement(hovered)
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
            }
        }
        iframe.addEventListener("click", onClick)
        return () => iframe.removeEventListener(onClick)
    }, [inspectorState, setInspectorState, setSelectedElement, hovered])
    const beforeHTMLRef = useRef<string>("")
    const setPendingEditPrompt = useAppStore((state) => state.setPendingEditPrompt)

    function beginEditing() {
        if (!hovered) return
        beforeHTMLRef.current = hovered.outerHTML
        setIsEditing(true)
        // eslint-disable-next-line react-hooks/immutability
        ;(hovered as HTMLElement).contentEditable = "true"
        ;(hovered as HTMLElement).focus()
    }

    function confirmEditing() {
        if (!hovered)
            return // Remove contentEditable before capturing HTML so it doesn't leak into the diff
        ;(hovered as HTMLElement).removeAttribute("contenteditable")
        setIsEditing(false)

        const afterHTML = hovered.outerHTML
        const beforeHTML = beforeHTMLRef.current

        if (beforeHTML !== afterHTML) {
            const currentUrl = iframe.store.window?.location.href ?? "unknown"
            const elementPath = getElementPath(hovered)
            const prompt = buildEditDiffPrompt(
                beforeHTML,
                afterHTML,
                elementPath,
                currentUrl,
            )
            setPendingEditPrompt(prompt)
        }
    }

    function cancelEditing() {
        if (!hovered)
            return // Restore original HTML
            // eslint-disable-next-line react-hooks/immutability
        ;(hovered as HTMLElement).innerHTML =
            new DOMParser().parseFromString(beforeHTMLRef.current, "text/html").body
                .firstElementChild?.innerHTML ?? hovered.innerHTML
        ;(hovered as HTMLElement).removeAttribute("contenteditable")
        setIsEditing(false)
    }
    return (
        <>
            {/* Non-interactive overlay for visual decorations */}
            <div
                className={cn(
                    "ring-primary pointer-events-none fixed rounded-md ring-1 ring-offset-1 ring-offset-transparent",
                    inspectorState === null && "hidden",
                    !isEditing && "bg-primary/10",
                )}
                style={{...hoveredRect}}
            >
                <div className="bg-primary absolute top-0.5 left-0.5 flex h-5 items-center justify-center rounded-md px-1.5 text-xs font-medium text-white">
                    {hovered?.tagName.toUpperCase()}
                </div>
            </div>
            {/* Interactive overlay for left side */}
            <div
                className={cn(
                    "fixed",
                    inspectorState === null && "hidden",
                    inspectorState === "selecting" && "pointer-events-none",
                )}
                style={{top: hoveredRect?.top, left: hoveredRect?.left}}
            >
                <div className="absolute top-0.5 left-0.5 flex gap-0.5"></div>
            </div>
            {/* Interactive overlay for right side */}
            <div
                className={cn("fixed", inspectorState !== "selected" && "hidden")}
                style={{
                    top: hoveredRect?.top,
                    left:
                        hoveredRect?.left !== undefined ?
                            hoveredRect.left + hoveredRect.width
                        :   undefined,
                }}
            >
                <div className="absolute top-0.5 right-0.5 flex gap-0.5">
                    {isEditing ?
                        <>
                            <Button
                                size="icon"
                                className="size-5"
                                onClick={confirmEditing}
                            >
                                <Check className="size-3" />
                            </Button>
                            <Button
                                size="icon"
                                className="size-5"
                                onClick={cancelEditing}
                            >
                                <X className="size-3" />
                            </Button>
                        </>
                    :   <>
                            <Button
                                size="icon"
                                className="size-5"
                                onClick={beginEditing}
                            >
                                <Pencil className="size-3" />
                            </Button>
                            <Button
                                size="icon"
                                className="size-5"
                                onClick={() => {
                                    setInspectorState(null)
                                }}
                            >
                                <X className="size-3" />
                            </Button>
                        </>
                    }
                </div>
            </div>
        </>
    )
}
