import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ProfileEditorPage } from './ProfileEditorPage';
import { CatSilhouette, CloseIcon, HeartIcon, SparkIcon } from './components/Icons';
import { MatchModal } from './components/MatchModal';
import { SwipeDeck } from './components/SwipeDeck';
import { Toast, ToastMessage } from './components/Toast';
import { TopBar } from './components/TopBar';
import type {
  AppView,
  CatProfile,
  MatchHistoryEntry,
  ProfileFormState,
  SwipeDirection,
  SwipeHistoryEntry,
  Theme,
} from './types';

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

const MATCH_REVEAL_DELAY = 380;
const THEME_STORAGE_KEY = 'cat-tinder-theme';

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

const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

function formatRelativeTime(value: string) {
  const date = new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];

  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeTimeFormat.format(Math.round(seconds / size), unit);
    }
  }

  return 'just now';
}

function getViewFromPath(pathname: string): AppView {
  return pathname === '/profile' || pathname === '/profile/' ? 'profile-editor' : 'deck';
}

function getInitialTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Storage can be unavailable (private mode); fall back to the OS preference.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function App() {
  const [profiles, setProfiles] = useState<CatProfile[]>([]);
  const [swipeHistory, setSwipeHistory] = useState<SwipeHistoryEntry[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryEntry[]>([]);
  const [totals, setTotals] = useState({ swipes: 0, matches: 0 });
  const [index, setIndex] = useState(0);
  const [matchProfile, setMatchProfile] = useState<CatProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [editorMode, setEditorMode] = useState<'edit' | 'new'>('edit');
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileFormState>(emptyProfileForm);
  const [currentView, setCurrentView] = useState<AppView>(() => getViewFromPath(window.location.pathname));
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const remainingProfiles = profiles.slice(index);
  const profilesById = useMemo(() => new Map(profiles.map((profile) => [profile.id, profile])), [profiles]);

  const showToast = useCallback((message: string, tone: ToastMessage['tone'] = 'success') => {
    setToast({ id: Date.now(), message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);
  const closeMatch = useCallback(() => setMatchProfile(null), []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures; the theme still applies for this visit.
    }
  }, [theme]);

  async function loadProfiles(keepDeckProfileId?: number | null) {
    setLoadingProfiles(true);
    setLoadError(null);

    try {
      const response = await fetch('/api/profiles');

      if (!response.ok) {
        throw new Error(`Failed to load profiles (${response.status})`);
      }

      const data = (await response.json()) as { profiles: CatProfile[] };
      const nextProfiles = data.profiles;

      setProfiles(nextProfiles);

      if (keepDeckProfileId !== undefined && keepDeckProfileId !== null) {
        const nextIndex = nextProfiles.findIndex((profile) => profile.id === keepDeckProfileId);
        setIndex(nextIndex >= 0 ? nextIndex : 0);
      } else {
        setIndex((current) => Math.min(current, nextProfiles.length));
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Failed to load profiles');
    } finally {
      setLoadingProfiles(false);
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch('/api/history');

      if (!response.ok) {
        throw new Error(`Failed to load history (${response.status})`);
      }

      const data = (await response.json()) as {
        swipes: SwipeHistoryEntry[];
        matches: MatchHistoryEntry[];
        totals?: { swipes: number; matches: number };
      };

      setSwipeHistory(data.swipes);
      setMatchHistory(data.matches);
      setTotals(data.totals ?? { swipes: data.swipes.length, matches: data.matches.length });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    void Promise.all([loadProfiles(), loadHistory()]);
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
      if (!loadingProfiles) {
        setSelectedProfileId(null);
        setProfileDraft(emptyProfileForm);
        setEditorMode('new');
      }
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
  }, [profiles, editorMode, selectedProfileId, loadingProfiles]);

  function handleSwipe(profile: CatProfile, direction: SwipeDirection) {
    // Advance optimistically so the deck feels instant; the server call runs in the background.
    setIndex((current) => current + 1);

    if (direction === 'right') {
      window.setTimeout(() => setMatchProfile(profile), MATCH_REVEAL_DELAY);
    }

    void (async () => {
      try {
        const response = await fetch('/api/swipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: profile.id, direction }),
        });

        if (!response.ok) {
          throw new Error(`Failed to record swipe (${response.status})`);
        }

        await loadHistory();
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to record swipe', 'error');
      }
    })();
  }

  function handleStartOver() {
    setIndex(0);
    setMatchProfile(null);
  }

  function navigateToView(nextView: AppView) {
    const nextPath = nextView === 'profile-editor' ? '/profile' : '/';

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setMatchProfile(null);
    setCurrentView(nextView);
    window.scrollTo({ top: 0 });
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

    const deletedName = profilesById.get(selectedProfileId)?.name ?? 'Profile';
    setSavingProfile(true);

    try {
      const response = await fetch(`/api/profiles/${selectedProfileId}`, {
        method: 'DELETE',
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete profile (${response.status})`);
      }

      setSelectedProfileId(null);
      setEditorMode('edit');
      await loadProfiles(remainingProfiles[0]?.id ?? null);
      showToast(`${deletedName} was removed`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);

    const isEditingExistingProfile = editorMode === 'edit' && selectedProfileId !== null;

    try {
      const response = await fetch(
        isEditingExistingProfile ? `/api/profiles/${selectedProfileId}` : '/api/profiles',
        {
          method: isEditingExistingProfile ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileDraft),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to save profile (${response.status})`);
      }

      const data = (await response.json()) as { profile: CatProfile };
      setEditorMode('edit');
      setSelectedProfileId(data.profile.id);
      setProfileDraft(profileToForm(data.profile));
      await loadProfiles(remainingProfiles[0]?.id ?? data.profile.id);
      showToast(isEditingExistingProfile ? `Saved changes to ${data.profile.name}` : `${data.profile.name} joined the deck`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  }

  const recentSwipes = swipeHistory.slice(0, 6);
  const seenCount = Math.min(index, profiles.length);

  return (
    <div className="app">
      <TopBar
        view={currentView}
        theme={theme}
        onNavigate={navigateToView}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />

      {currentView === 'profile-editor' ? (
        <ProfileEditorPage
          profiles={profiles}
          editorMode={editorMode}
          selectedProfileId={selectedProfileId}
          profileDraft={profileDraft}
          loadingProfiles={loadingProfiles}
          savingProfile={savingProfile}
          error={loadError}
          onSelectProfile={handleSelectProfile}
          onNewProfile={handleNewProfile}
          onDeleteProfile={handleDeleteProfile}
          onSaveProfile={handleSaveProfile}
          onUpdateDraft={setProfileDraft}
          onBackToDeck={() => navigateToView('deck')}
        />
      ) : (
        <main className="discover">
          <section className="discover-main">
            <div className="discover-heading">
              <div>
                <p className="eyebrow">
                  <SparkIcon /> Discover
                </p>
                <h1>
                  Find your <span className="gradient-text">purr-fect</span> match
                </h1>
              </div>

              {profiles.length > 0 ? (
                <div className="deck-progress" aria-label={`${seenCount} of ${profiles.length} cats seen`}>
                  <span>
                    {seenCount}/{profiles.length}
                  </span>
                  <div className="deck-progress-track">
                    <div
                      className="deck-progress-bar"
                      style={{ width: `${(seenCount / profiles.length) * 100}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {loadError ? (
              <div className="deck-error" role="alert">
                <h3>We couldn't reach the cat database</h3>
                <p>{loadError}</p>
                <button type="button" className="button button-primary" onClick={() => void loadProfiles()}>
                  Try again
                </button>
              </div>
            ) : (
              <SwipeDeck
                profiles={remainingProfiles}
                loading={loadingProfiles}
                disabled={matchProfile !== null}
                onSwipe={handleSwipe}
                onReset={handleStartOver}
              />
            )}
          </section>

          <aside className="discover-side">
            <div className="stat-row">
              <div className="stat">
                <strong>{loadingProfiles ? '–' : profiles.length}</strong>
                <span>Cats</span>
              </div>
              <div className="stat">
                <strong>{loadingHistory ? '–' : totals.swipes}</strong>
                <span>Swipes</span>
              </div>
              <div className="stat stat-accent">
                <strong>{loadingHistory ? '–' : totals.matches}</strong>
                <span>Matches</span>
              </div>
            </div>

            <section className="panel">
              <header className="panel-header">
                <h2>Matches</h2>
                {matchHistory.length > 0 ? <span className="count-pill">{totals.matches}</span> : null}
              </header>

              {matchHistory.length === 0 ? (
                <p className="panel-empty">No matches yet. Swipe right on a cat you like.</p>
              ) : (
                <ul className="match-strip">
                  {matchHistory.slice(0, 8).map((entry) => {
                    const profile = entry.profileId !== null ? profilesById.get(entry.profileId) : undefined;

                    return (
                      <li key={entry.id} title={`${entry.profileName} · ${formatRelativeTime(entry.createdAt)}`}>
                        <div className="avatar avatar-lg" style={profile ? { background: profile.image } : undefined}>
                          <CatSilhouette className="avatar-cat" />
                        </div>
                        <span>{entry.profileName}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="panel">
              <header className="panel-header">
                <h2>Recent activity</h2>
              </header>

              {recentSwipes.length === 0 ? (
                <p className="panel-empty">Your swipes will show up here.</p>
              ) : (
                <ul className="activity-list">
                  {recentSwipes.map((entry) => {
                    const profile = entry.profileId !== null ? profilesById.get(entry.profileId) : undefined;

                    return (
                      <li key={entry.id}>
                        <div className="avatar" style={profile ? { background: profile.image } : undefined}>
                          <CatSilhouette className="avatar-cat" />
                        </div>
                        <div className="activity-copy">
                          <strong>{entry.profileName}</strong>
                          <small>{formatRelativeTime(entry.createdAt)}</small>
                        </div>
                        <span className={`activity-badge ${entry.direction}`}>
                          {entry.direction === 'right' ? <HeartIcon /> : <CloseIcon />}
                          {entry.direction === 'right' ? 'Purr' : 'Pass'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className="panel panel-promo">
              <div>
                <h2>Know a cat who deserves the spotlight?</h2>
                <p>Create and fine-tune profiles in the studio.</p>
              </div>
              <button type="button" className="button button-light" onClick={() => navigateToView('profile-editor')}>
                Open studio
              </button>
            </section>
          </aside>
        </main>
      )}

      {matchProfile ? (
        <MatchModal
          profile={matchProfile}
          onClose={closeMatch}
          onViewStudio={() => navigateToView('profile-editor')}
        />
      ) : null}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
