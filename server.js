import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import Database from 'better-sqlite3';
import express from 'express';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 4173);
const databasePath = path.join(__dirname, 'data', 'cats.db');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const seedProfiles = [
  {
    name: 'Mochi',
    age: '2 years',
    breed: 'Scottish Fold',
    distance: '1 mile away',
    vibe: 'Gentle house royalty',
    bio: 'Enjoys soft blankets, high windows, and being admired at a safe distance.',
    traits: ['Quiet', 'Curious', 'Treat motivated'],
    accent: 'from-[#ffb36b] via-[#ffd6a5] to-[#fff1df]',
    image: 'linear-gradient(135deg, #1d1a17 0%, #5b4633 45%, #f4d7b5 100%)',
  },
  {
    name: 'Luna',
    age: '3 years',
    breed: 'Siamese',
    distance: '3 miles away',
    vibe: 'Late-night chatterbox',
    bio: 'Looking for another cat who can keep up with midnight zoomies and window patrols.',
    traits: ['Talkative', 'Athletic', 'Affectionate'],
    accent: 'from-[#7cc8ff] via-[#b7e3ff] to-[#eaf7ff]',
    image: 'linear-gradient(135deg, #0f172a 0%, #334155 55%, #dbeafe 100%)',
  },
  {
    name: 'Sable',
    age: '4 years',
    breed: 'Bombay',
    distance: '2 miles away',
    vibe: 'Minimalist with strong opinions',
    bio: 'Prefers elegant snacks, dramatic pauses, and perfectly aligned sunbeams.',
    traits: ['Independent', 'Stylish', 'Confident'],
    accent: 'from-[#8f7cff] via-[#c5bbff] to-[#efeaff]',
    image: 'linear-gradient(135deg, #09090b 0%, #27272a 45%, #71717a 100%)',
  },
  {
    name: 'Pebble',
    age: '1 year',
    breed: 'Tabby',
    distance: '5 miles away',
    vibe: 'Chaos in a tiny package',
    bio: 'Will inspect every bag, box, and shoelace before approving the household.',
    traits: ['Playful', 'Fast', 'Fearless'],
    accent: 'from-[#ff7d7d] via-[#ffc48c] to-[#fff1db]',
    image: 'linear-gradient(135deg, #4338ca 0%, #f59e0b 50%, #fde68a 100%)',
  },
];

const database = new Database(databasePath);
database.pragma('journal_mode = WAL');
database.exec(`
  CREATE TABLE IF NOT EXISTS cat_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age TEXT NOT NULL,
    breed TEXT NOT NULL,
    distance TEXT NOT NULL,
    vibe TEXT NOT NULL,
    bio TEXT NOT NULL,
    traits TEXT NOT NULL,
    accent TEXT NOT NULL,
    image TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS swipe_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    profile_name TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('left', 'right')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS match_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER,
    profile_name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

const count = database.prepare('SELECT COUNT(*) AS count FROM cat_profiles').get();

if (count.count === 0) {
  const insert = database.prepare(
    'INSERT INTO cat_profiles (name, age, breed, distance, vibe, bio, traits, accent, image) VALUES (@name, @age, @breed, @distance, @vibe, @bio, @traits, @accent, @image)',
  );

  const seed = database.transaction((profiles) => {
    for (const profile of profiles) {
      insert.run({
        ...profile,
        traits: JSON.stringify(profile.traits),
      });
    }
  });

  seed(seedProfiles);
}

function parseTraits(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function serializeProfile(profile) {
  return {
    ...profile,
    traits: JSON.parse(profile.traits),
  };
}

function readProfiles() {
  return database.prepare('SELECT * FROM cat_profiles ORDER BY id ASC').all().map(serializeProfile);
}

function readSwipeHistory(limit = 20) {
  return database
    .prepare(
      `
        SELECT id, profile_id AS profileId, profile_name AS profileName, direction, created_at AS createdAt
        FROM swipe_history
        ORDER BY id DESC
        LIMIT ?
      `,
    )
    .all(limit);
}

function readMatchHistory(limit = 20) {
  return database
    .prepare(
      `
        SELECT id, profile_id AS profileId, profile_name AS profileName, created_at AS createdAt
        FROM match_history
        ORDER BY id DESC
        LIMIT ?
      `,
    )
    .all(limit);
}

function readHistoryTotals() {
  const swipes = database.prepare('SELECT COUNT(*) AS count FROM swipe_history').get().count;
  const matches = database.prepare('SELECT COUNT(*) AS count FROM match_history').get().count;
  return { swipes, matches };
}

function getProfileById(id) {
  const profile = database.prepare('SELECT * FROM cat_profiles WHERE id = ?').get(id);
  return profile ? serializeProfile(profile) : null;
}

function readProfilePayload(body) {
  const payload = body ?? {};
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const age = typeof payload.age === 'string' ? payload.age.trim() : '';
  const breed = typeof payload.breed === 'string' ? payload.breed.trim() : '';
  const distance = typeof payload.distance === 'string' ? payload.distance.trim() : '';
  const vibe = typeof payload.vibe === 'string' ? payload.vibe.trim() : '';
  const bio = typeof payload.bio === 'string' ? payload.bio.trim() : '';
  const accent = typeof payload.accent === 'string' ? payload.accent.trim() : '';
  const image = typeof payload.image === 'string' ? payload.image.trim() : '';
  const traits = parseTraits(payload.traits);

  if (!name || !age || !breed || !distance || !vibe || !bio || !accent || !image || traits.length === 0) {
    return null;
  }

  return {
    name,
    age,
    breed,
    distance,
    vibe,
    bio,
    accent,
    image,
    traits,
  };
}

function createProfile(profile) {
  const statement = database.prepare(
    'INSERT INTO cat_profiles (name, age, breed, distance, vibe, bio, traits, accent, image) VALUES (@name, @age, @breed, @distance, @vibe, @bio, @traits, @accent, @image)',
  );

  const result = statement.run({
    ...profile,
    traits: JSON.stringify(profile.traits),
  });

  return getProfileById(result.lastInsertRowid);
}

function updateProfile(id, profile) {
  database
    .prepare(
      `
        UPDATE cat_profiles
        SET name = @name,
            age = @age,
            breed = @breed,
            distance = @distance,
            vibe = @vibe,
            bio = @bio,
            traits = @traits,
            accent = @accent,
            image = @image
        WHERE id = @id
      `,
    )
    .run({
      id,
      ...profile,
      traits: JSON.stringify(profile.traits),
    });

  return getProfileById(id);
}

function deleteProfile(id) {
  return database.prepare('DELETE FROM cat_profiles WHERE id = ?').run(id);
}

function recordSwipe(profile, direction) {
  const timestamp = new Date().toISOString();
  const swipeResult = database
    .prepare('INSERT INTO swipe_history (profile_id, profile_name, direction, created_at) VALUES (?, ?, ?, ?)')
    .run(profile.id, profile.name, direction, timestamp);

  let match = null;

  if (direction === 'right') {
    const matchResult = database
      .prepare('INSERT INTO match_history (profile_id, profile_name, created_at) VALUES (?, ?, ?)')
      .run(profile.id, profile.name, timestamp);

    match = {
      id: Number(matchResult.lastInsertRowid),
      profileId: profile.id,
      profileName: profile.name,
      createdAt: timestamp,
    };
  }

  return {
    swipe: {
      id: Number(swipeResult.lastInsertRowid),
      profileId: profile.id,
      profileName: profile.name,
      direction,
      createdAt: timestamp,
    },
    match,
  };
}

async function start() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api/profiles', (_request, response) => {
    response.json({ profiles: readProfiles() });
  });

  app.get('/api/history', (_request, response) => {
    response.json({ swipes: readSwipeHistory(), matches: readMatchHistory(), totals: readHistoryTotals() });
  });

  app.post('/api/profiles', (request, response) => {
    const profile = readProfilePayload(request.body);

    if (!profile) {
      response.status(400).json({ error: 'Invalid profile payload.' });
      return;
    }

    const createdProfile = createProfile(profile);
    response.status(201).json({ profile: createdProfile });
  });

  app.put('/api/profiles/:id', (request, response) => {
    const profileId = Number(request.params.id);

    if (!Number.isInteger(profileId)) {
      response.status(400).json({ error: 'Invalid profile id.' });
      return;
    }

    const profile = readProfilePayload(request.body);

    if (!profile) {
      response.status(400).json({ error: 'Invalid profile payload.' });
      return;
    }

    if (!getProfileById(profileId)) {
      response.status(404).json({ error: 'Profile not found.' });
      return;
    }

    const updatedProfile = updateProfile(profileId, profile);
    response.json({ profile: updatedProfile });
  });

  app.delete('/api/profiles/:id', (request, response) => {
    const profileId = Number(request.params.id);

    if (!Number.isInteger(profileId)) {
      response.status(400).json({ error: 'Invalid profile id.' });
      return;
    }

    const result = deleteProfile(profileId);

    if (result.changes === 0) {
      response.status(404).json({ error: 'Profile not found.' });
      return;
    }

    response.status(204).end();
  });

  app.post('/api/swipes', (request, response) => {
    const profileId = Number(request.body?.profileId);
    const direction = request.body?.direction;

    if (!Number.isInteger(profileId) || (direction !== 'left' && direction !== 'right')) {
      response.status(400).json({ error: 'Invalid swipe payload.' });
      return;
    }

    const profile = getProfileById(profileId);

    if (!profile) {
      response.status(404).json({ error: 'Profile not found.' });
      return;
    }

    const result = recordSwipe(profile, direction);
    response.status(201).json(result);
  });

  if (!isProduction) {
    const vite = await createViteServer({
      appType: 'custom',
      server: {
        middlewareMode: true,
      },
    });

    app.use(vite.middlewares);

    app.use(async (request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api')) {
        next();
        return;
      }

      try {
        const url = request.originalUrl;
        let template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        response.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (error) {
        vite.ssrFixStacktrace(error);
        response.status(500).end(error instanceof Error ? error.message : 'Server error');
      }
    });
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));

    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api')) {
        next();
        return;
      }

      response.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`Cat Tinder running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});