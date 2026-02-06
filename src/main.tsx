import AppInspector from "@/features/app-inspector"
import App from "@/features/app.tsx"
import "@/styles/global.css"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import "allotment/dist/style.css"
import {enableMapSet} from "immer"
import {StrictMode} from "react"
import {createRoot} from "react-dom/client"

// @ts-expect-error no types
import "@fontsource-variable/figtree"

enableMapSet()

const queryClient = new QueryClient()

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            <AppInspector />
        </QueryClientProvider>
    </StrictMode>,
)
