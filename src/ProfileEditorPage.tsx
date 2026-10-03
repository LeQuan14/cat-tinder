import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { CatCard } from './components/CatCard';
import { ArrowLeftIcon, CatSilhouette, CloseIcon, PlusIcon, TrashIcon } from './components/Icons';
import type { CatProfile, ProfileFormState } from './types';

type ProfileEditorPageProps = {
  profiles: CatProfile[];
  editorMode: 'edit' | 'new';
  selectedProfileId: number | null;
  profileDraft: ProfileFormState;
  loadingProfiles: boolean;
  savingProfile: boolean;
  error: string | null;
  onSelectProfile: (profile: CatProfile) => void;
  onNewProfile: () => void;
  onDeleteProfile: () => void;
  onSaveProfile: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDraft: (updater: (current: ProfileFormState) => ProfileFormState) => void;
  onBackToDeck: () => void;
};

const PORTRAIT_PRESETS = [
  { name: 'Toffee', value: 'linear-gradient(135deg, #1d1a17 0%, #5b4633 45%, #f4d7b5 100%)' },
  { name: 'Midnight', value: 'linear-gradient(135deg, #0f172a 0%, #334155 55%, #dbeafe 100%)' },
  { name: 'Onyx', value: 'linear-gradient(135deg, #09090b 0%, #27272a 45%, #71717a 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #4338ca 0%, #f59e0b 50%, #fde68a 100%)' },
  { name: 'Peach', value: 'linear-gradient(135deg, #ff6b6b 0%, #ff9e7a 50%, #ffe0c2 100%)' },
  { name: 'Lagoon', value: 'linear-gradient(135deg, #064e3b 0%, #0d9488 50%, #a7f3d0 100%)' },
  { name: 'Lilac', value: 'linear-gradient(135deg, #3b0764 0%, #9333ea 50%, #f5d0fe 100%)' },
  { name: 'Ginger', value: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 50%, #fed7aa 100%)' },
];

function splitTraits(value: string) {
  return value
    .split(',')
    .map((trait) => trait.trim())
    .filter(Boolean);
}

export function ProfileEditorPage({
  profiles,
  editorMode,
  selectedProfileId,
  profileDraft,
  loadingProfiles,
  savingProfile,
  error,
  onSelectProfile,
  onNewProfile,
  onDeleteProfile,
  onSaveProfile,
  onUpdateDraft,
  onBackToDeck,
}: ProfileEditorPageProps) {
  const [query, setQuery] = useState('');
  const [traitInput, setTraitInput] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const traits = splitTraits(profileDraft.traits);
  const isNew = editorMode === 'new' || selectedProfileId === null;
  const busy = savingProfile || loadingProfiles;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredProfiles = normalizedQuery
    ? profiles.filter((profile) =>
        `${profile.name} ${profile.breed}`.toLowerCase().includes(normalizedQuery),
      )
    : profiles;

  useEffect(() => {
    setConfirmingDelete(false);
    setTraitInput('');
  }, [selectedProfileId, editorMode]);

  function updateField<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    onUpdateDraft((current) => ({ ...current, [key]: value }));
  }

  function setTraits(nextTraits: string[]) {
    updateField('traits', nextTraits.join(', '));
  }

  function addTrait(raw: string) {
    const additions = splitTraits(raw).filter(
      (trait) => !traits.some((existing) => existing.toLowerCase() === trait.toLowerCase()),
    );

    if (additions.length > 0) {
      setTraits([...traits, ...additions]);
    }

    setTraitInput('');
  }

  function handleTraitKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTrait(traitInput);
    } else if (event.key === 'Backspace' && traitInput === '' && traits.length > 0) {
      setTraits(traits.slice(0, -1));
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (traitInput.trim()) {
      // Fold any half-typed trait into the draft before saving.
      event.preventDefault();
      addTrait(traitInput);
      return;
    }

    onSaveProfile(event);
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }

    setConfirmingDelete(false);
    onDeleteProfile();
  }

  return (
    <main className="studio">
      <div className="studio-header">
        <div>
          <button type="button" className="back-link" onClick={onBackToDeck}>
            <ArrowLeftIcon /> Back to discover
          </button>
          <h1>Profile studio</h1>
          <p className="muted">Create new cats and polish existing profiles. Changes appear in the deck instantly.</p>
        </div>
      </div>

      {error ? (
        <div className="inline-alert" role="alert">
          <strong>Heads up.</strong> {error}
        </div>
      ) : null}

      <div className="studio-body">
        <aside className="studio-library panel">
          <button
            type="button"
            className={`library-item library-new ${isNew ? 'active' : ''}`}
            onClick={onNewProfile}
          >
            <span className="avatar avatar-plus">
              <PlusIcon />
            </span>
            <span className="library-copy">
              <strong>New cat</strong>
              <small>Start from scratch</small>
            </span>
          </button>

          <input
            type="search"
            className="library-search"
            placeholder="Search cats"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search cats"
          />

          <ul className="library-list">
            {filteredProfiles.map((profile) => (
              <li key={profile.id}>
                <button
                  type="button"
                  className={`library-item ${!isNew && selectedProfileId === profile.id ? 'active' : ''}`}
                  onClick={() => onSelectProfile(profile)}
                  aria-pressed={!isNew && selectedProfileId === profile.id}
                >
                  <span className="avatar" style={{ background: profile.image }}>
                    <CatSilhouette className="avatar-cat" />
                  </span>
                  <span className="library-copy">
                    <strong>{profile.name}</strong>
                    <small>{profile.breed}</small>
                  </span>
                </button>
              </li>
            ))}
            {filteredProfiles.length === 0 && !loadingProfiles ? (
              <li className="panel-empty">{profiles.length === 0 ? 'No cats yet.' : 'No cats match that search.'}</li>
            ) : null}
          </ul>
        </aside>

        <form className="studio-form panel" onSubmit={handleSubmit}>
          <header className="panel-header">
            <h2>{isNew ? 'Create a new cat' : `Editing ${profileDraft.name || 'cat'}`}</h2>
            {!isNew ? <span className="count-pill">#{selectedProfileId}</span> : null}
          </header>

          <fieldset className="form-section">
            <legend>Basics</legend>
            <div className="field-grid">
              <label className="field">
                <span>Name</span>
                <input value={profileDraft.name} onChange={(e) => updateField('name', e.target.value)} required />
              </label>
              <label className="field">
                <span>Age</span>
                <input value={profileDraft.age} onChange={(e) => updateField('age', e.target.value)} required />
              </label>
              <label className="field">
                <span>Breed</span>
                <input value={profileDraft.breed} onChange={(e) => updateField('breed', e.target.value)} required />
              </label>
              <label className="field">
                <span>Distance</span>
                <input
                  value={profileDraft.distance}
                  onChange={(e) => updateField('distance', e.target.value)}
                  required
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Personality</legend>
            <label className="field">
              <span>Vibe</span>
              <input
                value={profileDraft.vibe}
                onChange={(e) => updateField('vibe', e.target.value)}
                placeholder="One line that sums them up"
                required
              />
            </label>

            <label className="field">
              <span>
                Bio <em>{profileDraft.bio.length}/240</em>
              </span>
              <textarea
                rows={3}
                maxLength={240}
                value={profileDraft.bio}
                onChange={(e) => updateField('bio', e.target.value)}
                required
              />
            </label>

            <div className="field">
              <label htmlFor="trait-input">
                <span>Traits</span>
              </label>
              <div className="chip-input">
                {traits.map((trait, traitIndex) => (
                  <span key={`${trait}-${traitIndex}`} className="chip">
                    {trait}
                    <button
                      type="button"
                      aria-label={`Remove ${trait}`}
                      onClick={() => setTraits(traits.filter((_, i) => i !== traitIndex))}
                    >
                      <CloseIcon />
                    </button>
                  </span>
                ))}
                <input
                  id="trait-input"
                  value={traitInput}
                  onChange={(e) => setTraitInput(e.target.value)}
                  onKeyDown={handleTraitKeyDown}
                  onBlur={() => traitInput.trim() && addTrait(traitInput)}
                  placeholder={traits.length === 0 ? 'Curious, cuddly, chaotic…' : 'Add trait'}
                />
              </div>
              <small className="field-hint">Press Enter or comma to add. At least one trait is required.</small>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Portrait</legend>
            <div className="swatches" role="radiogroup" aria-label="Portrait presets">
              {PORTRAIT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  role="radio"
                  aria-checked={profileDraft.image === preset.value}
                  className={`swatch ${profileDraft.image === preset.value ? 'active' : ''}`}
                  style={{ background: preset.value }}
                  onClick={() => updateField('image', preset.value)}
                  title={preset.name}
                  aria-label={preset.name}
                />
              ))}
            </div>

            <details className="advanced">
              <summary>Custom CSS values</summary>
              <label className="field">
                <span>Portrait background</span>
                <input value={profileDraft.image} onChange={(e) => updateField('image', e.target.value)} required />
              </label>
              <label className="field">
                <span>Accent</span>
                <input value={profileDraft.accent} onChange={(e) => updateField('accent', e.target.value)} required />
              </label>
            </details>
          </fieldset>

          <div className="form-actions">
            {!isNew ? (
              <button
                type="button"
                className={`button button-danger ${confirmingDelete ? 'confirming' : ''}`}
                onClick={handleDelete}
                onBlur={() => setConfirmingDelete(false)}
                disabled={busy}
              >
                <TrashIcon /> {confirmingDelete ? 'Click again to delete' : 'Delete'}
              </button>
            ) : null}
            <button type="submit" className="button button-primary" disabled={busy || (traits.length === 0 && !traitInput.trim())}>
              {savingProfile ? 'Saving…' : isNew ? 'Create profile' : 'Save changes'}
            </button>
          </div>
        </form>

        <aside className="studio-preview">
          <p className="eyebrow">Live preview</p>
          <CatCard
            profile={{ ...profileDraft, traits }}
            badge={isNew ? 'New profile' : 'Editing'}
            className="is-preview"
          />
        </aside>
      </div>
    </main>
  );
}
