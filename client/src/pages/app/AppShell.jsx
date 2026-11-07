import AppLayout from '@/components/layout/AppLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PlayerProvider } from '@/context/PlayerContext';

// The player (and Radix tooltips) only load for signed-in users.
export default function AppShell() {
  return (
    <PlayerProvider>
      <TooltipProvider delayDuration={300}>
        <AppLayout />
      </TooltipProvider>
    </PlayerProvider>
  );
}
