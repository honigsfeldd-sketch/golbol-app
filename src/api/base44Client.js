// Supabase-based data layer (replaces localStorage)
import { supabase } from '@/lib/supabase';
import { players as seedPlayers } from '@/data/players';

// ---------- SEEDING ----------
// Seed players into Supabase if the table is empty
let _seeded = false;
async function ensureSeeded() {
  if (_seeded) return;
  _seeded = true;

  const { count } = await supabase
    .from('players')
    .select('*', { count: 'exact', head: true });

  if (count === 0) {
    // Insert all seed players
    const rows = seedPlayers.map(p => ({
      id: p.id,
      name: p.name,
      nickname: p.nickname || null,
      nickname_aliases: p.nicknameAliases || [],
      position: p.position || null,
      rating: p.rating || 5,
      image: p.image || null,
      black_jersey_image: p.blackJerseyImage || null,
    }));
    const { error } = await supabase.from('players').insert(rows);
    if (error) console.error('Seed error:', error);
  }
}

// ---------- HELPERS ----------
// Convert DB row (snake_case) → app object (camelCase)
function rowToPlayer(row) {
  return {
    id: String(row.id),
    name: row.name,
    nickname: row.nickname || '',
    nicknameAliases: row.nickname_aliases || [],
    position: row.position || '',
    rating: row.rating || 5,
    image: row.image || '',
    blackJerseyImage: row.black_jersey_image || null,
  };
}

// Convert app object (camelCase) → DB row (snake_case)
function playerToRow(data) {
  const row = {};
  if ('name' in data) row.name = data.name;
  if ('nickname' in data) row.nickname = data.nickname || null;
  if ('nicknameAliases' in data) row.nickname_aliases = data.nicknameAliases || [];
  if ('position' in data) row.position = data.position || null;
  if ('rating' in data) row.rating = data.rating || 5;
  if ('image' in data) row.image = data.image || null;
  if ('blackJerseyImage' in data) row.black_jersey_image = data.blackJerseyImage || null;
  return row;
}

// ---------- PLAYER API ----------
export const base44 = {
  entities: {
    Player: {
      async list(sortBy = 'name') {
        await ensureSeeded();
        const { data, error } = await supabase
          .from('players')
          .select('*')
          .order(sortBy === 'name' ? 'name' : sortBy, { ascending: true });
        if (error) { console.error('List error:', error); return []; }
        return data.map(rowToPlayer);
      },
      async create(playerData) {
        await ensureSeeded();
        const row = playerToRow(playerData);
        if (playerData.name) row.name = playerData.name;

        // Get next available id (sequence may be out of sync after seeding)
        const { data: maxRow } = await supabase
          .from('players')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        row.id = (maxRow?.id || 0) + 1;

        const { data, error } = await supabase
          .from('players')
          .insert([row])
          .select()
          .single();
        if (error) { console.error('Create error:', error); throw error; }
        return rowToPlayer(data);
      },
      async update(id, playerData) {
        const row = playerToRow(playerData);
        const { data, error } = await supabase
          .from('players')
          .update(row)
          .eq('id', Number(id))
          .select()
          .single();
        if (error) { console.error('Update error:', error); throw error; }
        return rowToPlayer(data);
      },
      async delete(id) {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', Number(id));
        if (error) { console.error('Delete error:', error); throw error; }
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

// ---------- MATCH HISTORY API ----------
export const matchHistory = {
  async list() {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { console.error('Match list error:', error); return []; }
    return data.map(row => ({
      id: row.id,
      date: row.date,
      time: row.time,
      teamA: row.team_a || [],
      teamB: row.team_b || [],
      scoreWhite: row.score_white,
      scoreBlack: row.score_black,
      mvp: row.mvp,
    }));
  },

  async get(matchId) {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();
    if (error) { console.error('Match get error:', error); return null; }
    return {
      id: data.id,
      date: data.date,
      time: data.time,
      teamA: data.team_a || [],
      teamB: data.team_b || [],
      scoreWhite: data.score_white,
      scoreBlack: data.score_black,
      mvp: data.mvp,
    };
  },

  async save(match) {
    const row = {
      id: match.id || Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      date: match.date || null,
      time: match.time || null,
      team_a: match.teamA || [],
      team_b: match.teamB || [],
      score_white: match.scoreWhite || 0,
      score_black: match.scoreBlack || 0,
      mvp: match.mvp || null,
    };
    const { error } = await supabase.from('matches').insert([row]);
    if (error) { console.error('Match save error:', error); throw error; }
    return row.id;
  },

  async delete(matchId) {
    const { error } = await supabase
      .from('matches')
      .delete()
      .eq('id', matchId);
    if (error) { console.error('Match delete error:', error); throw error; }
  },

  async deleteAll() {
    const { error } = await supabase
      .from('matches')
      .delete()
      .neq('id', '');
    if (error) { console.error('Match deleteAll error:', error); throw error; }
  },

  async getPlayerStats(playerId) {
    const matches = await this.list();
    let total = 0, wins = 0, draws = 0, losses = 0, goals = 0, mvps = 0;
    const matchHistory = [];

    for (const match of matches) {
      const inA = match.teamA?.find(p => String(p.id) === String(playerId));
      const inB = match.teamB?.find(p => String(p.id) === String(playerId));
      if (!inA && !inB) continue;

      total++;
      const playerGoals = (inA?.goals || inB?.goals || 0);
      goals += playerGoals;

      const sW = match.scoreWhite || 0;
      const sB = match.scoreBlack || 0;
      const onWhite = !!inA;
      const myScore = onWhite ? sW : sB;
      const theirScore = onWhite ? sB : sW;

      if (myScore > theirScore) wins++;
      else if (myScore === theirScore) draws++;
      else losses++;

      if (match.mvp && String(match.mvp.id) === String(playerId)) mvps++;

      matchHistory.push({
        matchId: match.id,
        date: match.date,
        team: onWhite ? 'White' : 'Black',
        scoreWhite: sW,
        scoreBlack: sB,
        goals: playerGoals,
        result: myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D',
      });
    }

    return { matches: total, wins, draws, losses, goals, mvps, matchHistory };
  }
};

// ---------- UPCOMING MATCH API ----------
export const upcomingMatch = {
  async get() {
    const { data, error } = await supabase
      .from('upcoming_match')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null; // no rows
      console.error('Upcoming match get error:', error);
      return null;
    }
    return {
      id: data.id,
      teamA: data.team_a || [],
      teamB: data.team_b || [],
      date: data.date || null,
      time: data.time || null,
      lastUpdated: data.last_updated || data.created_at,
    };
  },

  async save({ teamA, teamB, date, time }) {
    // Delete any existing upcoming match first
    await supabase.from('upcoming_match').delete().neq('id', 0);

    const row = {
      team_a: teamA,
      team_b: teamB,
      date: date || null,
      time: time || null,
      last_updated: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('upcoming_match')
      .insert([row])
      .select()
      .single();
    if (error) { console.error('Upcoming match save error:', error); throw error; }
    return data.id;
  },

  async update(id, updates) {
    const row = {};
    if ('teamA' in updates) row.team_a = updates.teamA;
    if ('teamB' in updates) row.team_b = updates.teamB;
    if ('date' in updates) row.date = updates.date;
    if ('time' in updates) row.time = updates.time;
    row.last_updated = new Date().toISOString();

    const { error } = await supabase
      .from('upcoming_match')
      .update(row)
      .eq('id', id);
    if (error) { console.error('Upcoming match update error:', error); throw error; }
  },

  async clear() {
    const { error } = await supabase
      .from('upcoming_match')
      .delete()
      .neq('id', 0);
    if (error) { console.error('Upcoming match clear error:', error); throw error; }
  },
};
