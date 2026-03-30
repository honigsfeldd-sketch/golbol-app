import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, User, Trophy, Check, Star } from "lucide-react";
import { matchHistory } from "../api/base44Client";

const LOCATION = "גולבול, אוניברסיטת תל אביב";

// ---------- FORMATIONS (same as Upcoming) ----------
const FORMATIONS = {
  "1-3-3": {
    label: "1-3-3",
    slots: [
      { x: 50, y: 6 },
      { x: 18, y: 36 }, { x: 50, y: 36 }, { x: 82, y: 36 },
      { x: 18, y: 70 }, { x: 50, y: 70 }, { x: 82, y: 70 },
    ],
  },
  "1-3-1-2": {
    label: "1-3-1-2",
    slots: [
      { x: 50, y: 6 },
      { x: 18, y: 32 }, { x: 50, y: 32 }, { x: 82, y: 32 },
      { x: 50, y: 55 },
      { x: 33, y: 78 }, { x: 67, y: 78 },
    ],
  },
  "1-4-1-1": {
    label: "1-4-1-1",
    slots: [
      { x: 50, y: 6 },
      { x: 12, y: 34 }, { x: 37, y: 34 }, { x: 63, y: 34 }, { x: 88, y: 34 },
      { x: 50, y: 56 },
      { x: 50, y: 78 },
    ],
  },
  "1-2-3-1": {
    label: "1-2-3-1",
    slots: [
      { x: 50, y: 6 },
      { x: 30, y: 30 }, { x: 70, y: 30 },
      { x: 18, y: 55 }, { x: 50, y: 55 }, { x: 82, y: 55 },
      { x: 50, y: 78 },
    ],
  },
};
const FORMATION_KEYS = Object.keys(FORMATIONS);
const FIELD_GREEN = "#00925B";
const FIELD_LINES = "#0E9E68";

function toAbsolute(slot, team) {
  if (team === "A") {
    return { x: slot.x, y: 4 + (slot.y / 100) * 43 };
  } else {
    return { x: slot.x, y: 96 - (slot.y / 100) * 43 };
  }
}

function getSlots(formationKey, teamSize, players) {
  const formation = FORMATIONS[formationKey];
  if (!formation) return [];
  const gkIdx = players ? players.findIndex(p => p.position === "GK") : -1;
  const slots = formation.slots.slice(0, teamSize);
  if (gkIdx >= 0 && slots.length > 0) {
    slots[0] = { x: 50, y: 4 };
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

// ---------- PLAYER DOT (with goal badge) ----------
function PlayerDot({ player, pctX, pctY, isBlack, goalCount, onTap, onLongPress }) {
  const imgSrc = isBlack && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  const timerRef = useRef(null);

  const handlePointerDown = () => {
    timerRef.current = setTimeout(() => { onLongPress(); timerRef.current = "fired"; }, 500);
  };
  const handlePointerUp = () => {
    if (timerRef.current === "fired") { timerRef.current = null; return; }
    clearTimeout(timerRef.current);
    timerRef.current = null;
    onTap();
  };

  return (
    <div
      style={{
        position: "absolute",
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10,
        touchAction: "none",
      }}
      className="cursor-pointer select-none"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => clearTimeout(timerRef.current)}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className="relative"
      >
        <div className={`w-[56px] h-[56px] rounded-full overflow-hidden shadow-md ${
          goalCount > 0 ? "ring-2 ring-yellow-400" : ""
        }`}>
          {imgSrc ? (
            <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" draggable={false} />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${isBlack ? "bg-zinc-800" : "bg-white/30"}`}>
              <User className="w-4 h-4 text-white/70" />
            </div>
          )}
        </div>
        {/* Goal badge */}
        <AnimatePresence>
          {goalCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] rounded-full bg-yellow-400 flex items-center justify-center px-1"
            >
              <span className="text-[10px] font-bold text-black">{goalCount}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ---------- MVP SELECTOR ----------
function MvpPlayerRow({ player, isSelected, onSelect, isBlack }) {
  const imgSrc = isBlack && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(player.id)}
      className={`flex items-center gap-2.5 py-2 px-1 rounded-xl transition-colors ${
        isSelected ? "bg-yellow-500/10" : "active:bg-secondary/50"
      }`}
    >
      <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 transition-colors ${
        isSelected ? "border-yellow-400" : "border-transparent"
      }`}>
        {imgSrc ? (
          <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className="text-[12px] font-medium text-foreground/80 truncate flex-1 text-left">
        {player.name.split(" ")[0]}
      </span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Trophy className="w-3.5 h-3.5 text-yellow-500" />
        </motion.div>
      )}
    </motion.button>
  );
}

function MvpSelector({ teamA, teamB, mvpId, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-semibold">Man of the Match</span>
      </div>

      {/* Two column layout */}
      <div className="flex gap-4">
        {/* White column */}
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1 block">White</span>
          {teamA.map(p => (
            <MvpPlayerRow key={p.id} player={p} isSelected={mvpId === p.id} onSelect={onSelect} isBlack={false} />
          ))}
        </div>

        {/* Divider */}
        <div className="w-px bg-border/30" />

        {/* Black column */}
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1 block">Black</span>
          {teamB.map(p => (
            <MvpPlayerRow key={p.id} player={p} isSelected={mvpId === p.id} onSelect={onSelect} isBlack={true} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN ----------
export default function PostMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    teamA: initA = [], teamB: initB = [], date, time,
    formationA: initFormA = "1-3-3", formationB: initFormB = "1-3-3",
  } = location.state || {};

  const lineupA = sortTeamGKFirst(initA);
  const lineupB = sortTeamGKFirst(initB);
  const [formationA] = useState(initFormA);
  const [formationB] = useState(initFormB);

  const [goals, setGoals] = useState({});
  const [mvpId, setMvpId] = useState(null);
  const [saved, setSaved] = useState(false);

  const addGoal = (playerId) => {
    setGoals(prev => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
  };
  const removeGoal = (playerId) => {
    setGoals(prev => {
      const c = prev[playerId] || 0;
      if (c <= 0) return prev;
      return { ...prev, [playerId]: c - 1 };
    });
  };

  const whiteGoals = lineupA.reduce((s, p) => s + (goals[p.id] || 0), 0);
  const blackGoals = lineupB.reduce((s, p) => s + (goals[p.id] || 0), 0);
  const allPlayers = [...lineupA, ...lineupB];

  const displayDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
    : "—";
  const displayTime = time
    ? new Date(`2000-01-01T${time}`).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const handleSave = async () => {
    const mvpPlayer = allPlayers.find(p => p.id === mvpId);
    const match = {
      id: Date.now().toString(36),
      date, time,
      teamA: lineupA.map(p => ({ id: p.id, name: p.name, image: p.image, position: p.position, rating: p.rating, goals: goals[p.id] || 0 })),
      teamB: lineupB.map(p => ({ id: p.id, name: p.name, image: p.image, blackJerseyImage: p.blackJerseyImage, position: p.position, rating: p.rating, goals: goals[p.id] || 0 })),
      scoreWhite: whiteGoals,
      scoreBlack: blackGoals,
      mvp: mvpPlayer ? { id: mvpPlayer.id, name: mvpPlayer.name, image: mvpPlayer.image } : null,
    };
    try {
      await matchHistory.save(match);
    } catch (err) {
      console.error('Failed to save match:', err);
    }
    setSaved(true);
    setTimeout(() => navigate("/history"), 1200);
  };

  const slotsA = getSlots(formationA, lineupA.length, lineupA);
  const slotsB = getSlots(formationB, lineupB.length, lineupB);

  if (!initA.length && !initB.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No match data</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm font-medium underline">Go home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground/70" />
          </button>
          <span className="text-sm font-semibold">Post Match</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-32">

        {/* Match info (date, time, location) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="pt-2 mb-4"
        >
          <div className="flex items-center justify-center gap-6 px-1">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Date</span>
              <span className="text-[12px] font-medium text-foreground/80">{displayDate}</span>
            </div>
            <div className="w-px h-6 bg-border/40" />
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Kick-off</span>
              <span className="text-[12px] font-medium text-foreground/80">{displayTime}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 justify-center">
            <MapPin className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/50">{LOCATION}</span>
          </div>
        </motion.div>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-border/60 mb-4" />

        {/* Score display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between px-6 mb-4"
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">White</span>
            <motion.span
              key={whiteGoals}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-5xl font-light tabular-nums"
            >
              {whiteGoals}
            </motion.span>
          </div>
          <span className="text-lg font-light text-muted-foreground/30">—</span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Black</span>
            <motion.span
              key={blackGoals}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="text-5xl font-light tabular-nums"
            >
              {blackGoals}
            </motion.span>
          </div>
        </motion.div>

        {/* Instructions */}
        <p className="text-[11px] text-muted-foreground/40 text-center mb-3">
          Tap player to add goal · Long press to remove
        </p>

        {/* PITCH with goal tracking */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="space-y-2"
        >
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

            {/* Team A (White) */}
            {slotsA.map((slot, idx) => {
              const player = lineupA[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "A");
              return (
                <PlayerDot
                  key={`a-${player.id}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={false}
                  goalCount={goals[player.id] || 0}
                  onTap={() => addGoal(player.id)}
                  onLongPress={() => removeGoal(player.id)}
                />
              );
            })}

            {/* Team B (Black) */}
            {slotsB.map((slot, idx) => {
              const player = lineupB[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "B");
              return (
                <PlayerDot
                  key={`b-${player.id}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={true}
                  goalCount={goals[player.id] || 0}
                  onTap={() => addGoal(player.id)}
                  onLongPress={() => removeGoal(player.id)}
                />
              );
            })}
          </div>
        </motion.div>

        {/* MVP Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <div className="border-t border-dashed border-border/60 pt-6">
            <MvpSelector
              teamA={lineupA}
              teamB={lineupB}
              mvpId={mvpId}
              onSelect={(id) => setMvpId(prev => prev === id ? null : id)}
            />
          </div>
        </motion.div>

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <AnimatePresence mode="wait">
            {saved ? (
              <motion.div
                key="saved"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-14 rounded-2xl bg-green-500 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Saved!</span>
              </motion.div>
            ) : (
              <motion.button
                key="save"
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center font-semibold text-sm"
              >
                Save Match
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
