import { Disc3, Ellipsis, ExternalLink, Link2, ListMusic, MicVocal, PencilLine, Share2, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from '@/lib/toast';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LyricsEditor } from '@/components/LyricsEditor';
import { StreamingLinksEditor } from '@/components/StreamingLinksEditor';
import { useAuth } from '@/context/AuthContext';
import { useAlbums } from '@/hooks/useLibrary';
import { linkCount } from '@/lib/platforms';
import { cn } from '@/lib/utils';

/** The "⋯" menu on a track: lyrics, album, artist page, its public song page and share. */
export function SongMenu({ song, className, onNavigate }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const canEdit = user?.role === 'admin' || (user?.canUpload && song.uploader && String(song.uploader) === String(user.id));
  const others = linkCount(song.links);
  const { data: albums } = useAlbums();
  const album = albums?.find((a) => a._id === song.album);
  const go = (to) => {
    onNavigate?.();
    navigate(to);
  };

  const share = async () => {
    // The public song page: anyone can open it, signed in or not, and pick their platform.
    const url = `${window.location.origin}/listen/${song.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: `${song.title} — ${song.artist}`, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch { /* share sheet closed */ }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`More options for ${song.title}`}
          className={cn('grid size-9 cursor-pointer place-items-center rounded-full text-muted transition hover:bg-subtle hover:text-fg', className)}
        >
          <Ellipsis className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onSelect={() => go(`/app/lyrics/${song.slug}`)}><MicVocal /> View lyrics</DropdownMenuItem>
        {album && <DropdownMenuItem onSelect={() => go(`/app/albums/${album.slug}`)}><Disc3 /> Go to {album.title}</DropdownMenuItem>}
        {song.artistProfile && <DropdownMenuItem onSelect={() => go(`/a/${song.artistProfile.slug}`)}><Users /> {song.artistProfile.name}’s page</DropdownMenuItem>}
        <DropdownMenuItem onSelect={() => go(`/listen/${song.slug}`)}>
          <ExternalLink /> {others ? `Listen on ${others} other ${others === 1 ? 'platform' : 'platforms'}` : 'Open song page'}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={share}>{navigator.share ? <Share2 /> : <Link2 />} Share song page</DropdownMenuItem>
        {canEdit && <DropdownMenuItem onSelect={() => setEditingLyrics(true)}><PencilLine /> Lyrics, sync &amp; credits</DropdownMenuItem>}
        {canEdit && <DropdownMenuItem onSelect={() => setEditing(true)}><ListMusic /> Edit streaming links</DropdownMenuItem>}
      </DropdownMenuContent>
      {/* React passes portal clicks up to the track row, which would start playback; stop them here. */}
      {canEdit && (
        <span className="contents" onClick={(e) => e.stopPropagation()}>
          <StreamingLinksEditor song={song} open={editing} onOpenChange={setEditing} />
          <LyricsEditor song={song} open={editingLyrics} onOpenChange={setEditingLyrics} />
        </span>
      )}
    </DropdownMenu>
  );
}
