import * as Menu from '@radix-ui/react-dropdown-menu';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuSub = Menu.Sub;

const panel =
  'z-50 min-w-48 overflow-hidden rounded-xl border border-border bg-elevated p-1.5 text-fg shadow-2xl shadow-black/30 data-[state=open]:animate-in';

export function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
  return (
    <Menu.Portal>
      <Menu.Content sideOffset={sideOffset} className={cn(panel, className)} {...props} />
    </Menu.Portal>
  );
}

const item =
  'relative flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[15px] outline-none select-none data-[highlighted]:bg-subtle data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted';

export function DropdownMenuItem({ className, ...props }) {
  return <Menu.Item className={cn(item, className)} {...props} />;
}

export function DropdownMenuLabel({ className, ...props }) {
  return <Menu.Label className={cn('px-3 py-2 text-sm text-muted', className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="my-1 h-px bg-border" />;
}

export function DropdownMenuSubTrigger({ className, children, ...props }) {
  return (
    <Menu.SubTrigger className={cn(item, 'data-[state=open]:bg-subtle', className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </Menu.SubTrigger>
  );
}

export function DropdownMenuSubContent({ className, ...props }) {
  return (
    <Menu.Portal>
      <Menu.SubContent sideOffset={6} className={cn(panel, className)} {...props} />
    </Menu.Portal>
  );
}
