import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Toggle} from "@/components/ui/toggle"
import * as iframe from "@/stores/app-iframe-store"
import {useAppStore} from "@/stores/app-store"
import {Inspect, RefreshCw} from "lucide-react"
import {useEffect, useState} from "react"
import AppIFrame from "./app-iframe"

export default function AppBrowser() {
    const inspectorState = useAppStore((state) => state.inspectorState)
    const setIsInspectorActive = useAppStore((state) => state.setInspectorState)
    const [url, setUrl] = useState("")
    useEffect(() => {
        function onLoad() {
            setUrl(iframe.store.window?.location?.href || "")
        }
        return iframe.subscribeToLoad(onLoad)
    }, [])
    return (
        <>
            <div className="flex w-full max-w-xl gap-1 place-self-center p-1">
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => {
                        if (!iframe.store.iframe) return
                        iframe.store.iframe.src = url
                    }}
                >
                    <RefreshCw />
                </Button>
                <Input
                    className="h-8"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyUp={(e) => {
                        if (e.key !== "Enter") return
                        if (!iframe.store.iframe) return
                        iframe.store.iframe.src = url
                    }}
                    onBlur={() => {
                        setUrl(iframe.store.window?.location.href ?? "")
                    }}
                />
                <Toggle
                    size="sm"
                    pressed={inspectorState === "selecting"}
                    onPressedChange={() => {
                        if (inspectorState === "selecting") {
                            setIsInspectorActive(null)
                        } else {
                            setIsInspectorActive("selecting")
                        }
                    }}
                >
                    <Inspect />
                </Toggle>
            </div>
            <AppIFrame />
        </>
    )
}
