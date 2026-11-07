import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '@/lib/utils';

export function Slider({ className, thumbClassName, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn('group relative flex h-5 w-full cursor-pointer touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1 grow overflow-hidden rounded-full bg-fg/15 transition-[height] group-hover:h-1.5">
        <SliderPrimitive.Range className="absolute h-full bg-fg group-hover:bg-brand" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={props['aria-label']}
        className={cn(
          'block size-3.5 scale-0 rounded-full bg-fg shadow transition-transform group-hover:scale-100 focus-visible:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/40',
          thumbClassName,
        )}
      />
    </SliderPrimitive.Root>
  );
}
