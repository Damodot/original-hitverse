import { Globe } from 'lucide-react';
import { SOCIAL_ICONS } from '@/components/ui/icons';
import { cn } from '@/lib/utils';

const ORDER = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['x', 'X'], ['youtube', 'YouTube'], ['facebook', 'Facebook'], ['website', 'Website']];

/** An artist's social links (only the ones they filled in). */
export function ArtistSocials({ socials, className, itemClassName }) {
  const items = ORDER.filter(([key]) => socials?.[key]);
  if (!items.length) return null;
  return (
    <ul className={cn('flex flex-wrap gap-1', className)}>
      {items.map(([key, label]) => {
        const Icon = SOCIAL_ICONS[key] ?? Globe;
        return (
          <li key={key}>
            <a href={socials[key]} target="_blank" rel="noopener noreferrer" aria-label={label}
              className={cn('grid size-11 place-items-center rounded-full transition hover:bg-fg/10', itemClassName)}>
              <Icon className="size-5" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
