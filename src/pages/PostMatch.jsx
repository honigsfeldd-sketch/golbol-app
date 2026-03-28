import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, User, Trophy, Check, Star } from "lucide-react";

const HISTORY_KEY = "golbol_match_history";

function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveMatch(match) {
  const history = getHistory();
  history.unshift(match);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function GoalPlayer({ player, goals, onTap, onLongPress, blackJersey }) {
  const imgSrc = blackJersey && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  const hasGoals = goals > 0;
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
    <motion.button
      whileTap={{ scale: 0.92 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => clearTimeout(timerRef.current)}
      className="flex flex-col items-center gap-1.5 select-none"
    >
      <div className="relative">
        <div className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-colors shadow-sm ${hasGoals ? "border-yellow-400" : "border-white/30"}`}>
          {imgSrc ? (
            <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${blackJersey ? "bg-black/40" : "bg-white/15"}`}>
              <User className="w-4 h-4 text-white/50" />
            </div>
          )}
        </div>
        {hasGoals && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-yellow-400 flex items-center justify-center px-1"
          >
            <span className="text-[10px] font-bold text-black">{goals}</span>
          </motion.div>
        )}
      </div>
      <span className="text-[10px] font-medium text-white/80 text-center max-w-[56px] truncate leading-tight">
        {player.name.split(" ")[0]}
      </span>
    </motion.button>
  );
}

function TeamGoalsSection({ team, goals, onPlayerTap, onPlayerLongPress, label, blackJersey }) {
  const teamGoals = team.reduce((s, p) => s + (goals[p.id] || 0), 0);
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/40">{label}</span>
        <span className="text-2xl font-light text-white tabular-nums">{teamGoals}</span>
      </div>
      <div className="flex flex-wrap gap-4 justify-center">
        {team.map(p => (
          <GoalPlayer
            key={p.id}
            player={p}
            goals={goals[p.id] || 0}
            onTap={() => onPlayerTap(p.id)}
            onLongPress={() => onPlayerLongPress(p.id)}
            blackJersey={blackJersey}
          />
        ))}
      </div>
    </div>
  );
}

function MvpSelector({ allPlayers, mvpId, onSelect }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-semibold">Man of the Match</span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {allPlayers.map(p => {
          const isSelected = mvpId === p.id;
          const imgSrc = p.image;
          return (
            <motion.button
              key={p.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => onSelect(p.id)}
              className={`flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-colors ${isSelected ? "bg-yellow-500/10 ring-2 ring-yellow-400" : "hover:bg-secondary"}`}
            >
              <div className={`w-11 h-11 rounded-full overflow-hidden border-2 transition-colors ${isSelected ? "border-yellow-400" : "border-transparent"}`}>
                {imgSrc ? (
                  <img src={imgSrc} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-foreground/70 text-center truncate w-full leading-tight">
                {p.name.split(" ")[0]}
              </span>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <Trophy className="w-3 h-3 text-yellow-500" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default function PostMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamA = [], teamB = [], date, time } = location.state || {};

  const [goals, setGoals] = useState({});
  const [mvpId, setMvpId] = useState(null);
  const [saved, setSaved] = useState(false);

  const toggleGoal = (playerId) => {
    setGoals(prev => ({ ...prev, [playerId]: (prev[playerId] || 0) + 1 }));
  };

  const removeGoal = (playerId) => {
    setGoals(prev => {
      const current = prev[playerId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [playerId]: current - 1 };
    });
  };

  const whiteGoals = teamA.reduce((s, p) => s + (goals[p.id] || 0), 0);
  const blackGoals = teamB.reduce((s, p) => s + (goals[p.id] || 0), 0);
  const allPlayers = [...teamA, ...teamB];

  const handleSave = () => {
    const mvpPlayer = allPlayers.find(p => p.id === mvpId);
    const match = {
      id: Date.now().toString(36),
      date,
      time,
      teamA: teamA.map(p => ({ id: p.id, name: p.name, image: p.image, position: p.position, rating: p.rating, goals: goals[p.id] || 0 })),
      teamB: teamB.map(p => ({ id: p.id, name: p.name, image: p.image, blackJerseyImage: p.blackJerseyImage, position: p.position, rating: p.rating, goals: goals[p.id] || 0 })),
      scoreWhite: whiteGoals,
      scoreBlack: blackGoals,
      mvp: mvpPlayer ? { id: mvpPlayer.id, name: mvpPlayer.name, image: mvpPlayer.image } : null,
    };
    saveMatch(match);
    setSaved(true);
    setTimeout(() => navigate("/history"), 1200);
  };

  if (!teamA.length && !teamB.length) {
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

        {/* Score display */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between py-8 px-4"
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">White</span>
            <span className="text-5xl font-light tabular-nums">{whiteGoals}</span>
          </div>
          <span className="text-lg font-light text-muted-foreground/30">—</span>
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Black</span>
            <span className="text-5xl font-light tabular-nums">{blackGoals}</span>
          </div>
        </motion.div>

        <div className="border-t border-dashed border-border/60 mb-8" />

        {/* Instructions */}
        <p className="text-[12px] text-muted-foreground/50 text-center mb-6">
          Tap a player to add a goal · Long press to remove
        </p>

        {/* Pitch with goal tracking */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-[24px] overflow-hidden p-6"
          style={{
            background: "linear-gradient(180deg, #2d8a4e 0%, #236b3c 50%, #2d8a4e 100%)",
          }}
        >
          <TeamGoalsSection
            team={teamA}
            goals={goals}
            onPlayerTap={toggleGoal}
            onPlayerLongPress={removeGoal}
            label="White"
            blackJersey={false}
          />

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 border-t border-white/10" />
            <div className="w-2 h-2 rounded-full bg-white/20" />
            <div className="flex-1 border-t border-white/10" />
          </div>

          <TeamGoalsSection
            team={teamB}
            goals={goals}
            onPlayerTap={toggleGoal}
            onPlayerLongPress={removeGoal}
            label="Black"
            blackJersey={true}
          />
        </motion.div>

        {/* MVP Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-10"
        >
          <div className="border-t border-dashed border-border/60 pt-8">
            <MvpSelector
              allPlayers={allPlayers}
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
          className="mt-10"
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
