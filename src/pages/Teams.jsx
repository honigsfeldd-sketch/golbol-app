import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, Pencil, X, User } from "lucide-react";

// Iron rules — constraints that must always be enforced
const MUST_SEPARATE = [
  // Ran and Tamir must NOT be on the same team
  ["Ran As", "Tamir Shrian"],
];
const MUST_TOGETHER = [
  // Eyal and Tamir must be on the same team (if both present)
  ["Eyal Tayar", "Tamir Shrian"],
];

function validateIronRules(teamA, teamB) {
  const nameInTeam = (name, team) => team.some(p => p.name === name);

  for (const [a, b] of MUST_SEPARATE) {
    if (nameInTeam(a, teamA) && nameInTeam(b, teamA)) return false;
    if (nameInTeam(a, teamB) && nameInTeam(b, teamB)) return false;
  }
  for (const [a, b] of MUST_TOGETHER) {
    const bothPresent = [...teamA, ...teamB].filter(p => p.name === a || p.name === b).length === 2;
    if (!bothPresent) continue;
    if (nameInTeam(a, teamA) && nameInTeam(b, teamB)) return false;
    if (nameInTeam(a, teamB) && nameInTeam(b, teamA)) return false;
  }
  return true;
}

function generateBalancedTeams(players) {
  const gks = players.filter(p => p.position === "GK");
  const rest = players.filter(p => p.position !== "GK");
  const sorted = [...rest].sort((a, b) => (b.rating || 5) - (a.rating || 5));

  const teamA = [];
  const teamB = [];
  let sumA = 0;
  let sumB = 0;

  // If there are 2+ GKs, put one in each team
  if (gks.length >= 2) {
    teamA.push(gks[0]); sumA += gks[0].rating || 5;
    teamB.push(gks[1]); sumB += gks[1].rating || 5;
    // Any remaining GKs go into the pool
    for (let i = 2; i < gks.length; i++) sorted.push(gks[i]);
  } else {
    // 0 or 1 GK — add to pool normally
    for (const gk of gks) sorted.push(gk);
    sorted.sort((a, b) => (b.rating || 5) - (a.rating || 5));
  }

  for (const player of sorted) {
    if (sumA <= sumB) { teamA.push(player); sumA += player.rating || 5; }
    else { teamB.push(player); sumB += player.rating || 5; }
  }

  // Fix iron rules by swapping players if needed
  const fixIronRules = () => {
    for (let attempt = 0; attempt < 50; attempt++) {
      if (validateIronRules(teamA, teamB)) return;

      // Find a violation and fix it
      for (const [a, b] of MUST_SEPARATE) {
        const aInA = teamA.findIndex(p => p.name === a);
        const bInA = teamA.findIndex(p => p.name === b);
        if (aInA >= 0 && bInA >= 0) {
          const swapIdx = teamB.findIndex(p => !isLocked(p));
          if (swapIdx >= 0) { const tmp = teamA[bInA]; teamA[bInA] = teamB[swapIdx]; teamB[swapIdx] = tmp; }
          continue;
        }
        const aInB = teamB.findIndex(p => p.name === a);
        const bInB = teamB.findIndex(p => p.name === b);
        if (aInB >= 0 && bInB >= 0) {
          const swapIdx = teamA.findIndex(p => !isLocked(p));
          if (swapIdx >= 0) { const tmp = teamB[bInB]; teamB[bInB] = teamA[swapIdx]; teamA[swapIdx] = tmp; }
        }
      }
      for (const [a, b] of MUST_TOGETHER) {
        const aInA = teamA.findIndex(p => p.name === a);
        const bInB = teamB.findIndex(p => p.name === b);
        if (aInA >= 0 && bInB >= 0) {
          const swapIdx = teamA.findIndex(p => !isLocked(p) && p.name !== a);
          if (swapIdx >= 0) { const tmp = teamB[bInB]; teamB[bInB] = teamA[swapIdx]; teamA[swapIdx] = tmp; }
          continue;
        }
        const aInB = teamB.findIndex(p => p.name === a);
        const bInA = teamA.findIndex(p => p.name === b);
        if (aInB >= 0 && bInA >= 0) {
          const swapIdx = teamB.findIndex(p => !isLocked(p) && p.name !== a);
          if (swapIdx >= 0) { const tmp = teamA[bInA]; teamA[bInA] = teamB[swapIdx]; teamB[swapIdx] = tmp; }
        }
      }
    }
  };

  // Players locked by iron rules should not be swapped
  const isLocked = (player) => {
    return [...MUST_SEPARATE, ...MUST_TOGETHER].some(
      ([a, b]) => player.name === a || player.name === b
    );
  };

  fixIronRules();

  if (teamA.length > 1 && teamB.length > 1) {
    // Random swap for variety — but never swap GKs or iron-rule-locked players
    const swappableA = teamA.filter(p => !(gks.length >= 2 && p.position === "GK") && !isLocked(p));
    const swappableB = teamB.filter(p => !(gks.length >= 2 && p.position === "GK") && !isLocked(p));
    if (swappableA.length && swappableB.length) {
      const pa = swappableA[Math.floor(Math.random() * swappableA.length)];
      const pb = swappableB[Math.floor(Math.random() * swappableB.length)];
      const diff = Math.abs((pa.rating || 5) - (pb.rating || 5));
      if (diff <= 2) {
        const ia = teamA.indexOf(pa);
        const ib = teamB.indexOf(pb);
        teamA[ia] = pb;
        teamB[ib] = pa;
      }
    }
  }

  return { teamA, teamB };
}

// ---------- FORMATIONS ----------
const FORMATIONS = {
  "1-3-3": {
    label: "1-3-3",
    slots: [
      { x: 50, y: 8 },
      { x: 18, y: 40 },
      { x: 50, y: 40 },
      { x: 82, y: 40 },
      { x: 18, y: 78 },
      { x: 50, y: 78 },
      { x: 82, y: 78 },
    ],
  },
  "1-3-1-2": {
    label: "1-3-1-2",
    slots: [
      { x: 50, y: 8 },
      { x: 18, y: 36 },
      { x: 50, y: 36 },
      { x: 82, y: 36 },
      { x: 50, y: 58 },
      { x: 33, y: 82 },
      { x: 67, y: 82 },
    ],
  },
  "1-4-1-1": {
    label: "1-4-1-1",
    slots: [
      { x: 50, y: 8 },
      { x: 10, y: 36 },
      { x: 36, y: 36 },
      { x: 64, y: 36 },
      { x: 90, y: 36 },
      { x: 50, y: 58 },
      { x: 50, y: 82 },
    ],
  },
  "1-2-3-1": {
    label: "1-2-3-1",
    slots: [
      { x: 50, y: 8 },
      { x: 30, y: 34 },
      { x: 70, y: 34 },
      { x: 18, y: 58 },
      { x: 50, y: 58 },
      { x: 82, y: 58 },
      { x: 50, y: 82 },
    ],
  },
};
const FORMATION_KEYS = Object.keys(FORMATIONS);
const FIELD_GREEN = "#00925B";
const FIELD_LINES = "#0E9E68";

function toAbsolute(slot, team) {
  if (team === "A") {
    return { x: slot.x, y: 3 + (slot.y / 100) * 43 };
  } else {
    return { x: slot.x, y: 97 - (slot.y / 100) * 43 };
  }
}

function getSlots(formationKey, teamSize, players) {
  const formation = FORMATIONS[formationKey];
  if (!formation) return [];

  const gkIdx = players ? players.findIndex(p => p.position === "GK") : -1;

  const slots = formation.slots.slice(0, teamSize);
  if (gkIdx >= 0 && slots.length > 0) {
    slots[0] = { x: 50, y: 6 };
  }

  const extras = [];
  for (let i = slots.length; i < teamSize; i++) {
    extras.push({
      x: 20 + ((i - slots.length) * 30) % 80,
      y: 65 + Math.floor((i - slots.length) / 3) * 12,
    });
  }
  return [...slots, ...extras];
}

function sortTeamGKFirst(team) {
  const sorted = [...team];
  const gkIdx = sorted.findIndex(p => p.position === "GK");
  if (gkIdx > 0) {
    const [gk] = sorted.splice(gkIdx, 1);
    sorted.unshift(gk);
  }
  return sorted;
}

// ---------- COMPONENTS ----------
function PlayerDot({ player, pctX, pctY, isBlack, isSelected, onTap }) {
  const imgSrc = isBlack && player.blackJerseyImage ? player.blackJerseyImage : player.image;

  return (
    <div
      style={{
        position: "absolute",
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 40 : 10,
        touchAction: "none",
        transition: "left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="cursor-pointer select-none"
      onClick={onTap}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: isSelected ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className={`w-[46px] h-[46px] rounded-full overflow-hidden shadow-md transition-shadow duration-200 ${
          isSelected ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent" : ""
        }`}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isBlack ? "bg-zinc-800" : "bg-white/30"}`}>
            <User className="w-4 h-4 text-white/70" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ---------- MAIN PAGE ----------
export default function Teams() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlayers = location.state?.selectedPlayers || [];
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [formationA, setFormationA] = useState("1-3-3");
  const [formationB, setFormationB] = useState("1-3-3");
  const [selected, setSelected] = useState(null); // { team, idx }
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!selectedPlayers.length) { navigate("/"); return; }
    const { teamA: a, teamB: b } = generateBalancedTeams(selectedPlayers);
    setTeamA(sortTeamGKFirst(a));
    setTeamB(sortTeamGKFirst(b));
  }, []);

  const handleShuffle = () => {
    const { teamA: a, teamB: b } = generateBalancedTeams(selectedPlayers);
    setTeamA(sortTeamGKFirst(a));
    setTeamB(sortTeamGKFirst(b));
    setShuffleKey(k => k + 1);
    setSelected(null);
  };

  const totalA = teamA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = teamB.reduce((s, p) => s + (p.rating || 5), 0);
  const diff = Math.abs(totalA - totalB);

  const slotsA = getSlots(formationA, teamA.length, teamA);
  const slotsB = getSlots(formationB, teamB.length, teamB);

  // Tap-to-swap on the pitch
  const handlePlayerTap = (team, idx) => {
    if (!selected) {
      setSelected({ team, idx });
      return;
    }
    if (selected.team === team && selected.idx === idx) {
      setSelected(null);
      return;
    }
    // Swap
    if (selected.team === team) {
      const setter = team === "A" ? setTeamA : setTeamB;
      setter(prev => {
        const next = [...prev];
        [next[selected.idx], next[idx]] = [next[idx], next[selected.idx]];
        return next;
      });
    } else {
      const fromArr = selected.team === "A" ? [...teamA] : [...teamB];
      const toArr = selected.team === "A" ? [...teamB] : [...teamA];
      const temp = fromArr[selected.idx];
      fromArr[selected.idx] = toArr[idx];
      toArr[idx] = temp;
      if (selected.team === "A") {
        setTeamA(fromArr);
        setTeamB(toArr);
      } else {
        setTeamB(fromArr);
        setTeamA(toArr);
      }
    }
    setSelected(null);
  };

  // Move player between teams in edit mode
  const movePlayer = (player, fromTeam) => {
    if (fromTeam === "A") {
      setTeamA(prev => sortTeamGKFirst(prev.filter(p => p.id !== player.id)));
      setTeamB(prev => sortTeamGKFirst([...prev, player]));
    } else {
      setTeamB(prev => sortTeamGKFirst(prev.filter(p => p.id !== player.id)));
      setTeamA(prev => sortTeamGKFirst([...prev, player]));
    }
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight">Match Day</h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pb-10 pt-6 space-y-4">
        {/* Compact score row */}
        <motion.div
          key={shuffleKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3"
        >
          <span className="text-sm font-semibold text-foreground/70">White</span>
          <span className="text-lg font-bold tabular-nums">{totalA}</span>
          <span className="text-xs text-muted-foreground/40">vs</span>
          <span className="text-lg font-bold tabular-nums">{totalB}</span>
          <span className="text-sm font-semibold text-foreground/70">Black</span>
          <button
            onClick={() => setEditMode(true)}
            className="ml-2 w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Pencil className="w-3.5 h-3.5 text-foreground/60" />
          </button>
        </motion.div>

        {/* Balance indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center"
        >
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${diff === 0 ? "bg-primary/10 text-primary" : diff <= 3 ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${diff === 0 ? "bg-primary" : diff <= 3 ? "bg-yellow-500" : "bg-red-500"}`} />
            {diff === 0 ? "Perfectly balanced" : diff <= 3 ? `Diff: ${diff} pts` : `Diff: ${diff} pts — shuffle?`}
          </div>
        </motion.div>

        {/* PITCH with Lineup */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-2"
        >
          {/* Formation selector - White (above pitch) */}
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-1.5 shrink-0">White</span>
            {FORMATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setFormationA(key)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  formationA === key
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-400 active:text-zinc-600"
                }`}
              >
                {FORMATIONS[key].label}
              </button>
            ))}
          </div>

          {/* The pitch */}
          <div
            className="relative w-full rounded-3xl overflow-hidden"
            style={{
              aspectRatio: "10 / 14",
              background: FIELD_GREEN,
            }}
          >
            {/* Grass stripes */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
              backgroundImage: `repeating-linear-gradient(180deg, transparent 0%, transparent 7.14%, rgba(255,255,255,0.5) 7.14%, rgba(255,255,255,0.5) 14.28%)`,
            }} />

            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 420" preserveAspectRatio="none">
              <rect x="12" y="12" width="276" height="396" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
              <line x1="12" y1="210" x2="288" y2="210" stroke={FIELD_LINES} strokeWidth="2" />
              <circle cx="150" cy="210" r="42" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
              <circle cx="150" cy="210" r="3" fill={FIELD_LINES} />
              <rect x="72" y="12" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <rect x="108" y="12" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <circle cx="150" cy="56" r="2" fill={FIELD_LINES} />
              <rect x="72" y="350" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <rect x="108" y="382" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <circle cx="150" cy="364" r="2" fill={FIELD_LINES} />
              <path d="M12,22 A10,10 0 0,1 22,12" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M278,12 A10,10 0 0,1 288,22" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M12,398 A10,10 0 0,0 22,408" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M278,408 A10,10 0 0,0 288,398" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            </svg>

            {/* Swap hint */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-3 left-0 right-0 z-[60] flex justify-center"
                >
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                    Tap another player to swap
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Team A (White) — top half */}
            {slotsA.map((slot, idx) => {
              const player = teamA[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "A");
              return (
                <PlayerDot
                  key={`a-${player.id}-${shuffleKey}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={false}
                  isSelected={selected?.team === "A" && selected?.idx === idx}
                  onTap={() => handlePlayerTap("A", idx)}
                />
              );
            })}

            {/* Team B (Black) — bottom half */}
            {slotsB.map((slot, idx) => {
              const player = teamB[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "B");
              return (
                <PlayerDot
                  key={`b-${player.id}-${shuffleKey}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={true}
                  isSelected={selected?.team === "B" && selected?.idx === idx}
                  onTap={() => handlePlayerTap("B", idx)}
                />
              );
            })}
          </div>

          {/* Formation selector - Black (below pitch) */}
          <div className="bg-zinc-900/80 rounded-2xl px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mr-1.5 shrink-0">Black</span>
            {FORMATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setFormationB(key)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  formationB === key
                    ? "bg-white/20 text-white"
                    : "text-white/35 active:text-white/70"
                }`}
              >
                {FORMATIONS[key].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleShuffle}
            className="flex-1 h-14 rounded-2xl bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/schedule", { state: { teamA, teamB, selectedPlayers } })}
            className="flex-1 h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center font-semibold text-sm"
          >
            Save Teams
          </motion.button>
        </div>
      </div>

      {/* Edit Teams Modal */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setEditMode(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="text-base font-semibold">Edit Teams</h2>
                <button
                  onClick={() => setEditMode(false)}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Two columns */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* White team */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      White ({teamA.length})
                    </div>
                    <div className="space-y-1.5">
                      {teamA.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => movePlayer(player, "A")}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/60 active:bg-secondary transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                            {player.image ? (
                              <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{player.nickname || player.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Black team */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Black ({teamB.length})
                    </div>
                    <div className="space-y-1.5">
                      {teamB.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => movePlayer(player, "B")}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-secondary/60 active:bg-secondary transition-colors text-left"
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                            {player.blackJerseyImage || player.image ? (
                              <img src={player.blackJerseyImage || player.image} alt={player.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-3.5 h-3.5 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium truncate">{player.nickname || player.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Done button */}
              <div className="px-5 py-4 border-t border-border/40">
                <button
                  onClick={() => setEditMode(false)}
                  className="w-full h-12 rounded-2xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
