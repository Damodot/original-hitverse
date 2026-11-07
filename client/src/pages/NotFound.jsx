import { Link } from 'react-router';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import FuzzyText from '@/components/ui/FuzzyText';

const DISPLAY_FONT = "'Anton SC', Impact, sans-serif";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center overflow-hidden px-4 py-10 text-center">
      <div className="flex flex-col items-center">
        <Link to="/" aria-label="HitVerse home"><Logo className="h-8" /></Link>
        {/* Fuzzes harder on hover and glitches every few seconds, like a signal cutting out. */}
        <div className="mt-8 flex flex-col items-center gap-1">
          <FuzzyText
            fontSize="clamp(6rem, 24vw, 15rem)"
            fontWeight={400}
            fontFamily={DISPLAY_FONT}
            gradient={['#b06bff', '#9933ff', '#6100a1']}
            baseIntensity={0.2}
            hoverIntensity={0.6}
            colorSplit={0.6}
            glitchMode
            glitchInterval={3200}
            glitchDuration={220}
            intro
          >
            404
          </FuzzyText>
          <FuzzyText
            fontSize="clamp(1.5rem, 5vw, 2.75rem)"
            fontWeight={400}
            fontFamily={DISPLAY_FONT}
            letterSpacing={2}
            baseIntensity={0.15}
            hoverIntensity={0.5}
            fuzzRange={18}
            intro
          >
            PAGE NOT FOUND
          </FuzzyText>
        </div>
        <h1 className="mt-6 text-xl font-semibold sm:text-2xl">This page fell off the beat.</h1>
        <p className="mt-2 max-w-sm text-muted">The page you’re looking for doesn’t exist or was moved.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild><Link to="/">Back home</Link></Button>
          <Button asChild variant="secondary"><Link to="/artists">Find artists</Link></Button>
        </div>
      </div>
    </div>
  );
}
