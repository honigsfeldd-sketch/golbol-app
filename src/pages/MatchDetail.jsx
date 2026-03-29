import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, User, MapPin } from "lucide-react";

const HISTORY_KEY = "golbol_match_history";

function getMatch(matchId) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  return history.find(m => m.id === matchId) || null;
}

function PlayerRow({ player, index, darkKit }) {
  const navigate = useNavigate();
  const imageSrc = darkKit && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      onClick={() => navigate(`/player/${player.id}`, { state: { player, darkKit } })}
      className="w-full flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0"
    >
      <div className="w-9 h-9 rounded-full overflow-hidden border border-border/30 shrink-0">
        {imageSrc ? (
          <img src={imageSrc} alt={player.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <span className="text-[13px] font-medium truncate block">{player.name}</span>
        <span className="text-[10px] text-muted-foreground/40">{player.position || "MID"}</span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {player.goals > 0 && (
          <span className="text-[10px] bg-yellow-400/15 text-yellow-600 rounded-full px-1.5 py-0.5 font-semibold">
            ⚽{player.goals > 1 ? `×${player.goals}` : ""}
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    setMatch(getMatch(matchId));
  }, [matchId]);

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Match not found</p>
          <button onClick={() => navigate("/history")} className="mt-4 text-sm font-medium underline">Back to history</button>
        </div>
      </div>
    );
  }

  const whiteWin = match.scoreWhite > match.scoreBlack;
  const blackWin = match.scoreBlack > match.scoreWhite;
  const draw = match.scoreWhite === match.scoreBlack;
  const displayDate = match.date
    ? new Date(match.date + "T12:00:00").toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "—";
  const displayTime = match.time
    ? new Date(`2000-01-01T${match.time}`).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";

  const scorers = [...(match.teamA || []), ...(match.teamB || [])].filter(p => p.goals > 0);

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
          <span className="text-sm font-semibold">Match Details</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-32">

        {/* Score hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-10"
        >
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">White</span>
              <span className={`text-5xl tabular-nums ${whiteWin ? "font-semibold" : "font-light text-muted-foreground"}`}>
                {match.scoreWhite}
              </span>
            </div>
            <span className="text-2xl font-extralight text-muted-foreground/20 -translate-y-2">—</span>
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-2">Black</span>
              <span className={`text-5xl tabular-nums ${blackWin ? "font-semibold" : "font-light text-muted-foreground"}`}>
                {match.scoreBlack}
              </span>
            </div>
          </div>

          {/* Result label */}
          <div className="flex justify-center mt-4">
            <span className={`text-[11px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${
              draw ? "bg-muted text-muted-foreground" : whiteWin ? "bg-green-500/10 text-green-600" : "bg-green-500/10 text-green-600"
            }`}>
              {draw ? "Draw" : whiteWin ? "White wins" : "Black wins"}
            </span>
          </div>
        </motion.div>

        {/* Date & location */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-2 text-[12px] text-muted-foreground/50 mb-8"
        >
          <span>{displayDate}</span>
          {displayTime && (
            <>
              <span className="text-border">·</span>
              <span className="font-medium text-foreground/60">{displayTime}</span>
            </>
          )}
        </motion.div>

        <div className="border-t border-dashed border-border/60 mb-8" />

        {/* MVP */}
        {match.mvp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate(`/player/${match.mvp.id}`, { state: { player: match.mvp } })}
              className="w-full flex items-center gap-3 bg-yellow-500/5 rounded-2xl p-4 border border-yellow-400/20"
            >
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-yellow-400 shrink-0">
                {match.mvp.image ? (
                  <img src={match.mvp.image} alt={match.mvp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-yellow-400/10 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-left">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-yellow-600/60 block">Man of the Match</span>
                <span className="text-[14px] font-semibold">{match.mvp.name}</span>
              </div>
              <Trophy className="w-5 h-5 text-yellow-400 shrink-0" />
            </button>
          </motion.div>
        )}

        {/* Scorers */}
        {scorers.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-3 block">Goals</span>
            <div className="flex flex-wrap gap-2">
              {scorers.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/player/${p.id}`, { state: { player: p } })}
                  className="flex items-center gap-1.5 bg-secondary/60 hover:bg-secondary rounded-full px-3 py-1.5 transition-colors"
                >
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
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Lineups */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <div className="grid grid-cols-2 gap-6">
            {/* White team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">White</span>
                <span className="text-[10px] text-muted-foreground/30">{match.teamA?.length || 0}</span>
              </div>
              {(match.teamA || []).map((p, i) => (
                <PlayerRow key={p.id} player={p} index={i} />
              ))}
            </div>

            {/* Black team */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">Black</span>
                <span className="text-[10px] text-muted-foreground/30">{match.teamB?.length || 0}</span>
              </div>
              {(match.teamB || []).map((p, i) => (
                <PlayerRow key={p.id} player={p} index={i} darkKit />
              ))}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
