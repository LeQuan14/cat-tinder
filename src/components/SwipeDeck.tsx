import { CSSProperties, PointerEvent, useEffect, useRef, useState } from 'react';
import type { CatProfile, SwipeDirection } from '../types';
import { CatCard } from './CatCard';
import { CloseIcon, HeartIcon, PawIcon, RefreshIcon } from './Icons';

type SwipeDeckProps = {
  profiles: CatProfile[];
  loading: boolean;
  disabled: boolean;
  onSwipe: (profile: CatProfile, direction: SwipeDirection) => void;
  onReset: () => void;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
};

type ExitingCard = {
  profile: CatProfile;
  direction: SwipeDirection;
  fromX: number;
  fromY: number;
};

const SWIPE_THRESHOLD = 110;
const STACK_SIZE = 3;

export function SwipeDeck({ profiles, loading, disabled, onSwipe, onReset }: SwipeDeckProps) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const [exiting, setExiting] = useState<ExitingCard | null>(null);
  const topProfile = profiles[0];
  const canSwipe = Boolean(topProfile) && !disabled;

  const commitSwipe = (direction: SwipeDirection, fromX = 0, fromY = 0) => {
    if (!topProfile || disabled) {
      return;
    }

    setExiting({ profile: topProfile, direction, fromX, fromY });
    setDrag(null);
    onSwipe(topProfile, direction);
  };

  // Keep the latest commit handler reachable from the window listener without re-binding every render.
  const commitRef = useRef(commitSwipe);
  commitRef.current = commitSwipe;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        commitRef.current('left');
      } else if (event.key === 'ArrowRight') {
        commitRef.current('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canSwipe || event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: 0, y: 0 });
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    setDrag({ ...drag, x: event.clientX - drag.startX, y: event.clientY - drag.startY });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    if (Math.abs(drag.x) > SWIPE_THRESHOLD) {
      commitSwipe(drag.x > 0 ? 'right' : 'left', drag.x, drag.y);
    } else {
      setDrag(null);
    }
  }

  const dragX = drag?.x ?? 0;
  const dragY = drag?.y ?? 0;
  const progress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1);
  const likeOpacity = dragX > 0 ? Math.min(dragX / SWIPE_THRESHOLD, 1) : 0;
  const nopeOpacity = dragX < 0 ? Math.min(-dragX / SWIPE_THRESHOLD, 1) : 0;
  const stack = profiles.slice(0, STACK_SIZE);

  return (
    <div className="deck">
      <div className="deck-stage" aria-live="polite">
        {loading ? (
          <div className="card-skeleton" aria-label="Loading cats">
            <div className="skeleton-shimmer" />
          </div>
        ) : stack.length === 0 && !exiting ? (
          <div className="deck-empty">
            <div className="deck-empty-icon">
              <PawIcon />
            </div>
            <h3>You've met every cat</h3>
            <p>New whiskers arrive daily. Reshuffle the deck to take another look.</p>
            <button type="button" className="button button-primary" onClick={onReset}>
              <RefreshIcon /> Reshuffle deck
            </button>
          </div>
        ) : null}

        {!loading
          ? stack
              .map((profile, position) => {
                const isTop = position === 0;
                // Cards behind the top one grow into place as the top card is dragged away.
                const depth = isTop ? 0 : Math.max(position - progress, 0);
                const style: CSSProperties = isTop
                  ? {
                      transform: `translate3d(${dragX}px, ${dragY * 0.4}px, 0) rotate(${dragX / 16}deg)`,
                      zIndex: STACK_SIZE,
                    }
                  : {
                      transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.05})`,
                      zIndex: STACK_SIZE - position,
                    };

                return (
                  <div
                    key={profile.id}
                    className={`deck-card ${isTop ? 'is-top' : ''} ${isTop && drag ? 'is-dragging' : ''}`}
                    style={style}
                    onPointerDown={isTop ? handlePointerDown : undefined}
                    onPointerMove={isTop ? handlePointerMove : undefined}
                    onPointerUp={isTop ? handlePointerUp : undefined}
                    onPointerCancel={isTop ? () => setDrag(null) : undefined}
                    aria-hidden={!isTop}
                  >
                    <CatCard
                      profile={profile}
                      badge={isTop ? 'Verified cuddler' : undefined}
                      overlay={
                        isTop ? (
                          <>
                            <span className="stamp stamp-like" style={{ opacity: likeOpacity }}>
                              Purr
                            </span>
                            <span className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>
                              Nope
                            </span>
                          </>
                        ) : null
                      }
                    />
                  </div>
                );
              })
              .reverse()
          : null}

        {exiting ? (
          <div
            key={`exit-${exiting.profile.id}`}
            className={`deck-card is-exiting exit-${exiting.direction}`}
            style={
              {
                '--from-x': `${exiting.fromX}px`,
                '--from-y': `${exiting.fromY * 0.4}px`,
                '--from-r': `${exiting.fromX / 16}deg`,
                zIndex: STACK_SIZE + 1,
              } as CSSProperties
            }
            onAnimationEnd={() => setExiting(null)}
            aria-hidden="true"
          >
            <CatCard
              profile={exiting.profile}
              overlay={
                <span className={`stamp ${exiting.direction === 'right' ? 'stamp-like' : 'stamp-nope'}`}>
                  {exiting.direction === 'right' ? 'Purr' : 'Nope'}
                </span>
              }
            />
          </div>
        ) : null}
      </div>

      <div className="deck-actions">
        <button
          type="button"
          className="round-button round-small"
          onClick={onReset}
          aria-label="Reshuffle deck"
          title="Reshuffle deck"
        >
          <RefreshIcon />
        </button>
        <button
          type="button"
          className="round-button round-nope"
          onClick={() => commitSwipe('left')}
          disabled={!canSwipe}
          aria-label="Pass"
          title="Pass (←)"
        >
          <CloseIcon />
        </button>
        <button
          type="button"
          className="round-button round-like"
          onClick={() => commitSwipe('right')}
          disabled={!canSwipe}
          aria-label="Purr"
          title="Purr (→)"
        >
          <HeartIcon />
        </button>
        <div className="round-spacer" aria-hidden="true" />
      </div>

      <p className="deck-hint">
        Drag the card or use <kbd>←</kbd> <kbd>→</kbd>
      </p>
    </div>
  );
}
