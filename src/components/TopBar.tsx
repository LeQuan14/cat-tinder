import type { AppView, Theme } from '../types';
import { MoonIcon, PawIcon, SunIcon } from './Icons';

type TopBarProps = {
  view: AppView;
  theme: Theme;
  onNavigate: (view: AppView) => void;
  onToggleTheme: () => void;
};

export function TopBar({ view, theme, onNavigate, onToggleTheme }: TopBarProps) {
  return (
    <header className="topbar">
      <a
        href="/"
        className="brand"
        onClick={(event) => {
          event.preventDefault();
          onNavigate('deck');
        }}
      >
        <span className="brand-mark">
          <PawIcon />
        </span>
        <span className="brand-name">
          cat<strong>tinder</strong>
        </span>
      </a>

      <nav className="segmented" aria-label="Primary">
        <button
          type="button"
          className={view === 'deck' ? 'active' : ''}
          aria-current={view === 'deck' ? 'page' : undefined}
          onClick={() => onNavigate('deck')}
        >
          Discover
        </button>
        <button
          type="button"
          className={view === 'profile-editor' ? 'active' : ''}
          aria-current={view === 'profile-editor' ? 'page' : undefined}
          onClick={() => onNavigate('profile-editor')}
        >
          Studio
        </button>
      </nav>

      <button
        type="button"
        className="icon-button"
        onClick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
}
