import * as T from '@radix-ui/react-tooltip';

export const TooltipProvider = T.Provider;

export function Tooltip({ label, children, side = 'top' }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={8} className="z-50 rounded-md bg-fg px-2.5 py-1 text-sm font-medium text-bg shadow-lg">
          {label}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
