import { useEffect, useRef } from 'react';
import FuseButton from '@/components/ui/FuseButton';

const TONES = {
  default: { color: 'var(--fg)', background: 'var(--subtle)', fuseColor: '#f5a524' },
  primary: { color: '#ffffff', background: 'var(--brand)', fuseColor: '#fde68a' },
  danger: { color: '#ef4444', background: 'color-mix(in srgb, #ef4444 12%, transparent)', fuseColor: '#ef4444' },
};

/**
 * React Bits' FuseButton for actions you can take back: the fuse burns for `undoWindow` ms with an Undo button,
 * and the action only runs when it burns out. Leaving the page mid-countdown still runs it.
 */
export function UndoButton({ onConfirm, onArmedChange, label, doneLabel, icon, tone = 'default', undoWindow = 6000, size = 'sm', disabled, className }) {
  const armed = useRef(false);
  const latest = useRef(onConfirm);
  latest.current = onConfirm;
  useEffect(() => () => {
    if (armed.current) latest.current();
  }, []);
  return (
    <FuseButton
      label={label}
      undoLabel="Undo"
      doneLabel={doneLabel}
      icon={icon}
      size={size}
      radius={999}
      undoWindow={undoWindow}
      commitOn="fuseEnd"
      settle="stay"
      disabled={disabled}
      onPhaseChange={(phase) => {
        armed.current = phase === 'armed';
        onArmedChange?.(armed.current);
      }}
      onCommit={() => {
        armed.current = false;
        latest.current();
      }}
      className={className}
      {...TONES[tone]}
    />
  );
}
