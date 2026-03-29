import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, User } from "lucide-react";

// ---------- FORMATION DEFINITIONS ----------
// Positions are [x%, y%] within the team's own half (0,0 = goal line center-left, 100,100 = midfield right)
// These will be mapped to absolute pitch coordinates

const FORMATIONS = {
  "1-3-3": {
    label: "1-3-3",
    slots: [
      { x: 50, y: 8 },
      { x: 20, y: 38 },
      { x: 50, y: 38 },
      { x: 80, y: 38 },
      { x: 20, y: 72 },
      { x: 50, y: 72 },
      { x: 80, y: 72 },
    ],
  },
  "1-3-1-2": {
    label: "1-3-1-2",
    slots: [
      { x: 50, y: 8 },
      { x: 20, y: 35 },
      { x: 50, y: 35 },
      { x: 80, y: 35 },
      { x: 50, y: 56 },
      { x: 35, y: 78 },
      { x: 65, y: 78 },
    ],
  },
  "1-4-1-1": {
    label: "1-4-1-1",
    slots: [
      { x: 50, y: 8 },
      { x: 15, y: 35 },
      { x: 38, y: 35 },
      { x: 62, y: 35 },
      { x: 85, y: 35 },
      { x: 50, y: 56 },
      { x: 50, y: 78 },
    ],
  },
  "1-2-3-1": {
    label: "1-2-3-1",
    slots: [
      { x: 50, y: 8 },
      { x: 30, y: 33 },
      { x: 70, y: 33 },
      { x: 20, y: 56 },
      { x: 50, y: 56 },
      { x: 80, y: 56 },
      { x: 50, y: 80 },
    ],
  },
};

const FORMATION_KEYS = Object.keys(FORMATIONS);
const FIELD_GREEN = "#00925B";
const FIELD_LINES = "#0E9E68";

// Map a slot from team-half coordinates to absolute pitch %
// Team A (white) is top half: y goes from 2% (goal) to 48% (midfield)
// Team B (black) is bottom half: y goes from 98% (goal) to 52% (midfield) — inverted
function toAbsolute(slot, team) {
  if (team === "A") {
    return { x: slot.x, y: 2 + (slot.y / 100) * 46 };
  } else {
    return { x: slot.x, y: 98 - (slot.y / 100) * 46 };
  }
}

// ---------- PLAYER DOT ----------
function PlayerDot({ player, x, y, isBlack, isDragging, isDropTarget, isSelected, onPointerDown }) {
  const imgSrc = isBlack && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  const firstName = player.name.split(" ")[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 1.2 : isDropTarget ? 1.1 : isSelected ? 1.1 : 1,
        left: `${x}%`,
        top: `${y}%`,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      style={{
        position: "absolute",
        transform: "translate(-50%, -50%)",
        touchAction: "none",
        zIndex: isDragging ? 50 : isSelected ? 40 : 10,
      }}
      className="flex flex-col items-center gap-1 cursor-grab active:cursor-grabbing select-none"
      onPointerDown={onPointerDown}
    >
      <div
        className={`w-11 h-11 rounded-full overflow-hidden border-2 shadow-lg transition-all duration-150 ${
          isDragging ? "border-yellow-400 ring-2 ring-yellow-400/50" :
          isSelected ? "border-yellow-400 ring-2 ring-yellow-400/40" :
          isDropTarget ? "border-white ring-2 ring-white/60" :
          "border-white/50"
        }`}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isBlack ? "bg-zinc-800" : "bg-white/30"}`}>
            <User className="w-5 h-5 text-white/70" />
          </div>
        )}
      </div>
      <span className="text-[9px] font-bold text-white drop-shadow-md text-center max-w-[56px] truncate leading-none">
        {firstName}
      </span>
    </motion.div>
  );
}

// ---------- FORMATION SELECTOR ----------
function FormationSelector({ label, selected, onChange, colorScheme }) {
  const bg = colorScheme === "dark"
    ? "bg-zinc-900/80"
    : "bg-zinc-100";
  const textColor = colorScheme === "dark" ? "text-white/60" : "text-zinc-500";
  const activeBtn = colorScheme === "dark"
    ? "bg-white/20 text-white"
    : "bg-white text-zinc-900 shadow-sm";
  const inactiveBtn = colorScheme === "dark"
    ? "text-white/40 hover:text-white/70"
    : "text-zinc-400 hover:text-zinc-600";

  return (
    <div className={`flex items-center gap-1.5 px-3 py-2.5 rounded-2xl ${bg}`}>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${textColor} mr-1.5`}>{label}</span>
      {FORMATION_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
            selected === key ? activeBtn : inactiveBtn
          }`}
        >
          {FORMATIONS[key].label}
        </button>
      ))}
    </div>
  );
}

// ---------- MAIN LINEUP PAGE ----------
export default function Lineup() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamA = [], teamB = [], selectedPlayers = [], date, time } = location.state || {};

  const [formationA, setFormationA] = useState("1-3-3");
  const [formationB, setFormationB] = useState("1-3-3");
  const [lineupA, setLineupA] = useState([...teamA]);
  const [lineupB, setLineupB] = useState([...teamB]);

  // Tap-to-swap: first tap selects, second tap swaps
  const [selected, setSelected] = useState(null); // { team: "A"|"B", idx: number }

  const pitchRef = useRef(null);

  useEffect(() => {
    if (!teamA.length) { navigate("/"); return; }
  }, []);

  // Get formation slots for a team, padded if team is bigger than formation
  const getSlots = (formationKey, teamSize) => {
    const formation = FORMATIONS[formationKey];
    if (!formation) return [];
    const slots = formation.slots.slice(0, teamSize);
    const extras = [];
    for (let i = slots.length; i < teamSize; i++) {
      extras.push({
        x: 20 + ((i - slots.length) * 30) % 80,
        y: 65 + Math.floor((i - slots.length) / 3) * 12,
      });
    }
    return [...slots, ...extras];
  };

  const handlePlayerTap = (team, idx) => {
    if (!selected) {
      // First tap — select this player
      setSelected({ team, idx });
      return;
    }

    if (selected.team === team && selected.idx === idx) {
      // Tapped same player — deselect
      setSelected(null);
      return;
    }

    // Second tap — swap the two players
    if (selected.team === team) {
      // Same team swap
      const setter = team === "A" ? setLineupA : setLineupB;
      setter(prev => {
        const next = [...prev];
        [next[selected.idx], next[idx]] = [next[idx], next[selected.idx]];
        return next;
      });
    } else {
      // Cross-team swap
      const fromArr = selected.team === "A" ? [...lineupA] : [...lineupB];
      const toArr = selected.team === "A" ? [...lineupB] : [...lineupA];
      const temp = fromArr[selected.idx];
      fromArr[selected.idx] = toArr[idx];
      toArr[idx] = temp;
      if (selected.team === "A") {
        setLineupA(fromArr);
        setLineupB(toArr);
      } else {
        setLineupB(fromArr);
        setLineupA(toArr);
      }
    }
    setSelected(null);
  };

  const handleConfirm = () => {
    navigate("/upcoming", {
      state: { teamA: lineupA, teamB: lineupB, selectedPlayers, date, time, formationA, formationB },
    });
  };

  const slotsA = getSlots(formationA, lineupA.length);
  const slotsB = getSlots(formationB, lineupB.length);

  return (
    <div className="min-h-screen bg-background font-inter">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight">Lineup</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pb-8 pt-4 space-y-3">
        {/* Formation selector - White */}
        <FormationSelector
          label="White"
          selected={formationA}
          onChange={setFormationA}
          colorScheme="light"
        />

        {/* Pitch */}
        <div
          ref={pitchRef}
          className="relative w-full rounded-3xl overflow-hidden"
          style={{
            aspectRatio: "10 / 14",
            background: FIELD_GREEN,
          }}
        >
          {/* Grass stripes */}
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `repeating-linear-gradient(180deg, transparent 0%, transparent 7.14%, rgba(255,255,255,0.5) 7.14%, rgba(255,255,255,0.5) 14.28%)`,
          }} />

          {/* Pitch markings */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 420" preserveAspectRatio="none">
            <rect x="12" y="12" width="276" height="396" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
            <line x1="12" y1="210" x2="288" y2="210" stroke={FIELD_LINES} strokeWidth="2" />
            <circle cx="150" cy="210" r="42" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
            <circle cx="150" cy="210" r="3" fill={FIELD_LINES} />
            {/* Top penalty area */}
            <rect x="72" y="12" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <rect x="108" y="12" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <circle cx="150" cy="56" r="2" fill={FIELD_LINES} />
            {/* Bottom penalty area */}
            <rect x="72" y="350" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <rect x="108" y="382" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <circle cx="150" cy="364" r="2" fill={FIELD_LINES} />
            {/* Corner arcs */}
            <path d="M12,22 A10,10 0 0,1 22,12" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <path d="M278,12 A10,10 0 0,1 288,22" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <path d="M12,398 A10,10 0 0,0 22,408" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            <path d="M278,408 A10,10 0 0,0 288,398" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
          </svg>

          {/* Swap hint */}
          <AnimatePresence>
            {selected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
            const player = lineupA[idx];
            if (!player) return null;
            const abs = toAbsolute(slot, "A");
            return (
              <PlayerDot
                key={`a-${player.id}`}
                player={player}
                x={abs.x}
                y={abs.y}
                isBlack={false}
                isDragging={false}
                isDropTarget={selected && !(selected.team === "A" && selected.idx === idx) &&
                  selected.team === "A" ? false : false}
                isSelected={selected?.team === "A" && selected?.idx === idx}
                onPointerDown={() => handlePlayerTap("A", idx)}
              />
            );
          })}

          {/* Team B (Black) — bottom half */}
          {slotsB.map((slot, idx) => {
            const player = lineupB[idx];
            if (!player) return null;
            const abs = toAbsolute(slot, "B");
            return (
              <PlayerDot
                key={`b-${player.id}`}
                player={player}
                x={abs.x}
                y={abs.y}
                isBlack={true}
                isDragging={false}
                isDropTarget={false}
                isSelected={selected?.team === "B" && selected?.idx === idx}
                onPointerDown={() => handlePlayerTap("B", idx)}
              />
            );
          })}
        </div>

        {/* Formation selector - Black */}
        <FormationSelector
          label="Black"
          selected={formationB}
          onChange={setFormationB}
          colorScheme="dark"
        />

        {/* Confirm button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 mt-2"
        >
          <Check className="w-4 h-4" />
          Confirm Lineup
        </motion.button>
      </div>
    </div>
  );
}
