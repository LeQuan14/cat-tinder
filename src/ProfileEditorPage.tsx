import { FormEvent } from 'react';

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
  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  return (
    <main className="profile-page-shell">
      <section className="profile-page-panel">
        <div className="profile-page-header">
          <div>
            <p className="deck-label">Profile studio</p>
            <h1>Create or refine your cat lineup</h1>
            <p className="hero-copy">
              Build fresh profiles, tweak existing details, and keep the swipe deck feeling current without leaving this dedicated workspace.
            </p>
          </div>

          <div className="page-actions">
            <button type="button" className="ghost-button" onClick={onBackToDeck}>
              Back to deck
            </button>
            <button type="button" className="primary-button" onClick={onNewProfile}>
              New cat
            </button>
          </div>
        </div>

        {error ? (
          <div className="inline-alert" role="alert">
            <strong>Heads up.</strong> {error}
          </div>
        ) : null}

        <div className="profile-page-body">
          <section className="editor-panel profile-page-editor">
            <div className="section-heading">
              <div>
                <p className="deck-label">Profile editor</p>
                <h2>{editorMode === 'new' ? 'Create a new cat' : 'Edit an existing cat'}</h2>
              </div>
            </div>

            <div className="profile-library">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`profile-chip ${selectedProfileId === profile.id && editorMode === 'edit' ? 'active' : ''}`}
                  onClick={() => onSelectProfile(profile)}
                >
                  <strong>{profile.name}</strong>
                  <span>{profile.breed}</span>
                </button>
              ))}
            </div>

            <form className="profile-form" onSubmit={onSaveProfile}>
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={profileDraft.name}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, name: event.target.value }))}
                    required
                  />
                </label>

                <label className="field">
                  <span>Age</span>
                  <input
                    value={profileDraft.age}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, age: event.target.value }))}
                    required
                  />
                </label>

                <label className="field">
                  <span>Breed</span>
                  <input
                    value={profileDraft.breed}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, breed: event.target.value }))}
                    required
                  />
                </label>

                <label className="field">
                  <span>Distance</span>
                  <input
                    value={profileDraft.distance}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, distance: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Vibe</span>
                <input
                  value={profileDraft.vibe}
                  onChange={(event) => onUpdateDraft((current) => ({ ...current, vibe: event.target.value }))}
                  required
                />
              </label>

              <label className="field">
                <span>Bio</span>
                <textarea
                  rows={3}
                  value={profileDraft.bio}
                  onChange={(event) => onUpdateDraft((current) => ({ ...current, bio: event.target.value }))}
                  required
                />
              </label>

              <div className="field-grid">
                <label className="field">
                  <span>Traits</span>
                  <input
                    value={profileDraft.traits}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, traits: event.target.value }))}
                    placeholder="Curious, cuddly, chaotic"
                    required
                  />
                </label>

                <label className="field">
                  <span>Accent</span>
                  <input
                    value={profileDraft.accent}
                    onChange={(event) => onUpdateDraft((current) => ({ ...current, accent: event.target.value }))}
                    required
                  />
                </label>
              </div>

              <label className="field">
                <span>Portrait gradient</span>
                <input
                  value={profileDraft.image}
                  onChange={(event) => onUpdateDraft((current) => ({ ...current, image: event.target.value }))}
                  required
                />
              </label>

              <div className="editor-actions">
                <button type="submit" className="primary-button" disabled={savingProfile || loadingProfiles}>
                  {savingProfile ? 'Saving...' : editorMode === 'new' ? 'Create profile' : 'Save changes'}
                </button>
                <button
                  type="button"
                  className="ghost-button danger"
                  onClick={onDeleteProfile}
                  disabled={savingProfile || loadingProfiles || editorMode === 'new' || selectedProfileId === null}
                >
                  Delete profile
                </button>
              </div>
            </form>
          </section>

          <aside className="profile-preview-card">
            <div className="profile-preview-portrait" style={{ background: profileDraft.image }}>
              <div className="portrait-glow" aria-hidden="true" />
              <div className="card-badge">{selectedProfile ? 'Editing profile' : 'New profile'}</div>
            </div>

            <div className="profile-preview-copy">
              <p className="deck-label">Preview</p>
              <h3>{profileDraft.name}</h3>
              <p>{profileDraft.vibe}</p>
              <p className="preview-bio">{profileDraft.bio}</p>
              <div className="trait-list">
                {profileDraft.traits
                  .split(',')
                  .map((trait) => trait.trim())
                  .filter(Boolean)
                  .map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
