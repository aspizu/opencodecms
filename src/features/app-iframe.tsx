import * as iframe from "@/stores/app-iframe-store"
import {useEffect} from "react"

export default function AppIFrame() {
    useEffect(() => {
        const el = document.getElementById("app-iframe") as HTMLIFrameElement
        iframe.initialize(el)
        return () => iframe.deinitialize()
    }, [])
    return (
        <div className="grow bg-neutral-100">
            <iframe id="app-iframe" className="h-full w-full" />
        </div>
    )
}
