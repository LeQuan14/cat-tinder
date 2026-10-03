export type CatProfile = {
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

export type SwipeDirection = 'left' | 'right';

export type SwipeHistoryEntry = {
  id: number;
  profileId: number | null;
  profileName: string;
  direction: SwipeDirection;
  createdAt: string;
};

export type MatchHistoryEntry = {
  id: number;
  profileId: number | null;
  profileName: string;
  createdAt: string;
};

export type ProfileFormState = {
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

export type AppView = 'deck' | 'profile-editor';

export type Theme = 'light' | 'dark';
