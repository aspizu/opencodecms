# Project Guidelines

OpenCodeCMS is a visual CMS that embeds an Astro target site in an iframe for live inspection and editing. The React editor (root) communicates with the target site (`targetsite/`) through iframe APIs.

## Code Style

- **TypeScript strict mode** with path alias `@/*` → `./src/*`
- **Components**: Function components extending native props via `React.ComponentProps<"element">`
- **Styling**: CVA for variants, `cn()` from [lib/utils.ts](src/lib/utils.ts) for class merging
- **Exports**: UI components use named exports; feature components use default exports
- **Data attributes**: All UI components must include `data-slot="component-name"` for styling/testing

## Architecture

```
src/
├── components/ui/     # shadcn primitives (button, dialog, etc.)
├── components/ai-elements/  # AI SDK UI components
├── features/          # App-level compositions (app-browser, app-inspector)
├── stores/            # Module-based state (not Zustand for iframe refs)
├── hooks/             # Custom React hooks
└── lib/               # Utilities (cn, etc.)
targetsite/            # Astro blog being edited (loads in iframe)
```

**Iframe communication**: Use [stores/app-iframe-store.tsx](src/stores/app-iframe-store.tsx) for accessing iframe document/window. Call `initialize()` on mount, use `addEventListener()` for cross-frame events.

## Build and Test

```bash
# Main app (root)
bun install           # Install dependencies
bun run dev           # Vite dev server
bun run build         # tsc -b && vite build
bun run lint          # ESLint
bun run fmt           # Prettier

# Target site
cd targetsite
bun install
bun run dev           # Astro dev server (localhost:4321)
```

## Project Conventions

**UI Components** follow shadcn/ui patterns—see [button.tsx](src/components/ui/button.tsx):

```tsx
const buttonVariants = cva("base-classes", {
    variants: { variant: {...}, size: {...} },
    defaultVariants: { variant: "default", size: "default" }
})

function Button({className, variant, size, asChild, ...props}: ButtonProps) {
    const Comp = asChild ? Slot.Root : "button"
    return <Comp data-slot="button" className={cn(buttonVariants({variant, size}), className)} {...props} />
}
```

**Feature components** in `src/features/` are named `app-*.tsx` and orchestrate UI components with store access.

**Store modules** export plain objects + functions (not hooks) for DOM references:

```tsx
export const store = { iframe: null, document: null }
export function initialize(iframe: HTMLIFrameElement) {...}
```

## Styling

- **Tailwind CSS 4** with OKLCH color variables in [styles/global.css](src/styles/global.css)
- **Dark mode**: Use `dark:` prefix; toggles via `.dark` class on root
- **State styling**: Use `data-[state=active]:`, `group-data-[state=*]:` selectors
- **Font**: Figtree Variable (`--font-sans`)

## Integration Points

- **Radix UI** primitives underpin shadcn components—use `asChild` prop for composition
- **Vercel AI SDK** for AI features; render with streamdown plugins (code, math, mermaid)
- **Allotment** for resizable split panes in the editor layout
