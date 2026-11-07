import { Slot } from '@radix-ui/react-slot';
import { LoaderCircle } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  primary: 'bg-brand text-brand-fg hover:bg-brand-strong shadow-lg shadow-brand/25',
  secondary: 'bg-subtle text-fg hover:bg-border',
  outline: 'border border-border bg-transparent text-fg hover:bg-subtle',
  ghost: 'bg-transparent text-fg hover:bg-subtle',
  glass: 'bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/20',
  light: 'bg-white text-black hover:bg-white/90',
};
const sizes = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-base',
  lg: 'h-13 px-7 text-lg',
  icon: 'size-10',
  'icon-sm': 'size-8',
  'icon-lg': 'size-14',
};

export const Button = forwardRef(function Button(
  { className, variant = 'primary', size = 'md', asChild = false, loading = false, children, disabled, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {asChild ? children : (
        <>
          {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  );
});
