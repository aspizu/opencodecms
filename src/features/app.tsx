import {Allotment} from "allotment"
import AppBrowser from "./app-browser"
import AppOpenCode from "./app-opencode"

export default function App() {
    return (
        <Allotment className="">
            <Allotment.Pane>
                <AppOpenCode />
            </Allotment.Pane>
            <Allotment.Pane minSize={480} className="flex flex-col">
                <AppBrowser />
            </Allotment.Pane>
        </Allotment>
    )
}
