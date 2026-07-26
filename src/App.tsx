import { FormEvent, useEffect, useState } from 'react';
import { ProfileEditorPage } from './ProfileEditorPage';

type CatProfile = {
  id: number;
  name: string;
  age: string;
  breed: string;
  distance: string;
  vibe: string;
  bio: string;
  traits: string[];
  accent: string;
  image: string;
};

type SwipeHistoryEntry = {
  id: number;
  profileId: number | null;
  profileName: string;
  direction: 'left' | 'right';
  createdAt: string;
};

type MatchHistoryEntry = {
  id: number;
  profileId: number | null;
  profileName: string;
  createdAt: string;
};

type ProfileFormState = {
  name: string;
  age: string;
  breed: string;
  distance: string;
  vibe: string;
  bio: string;
  traits: string;
  accent: string;
  image: string;
};

type AppView = 'deck' | 'profile-editor';

const emptyProfileForm: ProfileFormState = {
  name: 'New Cat',
  age: '1 year',
  breed: 'Mixed',
  distance: '0 miles away',
  vibe: 'Ready to be adored',
  bio: 'A new cat profile waiting for a detailed personality.',
  traits: 'Playful, curious, snack-driven',
  accent: 'from-[#ffb36b] via-[#ffd6a5] to-[#fff1df]',
  image: 'linear-gradient(135deg, #1d1a17 0%, #5b4633 45%, #f4d7b5 100%)',
};

function profileToForm(profile: CatProfile): ProfileFormState {
  return {
    name: profile.name,
    age: profile.age,
    breed: profile.breed,
    distance: profile.distance,
    vibe: profile.vibe,
    bio: profile.bio,
    traits: profile.traits.join(', '),
    accent: profile.accent,
    image: profile.image,
  };
}

function formatTimestamp(value: string) {
  return new Date(value.replace(' ', 'T')).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getViewFromPath(pathname: string): AppView {
  return pathname === '/profile' || pathname === '/profile/' ? 'profile-editor' : 'deck';
}

function App() {
  const [profiles, setProfiles] = useState<CatProfile[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryEntry[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [likedCats, setLikedCats] = useState<CatProfile[]>([]);
  const [showMatch, setShowMatch] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'new'>('edit');
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileFormState>(emptyProfileForm);
  const [currentView, setCurrentView] = useState<AppView>(() => getViewFromPath(window.location.pathname));

  const currentProfile = profiles[index];
  const hasMoreProfiles = index < profiles.length;
  const isBusy = loadingProfiles || loadingHistory || savingProfile || swipeDirection !== null;

  async function loadProfiles(keepDeckProfileId?: number | null) {
    setLoadingProfiles(true);
    setError(null);

    try {
      const response = await fetch('/api/profiles');

      if (!response.ok) {
        throw new Error(`Failed to load profiles (${response.status})`);
      }

      const data = (await response.json()) as { profiles: CatProfile[] };
      const nextProfiles = data.profiles;

      setProfiles(nextProfiles);

      if (keepDeckProfileId !== undefined) {
        const nextIndex = nextProfiles.findIndex((profile) => profile.id === keepDeckProfileId);
        setIndex(nextIndex >= 0 ? nextIndex : 0);
      } else {
        setIndex((current) => {
          if (nextProfiles.length === 0) {
            return 0;
          }

          return Math.min(current, nextProfiles.length - 1);
        });
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load profiles');
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    setError(null);

    try {
      const response = await fetch('/api/history');

      if (!response.ok) {
        throw new Error(`Failed to load history (${response.status})`);
      }

      const data = (await response.json()) as {
        swipes: SwipeHistoryEntry[];
        matches: MatchHistoryEntry[];
      };

      setSwipeHistory(data.swipes);
      setMatchHistory(data.matches);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load history');
    } finally {
      setLoadingHistory(false);
    }
  }

  async function refreshDashboard(keepDeckProfileId?: number | null) {
    await Promise.all([loadProfiles(keepDeckProfileId), loadHistory()]);
  }

  useEffect(() => {
    void refreshDashboard();
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (editorMode === 'new') {
      return;
    }

    if (profiles.length === 0) {
      setSelectedProfileId(null);
      setProfileDraft(emptyProfileForm);
      setEditorMode('new');
      return;
    }

    const activeProfile =
      selectedProfileId !== null
        ? profiles.find((profile) => profile.id === selectedProfileId)
        : profiles[0];

    if (activeProfile) {
      if (selectedProfileId !== activeProfile.id) {
        setSelectedProfileId(activeProfile.id);
      }

      setProfileDraft(profileToForm(activeProfile));
    }
  }, [profiles, editorMode, selectedProfileId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!hasMoreProfiles || showMatch || isBusy || error) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        handleSwipe('left');
      }

      if (event.key === 'ArrowRight') {
        handleSwipe('right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMoreProfiles, showMatch, isBusy, error, index, currentProfile]);

  function handleSwipe(direction: 'left' | 'right') {
    if (!currentProfile || isBusy || error) {
      return;
    }

    setSwipeDirection(direction);
    setDragOffset(direction === 'left' ? -60 : 60);

    window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch('/api/swipes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              profileId: currentProfile.id,
              direction,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to record swipe (${response.status})`);
          }

          if (direction === 'right') {
            setLikedCats((current) => [currentProfile, ...current].slice(0, 3));
            setShowMatch(true);
          }

          setIndex((current) => current + 1);
          await loadHistory();
        } catch (swipeError) {
          setError(swipeError instanceof Error ? swipeError.message : 'Failed to record swipe');
        } finally {
          setSwipeDirection(null);
          setDragOffset(0);
        }
      })();
    }, 180);
  }

  function handleStartOver() {
    setIndex(0);
    setLikedCats([]);
    setShowMatch(false);
    setSwipeDirection(null);
    setDragOffset(0);
  }

  function navigateToView(nextView: AppView) {
    const nextPath = nextView === 'profile-editor' ? '/profile' : '/';
    window.history.pushState({}, '', nextPath);
    setCurrentView(nextView);
  }

  function handleSelectProfile(profile: CatProfile) {
    setEditorMode('edit');
    setSelectedProfileId(profile.id);
    setProfileDraft(profileToForm(profile));
  }

  function handleNewProfile() {
    setEditorMode('new');
    setSelectedProfileId(null);
    setProfileDraft(emptyProfileForm);
  }

  async function handleDeleteProfile() {
    if (selectedProfileId === null) {
      return;
    }

    setSavingProfile(true);
    setError(null);

    try {
      const response = await fetch(`/api/profiles/${selectedProfileId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete profile (${response.status})`);
      }

      setSelectedProfileId(null);
      setEditorMode('new');
      setProfileDraft(emptyProfileForm);
      await loadProfiles(currentProfile?.id ?? null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete profile');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);

    const payload = {
      ...profileDraft,
      traits: profileDraft.traits,
    };

    const isEditingExistingProfile = editorMode === 'edit' && selectedProfileId !== null;

    try {
      const response = await fetch(
        isEditingExistingProfile ? `/api/profiles/${selectedProfileId}` : '/api/profiles',
        {
          method: isEditingExistingProfile ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to save profile (${response.status})`);
      }

      const data = (await response.json()) as { profile: CatProfile };
      setEditorMode('edit');
      setSelectedProfileId(data.profile.id);
      setProfileDraft(profileToForm(data.profile));
      await loadProfiles(currentProfile?.id ?? data.profile.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  const recentMatches = matchHistory.slice(0, 3);
  const recentSwipes = swipeHistory.slice(0, 5);
  const historyIsEmpty = swipeHistory.length === 0 && matchHistory.length === 0;

  if (currentView === 'profile-editor') {
    return (
      <ProfileEditorPage
        profiles={profiles}
        editorMode={editorMode}
        selectedProfileId={selectedProfileId}
        profileDraft={profileDraft}
        loadingProfiles={loadingProfiles}
        savingProfile={savingProfile}
        error={error}
        onSelectProfile={handleSelectProfile}
        onNewProfile={handleNewProfile}
        onDeleteProfile={handleDeleteProfile}
        onSaveProfile={handleSaveProfile}
        onUpdateDraft={setProfileDraft}
        onBackToDeck={() => navigateToView('deck')}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-intro">
          <div className="eyebrow">Cat Tinder</div>
          <h1>Find the perfect purr-sonality match.</h1>
          <p className="hero-copy">
            Swipe through adoptable icons, compare their vibes, and match with the feline that fits your couch.
          </p>

          <div className="stats-grid">
            <article>
              <strong>{loadingProfiles ? '...' : profiles.length}</strong>
              <span>featured cats</span>
            </article>
            <article>
              <strong>{loadingHistory ? '...' : swipeHistory.length}</strong>
              <span>swipes saved</span>
            </article>
            <article>
              <strong>{loadingHistory ? '...' : matchHistory.length}</strong>
              <span>matches saved</span>
            </article>
          </div>

          <div className="liked-strip">
            <span>Recent matches</span>
            <div className="liked-avatars">
              {recentMatches.length === 0 ? (
                <p>{historyIsEmpty ? 'No history yet. Start swiping.' : 'No recent matches yet.'}</p>
              ) : (
                recentMatches.map((cat) => (
                  <div key={cat.id} className="liked-avatar" title={cat.profileName}>
                    {cat.profileName.slice(0, 1)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="management-stack">
          <section className="profile-hub-card">
            <div className="section-heading">
              <div>
                <p className="deck-label">Profile management</p>
                <h2>Open the dedicated studio for new cats and edits</h2>
              </div>
            </div>

            <p className="hub-copy">
              Keep the swipe experience focused while using a full page to create new profiles, update existing details, and keep your lineup polished.
            </p>

            <button type="button" className="primary-button" onClick={() => navigateToView('profile-editor')}>
              Open profile studio
            </button>
          </section>

          <section className="history-panel">
            <div className="section-heading">
              <div>
                <p className="deck-label">Saved history</p>
                <h2>Swipe and match timeline</h2>
              </div>
            </div>

            <div className="history-grid">
              <article className="history-card">
                <h3>Recent swipes</h3>
                {recentSwipes.length === 0 ? (
                  <p className="history-empty">No swipes recorded yet.</p>
                ) : (
                  <ul>
                    {recentSwipes.map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.profileName}</strong>
                        <span className={`direction-badge ${entry.direction}`}>{entry.direction}</span>
                        <small>{formatTimestamp(entry.createdAt)}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="history-card">
                <h3>Recent matches</h3>
                {matchHistory.length === 0 ? (
                  <p className="history-empty">No matches recorded yet.</p>
                ) : (
                  <ul>
                    {matchHistory.slice(0, 5).map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.profileName}</strong>
                        <span className="direction-badge right">matched</span>
                        <small>{formatTimestamp(entry.createdAt)}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </section>
        </div>
      </section>

      <section className="deck-panel">
        <div className="deck-header">
          <div>
            <p className="deck-label">Swipe deck</p>
            <h2>{loadingProfiles ? 'Loading cats from SQLite' : currentProfile ? 'Meet your next cat' : 'All cats have been viewed'}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={handleStartOver}>
            Reset
          </button>
        </div>

        <div className="card-stage" aria-live="polite">
          {error ? (
            <div className="empty-state">
              <h3>Could not update the cat database.</h3>
              <p>{error}</p>
            </div>
          ) : loadingProfiles ? (
            <div className="empty-state">
              <h3>Loading the litter.</h3>
              <p>Pulling profiles from SQLite now.</p>
            </div>
          ) : currentProfile ? (
            <article
              className={`cat-card ${swipeDirection ? `swipe-${swipeDirection}` : ''}`}
              style={{
                transform: `translateX(${dragOffset}px) rotate(${dragOffset / 18}deg)`,
              }}
            >
              <div className="card-portrait" style={{ background: currentProfile.image }}>
                <div className="portrait-glow" aria-hidden="true" />
                <div className="card-badge">Verified cuddler</div>
              </div>

              <div className="card-copy">
                <div className="profile-topline">
                  <div>
                    <h3>
                      {currentProfile.name} <span>{currentProfile.age}</span>
                    </h3>
                    <p>{currentProfile.breed}</p>
                  </div>
                  <div className="distance-chip">{currentProfile.distance}</div>
                </div>

                <p className="vibe">{currentProfile.vibe}</p>
                <p className="bio">{currentProfile.bio}</p>

                <div className="trait-list">
                  {currentProfile.traits.map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
                </div>
              </div>
            </article>
          ) : (
            <div className="empty-state">
              <h3>That is the whole litter for now.</h3>
              <p>Reset the deck to browse the cats again.</p>
            </div>
          )}
        </div>

        <div className="action-row">
          <button
            type="button"
            className="action-button nope"
            onClick={() => handleSwipe('left')}
            disabled={!currentProfile || isBusy || Boolean(error)}
          >
            Pass
          </button>
          <button
            type="button"
            className="action-button super"
            onClick={() => handleSwipe('right')}
            disabled={!currentProfile || isBusy || Boolean(error)}
          >
            Purr
          </button>
        </div>
      </section>

      {showMatch && likedCats[0] ? (
        <div className="match-backdrop" role="presentation" onClick={() => setShowMatch(false)}>
          <section
            className="match-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-title"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="match-kicker">It is a match</p>
            <h2 id="match-title">You and {likedCats[0].name} would absolutely share a window seat.</h2>
            <p>
              You just swiped right on a cat with premium nap energy. Keep going or reset the deck to discover
              more whiskered contenders.
            </p>

            <div className="match-actions">
              <button type="button" className="primary-button" onClick={() => setShowMatch(false)}>
                Keep swiping
              </button>
              <button type="button" className="ghost-button" onClick={handleStartOver}>
                Start over
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

export default App;
