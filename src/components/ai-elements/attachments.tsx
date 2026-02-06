"use client"

import type {FileUIPart} from "ai"
import type {ComponentProps} from "react"

import {cn} from "@/lib/utils"
import {cva, type VariantProps} from "class-variance-authority"
import {XIcon} from "lucide-react"

// ============================================================================
// Attachments container
// ============================================================================

const attachmentsVariants = cva("flex gap-2", {
    variants: {
        variant: {
            inline: "flex-wrap",
            grid: "grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))]",
        },
    },
    defaultVariants: {
        variant: "inline",
    },
})

export type AttachmentsProps = ComponentProps<"div"> &
    VariantProps<typeof attachmentsVariants>

export const Attachments = ({className, variant, ...props}: AttachmentsProps) => (
    <div
        data-slot="attachments"
        className={cn(attachmentsVariants({variant}), className)}
        {...props}
    />
)

// ============================================================================
// Individual Attachment
// ============================================================================

export type AttachmentData = FileUIPart & {id: string}

export type AttachmentProps = ComponentProps<"div"> & {
    data: AttachmentData
    onRemove?: () => void
}

export const Attachment = ({
    className,
    data,
    onRemove,
    children,
    ...props
}: AttachmentProps) => (
    <div
        data-slot="attachment"
        className={cn(
            "bg-muted relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            className,
        )}
        {...props}
    >
        {children ?? (
            <>
                <AttachmentPreview data={data} />
                {onRemove && <AttachmentRemove onClick={onRemove} />}
            </>
        )}
    </div>
)

// ============================================================================
// AttachmentPreview
// ============================================================================

export type AttachmentPreviewProps = ComponentProps<"div"> & {
    data?: AttachmentData
}

export const AttachmentPreview = ({
    className,
    data,
    ...props
}: AttachmentPreviewProps) => {
    const isImage = data?.mediaType?.startsWith("image/")

    return (
        <div
            data-slot="attachment-preview"
            className={cn("flex items-center gap-2 overflow-hidden", className)}
            {...props}
        >
            {isImage && data?.url ?
                <img
                    src={data.url}
                    alt={data.filename ?? "attachment"}
                    className="size-8 rounded object-cover"
                />
            :   null}
            {data?.filename && (
                <span className="text-muted-foreground max-w-30 truncate text-xs">
                    {data.filename}
                </span>
            )}
        </div>
    )
}

// ============================================================================
// AttachmentRemove
// ============================================================================

export type AttachmentRemoveProps = ComponentProps<"button">

export const AttachmentRemove = ({className, ...props}: AttachmentRemoveProps) => (
    <button
        data-slot="attachment-remove"
        type="button"
        className={cn(
            "text-muted-foreground hover:text-foreground -mr-1 ml-auto cursor-pointer rounded-full p-0.5 transition-colors",
            className,
        )}
        aria-label="Remove attachment"
        {...props}
    >
        <XIcon className="size-3.5" />
    </button>
)
