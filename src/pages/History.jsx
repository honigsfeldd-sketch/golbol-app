import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trophy, User, ChevronDown, ChevronUp } from "lucide-react";

const HISTORY_KEY = "golbol_match_history";

function getHistory() {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function MatchCard({ match, index }) {
  const [expanded, setExpanded] = useState(false);
  const displayDate = match.date
    ? new Date(match.date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "short", day: "numeric", month: "short" })
    : "—";
  const whiteWin = match.scoreWhite > match.scoreBlack;
  const blackWin = match.scoreBlack > match.scoreWhite;

  const scorers = [...(match.teamA || []), ...(match.teamB || [])].filter(p => p.goals > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-2xl border border-border/40 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
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

        {/* MVP badge + expand */}
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
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground/30" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border/30">
              {/* Scorers */}
              {scorers.length > 0 && (
                <div className="mb-4">
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-2 block">Goals</span>
                  <div className="flex flex-wrap gap-2">
                    {scorers.map(p => (
                      <div key={p.id} className="flex items-center gap-1.5 bg-secondary/60 rounded-full px-2.5 py-1">
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-medium">{p.name.split(" ")[0]}</span>
                        <span className="text-[10px] font-bold text-muted-foreground">×{p.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MVP */}
              {match.mvp && (
                <div className="flex items-center gap-2">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-[11px] font-medium text-muted-foreground/60">Man of the Match:</span>
                  <span className="text-[11px] font-semibold">{match.mvp.name}</span>
                </div>
              )}

              {/* Lineups */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5 block">White ({match.teamA?.length || 0})</span>
                  <div className="space-y-1">
                    {(match.teamA || []).map(p => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted rounded-full" />
                          )}
                        </div>
                        <span className="text-[10px] text-foreground/70 truncate">{p.name}</span>
                        {p.goals > 0 && <span className="text-[9px] text-yellow-600">⚽{p.goals > 1 ? `×${p.goals}` : ""}</span>}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5 block">Black ({match.teamB?.length || 0})</span>
                  <div className="space-y-1">
                    {(match.teamB || []).map(p => (
                      <div key={p.id} className="flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full overflow-hidden">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-muted rounded-full" />
                          )}
                        </div>
                        <span className="text-[10px] text-foreground/70 truncate">{p.name}</span>
                        {p.goals > 0 && <span className="text-[9px] text-yellow-600">⚽{p.goals > 1 ? `×${p.goals}` : ""}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function History() {
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
            <MatchCard key={match.id} match={match} index={i} />
          ))
        )}
      </div>
    </div>
  );
}
