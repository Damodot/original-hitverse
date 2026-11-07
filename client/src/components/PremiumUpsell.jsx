import { Crown, Disc3, Mic } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

const COPY = {
  karaoke: { icon: Mic, title: 'Karaoke is a Premium feature', text: 'Take the vocals off any song and sing it yourself, with the lyrics on screen.' },
  dj: { icon: Disc3, title: 'DJ mode is a Premium feature', text: 'Let every song blend into the next, beat on beat, like a DJ set.' },
};

/** Shown when someone without Premium taps karaoke or DJ mode. */
export function PremiumUpsell({ feature, onClose }) {
  const copy = COPY[feature] ?? COPY.karaoke;
  const Icon = copy.icon;
  return (
    <Modal open={Boolean(feature)} onOpenChange={(o) => !o && onClose()} title={copy.title}
      footer={<><Button variant="ghost" onClick={onClose}>Not now</Button><Button asChild onClick={onClose}><Link to="/app/premium"><Crown className="size-4" /> See Premium</Link></Button></>}>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand/15 text-brand"><Icon className="size-6" /></span>
        <div>
          <p>{copy.text}</p>
          <p className="mt-2 text-sm text-muted">Premium unlocks karaoke and DJ mode together.</p>
        </div>
      </div>
    </Modal>
  );
}
