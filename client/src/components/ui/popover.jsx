import * as RPopover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';

export const Popover = RPopover.Root;
export const PopoverTrigger = RPopover.Trigger;
export const PopoverClose = RPopover.Close;

export function PopoverContent({ className, sideOffset = 10, align = 'center', ...props }) {
  return (
    <RPopover.Portal>
      <RPopover.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={12}
        className={cn('z-[60] w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-elevated p-4 text-fg shadow-2xl shadow-black/30 outline-none', className)}
        {...props}
      />
    </RPopover.Portal>
  );
}
