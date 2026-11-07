import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      className={cn('relative inline-flex h-8 w-14 cursor-pointer items-center rounded-full border border-white/20 bg-black/30 p-1 backdrop-blur transition', className)}
    >
      <span className={cn('grid size-6 place-items-center rounded-full bg-white text-black shadow transition-transform duration-300', dark && 'translate-x-6')}>
        {dark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
      </span>
    </button>
  );
}
