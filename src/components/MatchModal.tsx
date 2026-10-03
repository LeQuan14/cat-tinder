import { CSSProperties, useEffect, useRef } from 'react';
import type { CatProfile } from '../types';
import { CatSilhouette, HeartIcon } from './Icons';

type MatchModalProps = {
  profile: CatProfile;
  onClose: () => void;
  onViewStudio: () => void;
};

const CONFETTI_COUNT = 18;

export function MatchModal({ profile, onClose, onViewStudio }: MatchModalProps) {
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    primaryRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="match-backdrop" role="presentation" onClick={onClose}>
      <div className="confetti" aria-hidden="true">
        {Array.from({ length: CONFETTI_COUNT }, (_, i) => (
          <span key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>

      <section
        className="match-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="match-avatars">
          <div className="match-avatar match-avatar-you">You</div>
          <div className="match-heart">
            <HeartIcon />
          </div>
          <div className="match-avatar" style={{ background: profile.image }}>
            <CatSilhouette className="match-avatar-cat" />
          </div>
        </div>

        <h2 id="match-title" className="match-title">
          It's a match!
        </h2>
        <p className="match-copy">
          You and <strong>{profile.name}</strong> would absolutely share a window seat.
        </p>

        <div className="match-actions">
          <button ref={primaryRef} type="button" className="button button-primary button-block" onClick={onClose}>
            Keep swiping
          </button>
          <button type="button" className="button button-ghost button-block" onClick={onViewStudio}>
            Open profile studio
          </button>
        </div>
      </section>
    </div>
  );
}
