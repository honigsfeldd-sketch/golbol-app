import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, User, ChevronRight } from "lucide-react";

const HISTORY_KEY = "golbol_match_history";

function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function MatchCard({ match, index, onPress }) {
  const displayDate = match.date
    ? new Date(match.date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" })
    : "—";
  const whiteWin = match.scoreWhite > match.scoreBlack;
  const blackWin = match.scoreBlack > match.scoreWhite;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border/40 overflow-hidden"
    >
      <button
        onClick={onPress}
        className="w-full p-4 flex items-center gap-4"
      >
        {/* Date */}
        <div className="flex flex-col items-center shrink-0 w-12">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase">{displayDate.split(",")[0]}</span>
          <span className="text-lg font-light tabular-nums">
            {match.date ? new Date(match.date + "T12:00:00").getDate() : "—"}
          </span>
        </div>

        {/* Score */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 mb-0.5">White</span>
            <span className={`text-2xl tabular-nums ${whiteWin ? "font-semibold" : "font-light text-muted-foreground"}`}>
              {match.scoreWhite}
            </span>
          </div>
          <span className="text-muted-foreground/20 font-light">—</span>
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground/40 mb-0.5">Black</span>
            <span className={`text-2xl tabular-nums ${blackWin ? "font-semibold" : "font-light text-muted-foreground"}`}>
              {match.scoreBlack}
            </span>
          </div>
        </div>

        {/* MVP badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {match.mvp && (
            <div className="w-7 h-7 rounded-full overflow-hidden border-[1.5px] border-yellow-400">
              {match.mvp.image ? (
                <img src={match.mvp.image} alt={match.mvp.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-yellow-400/10 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                </div>
              )}
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-muted-foreground/25" />
        </div>
      </button>
    </motion.div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    setMatches(getHistory());
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight">Match History</h1>
          <p className="text-sm text-muted-foreground/60 mt-0.5">
            {matches.length} {matches.length === 1 ? "match" : "matches"} played
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 space-y-3">
        {matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Clock className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-lg">No matches yet</p>
            <p className="text-sm text-muted-foreground/50 mt-1">
              Match results will appear here
            </p>
          </motion.div>
        ) : (
          matches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} onPress={() => navigate(`/match/${match.id}`)} />
          ))
        )}
      </div>
    </div>
  );
}
