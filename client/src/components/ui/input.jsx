import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useId, useState } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-xl border border-border bg-elevated/70 px-4 text-base text-fg placeholder:text-muted transition outline-none focus:border-brand focus:ring-4 focus:ring-brand/20 aria-invalid:border-red-500',
        className,
      )}
      {...props}
    />
  );
});

/** Labelled input with an optional error and a show/hide toggle for passwords. */
export const Field = forwardRef(function Field({ label, error, type = 'text', className, ...props }, ref) {
  const id = useId();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-fg/90">{label}</label>
      <div className="relative">
        <Input
          ref={ref}
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className={isPassword ? 'pr-12' : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-muted hover:text-fg"
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-err`} className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

/** Labelled multi-line text box with an optional hint, character count and error. */
export const TextareaField = forwardRef(function TextareaField({ label, hint, error, className, maxLength, value, ...props }, ref) {
  const id = useId();
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-fg/90">{label}</label>
        {maxLength && <span className="text-xs text-muted tabular-nums">{value?.length ?? 0}/{maxLength}</span>}
      </div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? `${id}-help` : undefined}
        className="min-h-28 w-full resize-y rounded-xl border border-border bg-elevated/70 px-4 py-3 text-base text-fg placeholder:text-muted transition outline-none focus:border-brand focus:ring-4 focus:ring-brand/20 aria-invalid:border-red-500"
        {...props}
      />
      {(error || hint) && <p id={`${id}-help`} className={cn('text-sm', error ? 'text-red-500' : 'text-muted')}>{error || hint}</p>}
    </div>
  );
});
