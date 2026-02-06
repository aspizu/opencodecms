import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorName,
    ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector"
import {useModelOptions} from "@/hooks/use-providers"
import {BrainIcon, CheckIcon} from "lucide-react"
import {useMemo, useState} from "react"

interface SelectedModel {
    providerID: string
    modelID: string
}

interface OpenCodeModelSelectorProps {
    model: SelectedModel | null
    onModelChange: (model: SelectedModel) => void
}

export default function OpenCodeModelSelector({
    model,
    onModelChange,
}: OpenCodeModelSelectorProps) {
    const [open, setOpen] = useState(false)
    const {models, isLoading} = useModelOptions()

    const grouped = useMemo(() => {
        const groups = new Map<string, typeof models>()
        for (const m of models) {
            const arr = groups.get(m.providerName) ?? []
            arr.push(m)
            groups.set(m.providerName, arr)
        }
        return groups
    }, [models])

    const selectedLabel = useMemo(() => {
        if (!model) return null
        return (
            models.find(
                (m) => m.providerID === model.providerID && m.modelID === model.modelID,
            )?.modelName ?? model.modelID
        )
    }, [model, models])

    return (
        <ModelSelector open={open} onOpenChange={setOpen}>
            <ModelSelectorTrigger asChild>
                <button className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors">
                    <BrainIcon className="size-3.5 shrink-0 opacity-60" />
                    {selectedLabel ?? (isLoading ? "Loading…" : "Select model…")}
                </button>
            </ModelSelectorTrigger>
            <ModelSelectorContent title="Select Model">
                <ModelSelectorInput placeholder="Search models…" />
                <ModelSelectorList>
                    <ModelSelectorEmpty>
                        {isLoading ? "Loading models…" : "No models found."}
                    </ModelSelectorEmpty>
                    {Array.from(grouped.entries()).map(
                        ([providerName, providerModels]) => (
                            <ModelSelectorGroup
                                key={providerName}
                                heading={providerName}
                            >
                                {providerModels.map((m) => (
                                    <ModelSelectorItem
                                        key={m.key}
                                        value={m.key}
                                        keywords={[
                                            m.modelName,
                                            m.providerName,
                                            m.modelID,
                                        ]}
                                        onSelect={() => {
                                            onModelChange({
                                                providerID: m.providerID,
                                                modelID: m.modelID,
                                            })
                                            setOpen(false)
                                        }}
                                    >
                                        <ModelSelectorLogo provider={m.providerID} />
                                        <ModelSelectorName>
                                            {m.modelName}
                                        </ModelSelectorName>
                                        {model?.providerID === m.providerID &&
                                            model?.modelID === m.modelID && (
                                                <CheckIcon className="text-muted-foreground size-3.5 shrink-0" />
                                            )}
                                    </ModelSelectorItem>
                                ))}
                            </ModelSelectorGroup>
                        ),
                    )}
                </ModelSelectorList>
            </ModelSelectorContent>
        </ModelSelector>
    )
}
