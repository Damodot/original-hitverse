import PulseHeart from '@/components/ui/PulseHeart';
import { useLikes, useLiveSong, useToggleLike } from '@/hooks/useLibrary';

/** Like toggle with the song's like count (React Bits' PulseHeart). */
export function LikeButton({ song, size = 18, pill = false, showCount = true, className }) {
  const { ids } = useLikes();
  const toggle = useToggleLike();
  const live = useLiveSong(song);
  if (!song) return null;
  const liked = ids.has(song._id);
  return (
    // Rows play the song on click, so keep the like click to itself.
    <span className={className} onClick={(e) => e.stopPropagation()}>
      <PulseHeart
        liked={liked}
        count={live?.likeCount ?? 0}
        showCount={showCount}
        size={size}
        corner={size}
        likedColor="var(--brand)"
        idleColor="var(--muted)"
        pillColor={pill ? 'color-mix(in srgb, var(--fg) 8%, transparent)' : 'transparent'}
        textColor="var(--fg)"
        label={`Like ${song.title}`}
        onChange={() => toggle.mutate({ id: song._id, liked })}
      />
    </span>
  );
}
