// Local storage-based replacement for Base44 SDK
import { players as seedPlayers } from '@/data/players';

const STORAGE_KEY = 'golbol_players';
const SEEDED_KEY = 'golbol_seeded';

function getPlayers() {
  // Seed on first load
  if (!localStorage.getItem(SEEDED_KEY)) {
    const seeded = seedPlayers.map((p, i) => ({ ...p, id: String(p.id || i + 1) }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    localStorage.setItem(SEEDED_KEY, 'true');
    return seeded;
  }
  const data = localStorage.getItem(STORAGE_KEY);
  let players = data ? JSON.parse(data) : [];

  // Merge nicknames from seed data — versioned so updates apply
  const NICK_VERSION = '3';
  const NICK_KEY = 'golbol_nicknames_v';
  if (localStorage.getItem(NICK_KEY) !== NICK_VERSION) {
    const seedMap = Object.fromEntries(seedPlayers.map(p => [String(p.id), { nickname: p.nickname, nicknameAliases: p.nicknameAliases }]));
    players = players.map(p => {
      const seed = seedMap[String(p.id)];
      if (!seed) return p;
      return { ...p, nickname: seed.nickname || p.nickname || "", nicknameAliases: seed.nicknameAliases || [] };
    });
    savePlayers(players);
    localStorage.setItem(NICK_KEY, NICK_VERSION);
  }

  // === PRODUCTION RESET — 2026-03-30 ===
  // One-time migration: clear all test/demo match history and stats.
  // Player records, ratings, and profiles are preserved.
  const PROD_RESET_KEY = 'golbol_prod_reset';
  const PROD_RESET_VERSION = '1';
  if (localStorage.getItem(PROD_RESET_KEY) !== PROD_RESET_VERSION) {
    localStorage.removeItem('golbol_match_history');
    // Zero out any stat fields stored directly on player objects
    const STAT_FIELDS = ['games', 'wins', 'draws', 'losses', 'goals', 'assists', 'mvps', 'motm', 'cleanSheets', 'matchesPlayed', 'goalsScored', 'manOfTheMatch', 'winRate'];
    players = players.map(p => {
      const cleaned = { ...p };
      for (const field of STAT_FIELDS) {
        if (field in cleaned) cleaned[field] = 0;
      }
      return cleaned;
    });
    savePlayers(players);
    localStorage.setItem(PROD_RESET_KEY, PROD_RESET_VERSION);
  }

  // Merge black jersey images from seed data — versioned
  const BJI_VERSION = '3';
  const BJI_KEY = 'golbol_bji_v';
  if (localStorage.getItem(BJI_KEY) !== BJI_VERSION) {
    // Match by id OR by name (in case ids differ)
    const seedById = Object.fromEntries(seedPlayers.map(p => [String(p.id), p]));
    const seedByName = Object.fromEntries(seedPlayers.map(p => [p.name, p]));
    players = players.map(p => {
      const seed = seedById[String(p.id)] || seedByName[p.name];
      if (seed?.blackJerseyImage) return { ...p, blackJerseyImage: seed.blackJerseyImage };
      return p;
    });
    savePlayers(players);
    localStorage.setItem(BJI_KEY, BJI_VERSION);
  }

  return players;
}

function savePlayers(players) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const base44 = {
  entities: {
    Player: {
      async list(sortBy = 'name') {
        const players = getPlayers();
        if (sortBy) {
          players.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            return typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal;
          });
        }
        return players;
      },
      async create(data) {
        const players = getPlayers();
        const player = { id: generateId(), ...data };
        players.push(player);
        savePlayers(players);
        return player;
      },
      async update(id, data) {
        const players = getPlayers();
        const idx = players.findIndex(p => p.id === id);
        if (idx !== -1) {
          players[idx] = { ...players[idx], ...data };
          savePlayers(players);
          return players[idx];
        }
        throw new Error('Player not found');
      },
      async delete(id) {
        const players = getPlayers().filter(p => p.id !== id);
        savePlayers(players);
      }
    }
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({ file_url: e.target.result });
          };
          reader.readAsDataURL(file);
        });
      }
    }
  }
};
