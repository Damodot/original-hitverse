import * as RDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** A centred dialog with a title and a scrollable body. */
export function Modal({ open, onOpenChange, title, description, children, footer, className }) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <RDialog.Content className={cn('fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100%-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border bg-elevated shadow-2xl outline-none', className)}>
          <div className="border-b border-border px-5 py-4 pr-12">
            <RDialog.Title className="text-xl font-bold">{title}</RDialog.Title>
            <RDialog.Description className={description ? 'mt-1 text-sm text-muted' : 'sr-only'}>{description || title}</RDialog.Description>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
          <RDialog.Close className="absolute top-3.5 right-3.5 grid size-8 cursor-pointer place-items-center rounded-full text-muted hover:bg-subtle hover:text-fg" aria-label="Close">
            <X className="size-4" />
          </RDialog.Close>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
