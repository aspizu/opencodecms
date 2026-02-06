import opencode from "@/services/opencode"
import {useQuery} from "@tanstack/react-query"

/** Shape of a single model within a provider */
export interface ProviderModel {
    id: string
    name: string
    providerID: string
    providerName: string
    reasoning: boolean
    attachment: boolean
    temperature: boolean
    tool_call: boolean
    cost?: {
        input: number
        output: number
    }
    limit: {
        context: number
        output: number
    }
    status?: "alpha" | "beta" | "deprecated"
}

/** Flat representation for use in model selectors */
export interface ModelOption {
    /** Composite key: `providerID:modelID` */
    key: string
    providerID: string
    modelID: string
    modelName: string
    providerName: string
    reasoning: boolean
    status?: "alpha" | "beta" | "deprecated"
}

const POPULAR_PROVIDERS = [
    "opencode",
    "anthropic",
    "github-copilot",
    "openai",
    "google",
    "openrouter",
    "vercel",
]

export function useProviders() {
    return useQuery({
        queryKey: ["providers"],
        queryFn: async () => {
            const res = await opencode.provider.list()
            if (res.error) throw res.error
            return res.data
        },
        staleTime: 60_000,
    })
}

/** Returns a flat, sorted list of models from all connected providers */
export function useModelOptions() {
    const providers = useProviders()

    const models: ModelOption[] = []

    if (providers.data) {
        const connected = new Set(providers.data.connected)
        for (const provider of providers.data.all) {
            if (!connected.has(provider.id)) continue
            for (const model of Object.values(provider.models)) {
                if (model.status === "deprecated") continue
                models.push({
                    key: `${provider.id}:${model.id}`,
                    providerID: provider.id,
                    modelID: model.id,
                    modelName: model.name,
                    providerName: provider.name,
                    reasoning: model.reasoning,
                    status: model.status,
                })
            }
        }

        // Sort: popular providers first, then alphabetically by model name
        models.sort((a, b) => {
            const aPopIdx = POPULAR_PROVIDERS.indexOf(a.providerID)
            const bPopIdx = POPULAR_PROVIDERS.indexOf(b.providerID)
            const aIsPopular = aPopIdx !== -1
            const bIsPopular = bPopIdx !== -1

            if (aIsPopular && !bIsPopular) return -1
            if (!aIsPopular && bIsPopular) return 1
            if (aIsPopular && bIsPopular && aPopIdx !== bPopIdx)
                return aPopIdx - bPopIdx

            if (a.providerName !== b.providerName) {
                return a.providerName.localeCompare(b.providerName)
            }
            return a.modelName.localeCompare(b.modelName)
        })
    }

    return {
        models,
        isLoading: providers.isLoading,
        isError: providers.isError,
        defaultModel: providers.data?.default,
    }
}

/** Fetches the opencode config and returns the configured default model. */
export function useDefaultModel() {
    // API does not  provide the selected model directly so set to default
    return {
        providerID: "opencode",
        modelID: "big-pickle",
    }
}
