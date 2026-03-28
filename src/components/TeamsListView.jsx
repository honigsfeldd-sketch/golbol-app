import { motion } from "framer-motion";
import { User } from "lucide-react";

const positionColors = {
  GK: "bg-yellow-100 text-yellow-700",
  DEF: "bg-blue-100 text-blue-700",
  MID: "bg-purple-100 text-purple-700",
  FWD: "bg-red-100 text-red-700",
};

function RatingBar({ rating }) {
  const pct = (rating / 10) * 100;
  return (
    <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function TeamSection({ label, players, total, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      {/* Team header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Total</span>
          <span className="text-sm font-bold">{total}</span>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-1.5">
        {players.map((player, i) => (
          <motion.div
            key={player.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-2xl bg-secondary hover:bg-muted transition-colors"
          >
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
              {player.image ? (
                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </div>

            {/* Name + position */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{player.name}</p>
              <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-0.5 ${positionColors[player.position] || "bg-secondary text-muted-foreground"}`}>
                {player.position || "MID"}
              </span>
            </div>

            {/* Rating */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-sm font-bold tabular-nums">{player.rating}</span>
              <RatingBar rating={player.rating || 5} />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default function TeamsListView({ teamA, teamB, shuffleKey }) {
  const totalA = teamA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = teamB.reduce((s, p) => s + (p.rating || 5), 0);

  return (
    <div key={shuffleKey} className="space-y-6">
      <TeamSection label="Team A" players={teamA} total={totalA} delay={0} />
      <div className="border-t border-border/60" />
      <TeamSection label="Team B" players={teamB} total={totalB} delay={0.1} />
    </div>
  );
}