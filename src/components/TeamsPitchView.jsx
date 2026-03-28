import { motion, AnimatePresence } from "framer-motion";
import { User } from "lucide-react";

function PlayerAvatar({ player, index, blackJersey }) {
  const imgSrc = blackJersey && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  return (
    <motion.div
      layout
      key={player.id}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 280, damping: 22 }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg ring-1 ring-black/10">
        {imgSrc ? (
          <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${blackJersey ? "bg-zinc-800" : "bg-white/20"}`}>
            <User className="w-5 h-5 text-white/70" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-bold text-white drop-shadow-sm text-center max-w-[60px] truncate leading-tight">
        {player.name.split(" ")[0]}
      </span>
    </motion.div>
  );
}

function PitchTeam({ label, players, rating, side, shuffleKey, blackJersey }) {
  return (
    <div className={`flex-1 flex flex-col ${side === "top" ? "justify-start pt-6" : "justify-end pb-6"}`}>
      <div className={`flex flex-col items-center gap-4 ${side === "bottom" ? "flex-col-reverse" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{label}</span>
          <span className="text-xs font-bold text-white bg-white/15 px-2 py-0.5 rounded-full backdrop-blur-sm">
            {rating}
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`${side}-${shuffleKey}`}
            className="flex flex-wrap justify-center gap-3 max-w-[280px]"
          >
            {players.map((p, i) => <PlayerAvatar key={p.id} player={p} index={i} blackJersey={blackJersey} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function TeamsPitchView({ teamA, teamB, shuffleKey }) {
  const totalA = teamA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = teamB.reduce((s, p) => s + (p.rating || 5), 0);

  return (
    <div
      className="relative w-full rounded-3xl overflow-hidden"
      style={{ minHeight: 520, background: "linear-gradient(180deg, #1e9e47 0%, #178038 48%, #1e9e47 100%)" }}
    >
      {/* Pitch lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 300 520" preserveAspectRatio="none">
        {/* Outer boundary */}
        <rect x="10" y="10" width="280" height="500" fill="none" stroke="white" strokeWidth="2" />
        {/* Center line */}
        <line x1="10" y1="260" x2="290" y2="260" stroke="white" strokeWidth="2" />
        {/* Center circle */}
        <circle cx="150" cy="260" r="40" fill="none" stroke="white" strokeWidth="2" />
        <circle cx="150" cy="260" r="3" fill="white" />
        {/* Top penalty box */}
        <rect x="75" y="10" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="110" y="10" width="80" height="30" fill="none" stroke="white" strokeWidth="1.5" />
        {/* Bottom penalty box */}
        <rect x="75" y="445" width="150" height="65" fill="none" stroke="white" strokeWidth="1.5" />
        <rect x="110" y="480" width="80" height="30" fill="none" stroke="white" strokeWidth="1.5" />
      </svg>

      {/* Teams */}
      <div className="relative z-10 h-full flex flex-col" style={{ minHeight: 520 }}>
        <PitchTeam label="White" players={teamA} rating={totalA} side="top" shuffleKey={shuffleKey} blackJersey={false} />

        {/* Center marker */}
        <div className="flex items-center justify-center py-2 shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
        </div>

        <PitchTeam label="Black" players={teamB} rating={totalB} side="bottom" shuffleKey={shuffleKey} blackJersey={true} />
      </div>
    </div>
  );
}