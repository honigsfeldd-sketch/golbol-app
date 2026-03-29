import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, User, Trophy, Minus, ChevronRight } from "lucide-react";

const HISTORY_KEY = "golbol_match_history";

function getPlayerStats(playerId) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  let matches = 0, wins = 0, draws = 0, losses = 0, goals = 0, mvps = 0;
  const matchHistory = [];

  for (const match of history) {
    const inA = (match.teamA || []).find(p => p.id === playerId);
    const inB = (match.teamB || []).find(p => p.id === playerId);
    const playerEntry = inA || inB;
    if (!playerEntry) continue;

    matches++;
    const playerGoals = playerEntry.goals || 0;
    goals += playerGoals;
    const isMvp = match.mvp?.id === playerId;
    if (isMvp) mvps++;

    const isWhite = !!inA;
    const myScore = isWhite ? match.scoreWhite : match.scoreBlack;
    const oppScore = isWhite ? match.scoreBlack : match.scoreWhite;
    const result = myScore > oppScore ? "W" : myScore < oppScore ? "L" : "D";
    if (result === "W") wins++;
    else if (result === "D") draws++;
    else losses++;

    matchHistory.push({
      id: match.id,
      date: match.date,
      team: isWhite ? "White" : "Black",
      opponent: isWhite ? "Black" : "White",
      scoreFor: myScore,
      scoreAgainst: oppScore,
      result,
      playerGoals,
      isMvp,
    });
  }

  return { matches, wins, draws, losses, goals, mvps, matchHistory };
}

function StatBox({ label, value, icon, highlight }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-2xl font-light tabular-nums ${highlight ? "text-yellow-500" : "text-foreground"}`}>
        {value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mt-1">{label}</span>
    </div>
  );
}

function MatchRow({ match, index, onPress }) {
  const resultColors = {
    W: "bg-green-500/10 text-green-600",
    D: "bg-muted text-muted-foreground",
    L: "bg-red-500/10 text-red-500",
  };
  const resultLabels = { W: "Win", D: "Draw", L: "Loss" };

  return (
    <motion.button
      onClick={onPress}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="w-full flex items-center gap-3 py-3 border-b border-border/30 last:border-0"
    >
      {/* Result indicator */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${resultColors[match.result]}`}>
        <span className="text-[11px] font-bold">{match.result}</span>
      </div>

      {/* Match info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium truncate">
            {match.team} vs {match.opponent}
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground/50">
          {match.date ? new Date(match.date + "T12:00:00").toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
        </span>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <span className="text-[13px] font-medium tabular-nums">{match.scoreFor}–{match.scoreAgainst}</span>
      </div>

      {/* Player contribution */}
      <div className="flex items-center gap-1 shrink-0 justify-end">
        {match.playerGoals > 0 && (
          <span className="text-[10px] bg-yellow-400/15 text-yellow-600 rounded-full px-1.5 py-0.5 font-semibold">
            ⚽{match.playerGoals > 1 ? `×${match.playerGoals}` : ""}
          </span>
        )}
        {match.isMvp && (
          <Trophy className="w-3 h-3 text-yellow-500" />
        )}
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/25 ml-1" />
      </div>
    </motion.button>
  );
}

export default function PlayerProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const player = location.state?.player;
  const darkKit = location.state?.darkKit || false;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (player) {
      setStats(getPlayerStats(player.id));
    }
  }, [player]);

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Player not found</p>
          <button onClick={() => navigate("/")} className="mt-4 text-sm font-medium underline">Go home</button>
        </div>
      </div>
    );
  }

  const imageSrc = darkKit && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  const positionLabels = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };

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
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-32">

        {/* Player identity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center pt-4 pb-8"
        >
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border/30 shadow-lg mb-4">
            {imageSrc ? (
              <img src={imageSrc} alt={player.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <User className="w-10 h-10 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight">{player.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50">
              {positionLabels[player.position] || player.position || "Player"}
            </span>
            <span className="text-muted-foreground/20">·</span>
            <span className="text-[11px] font-medium text-muted-foreground/50">
              Rating {player.rating || 5}
            </span>
          </div>
        </motion.div>

        {/* Stats grid */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-card rounded-2xl border border-border/40 p-5">
              <div className="grid grid-cols-3 gap-y-5">
                <StatBox label="Matches" value={stats.matches} />
                <StatBox label="Wins" value={stats.wins} />
                <StatBox label="Draws" value={stats.draws} />
                <StatBox label="Losses" value={stats.losses} />
                <StatBox label="Goals" value={stats.goals} highlight={stats.goals > 0} />
                <StatBox label="MVP" value={stats.mvps} highlight={stats.mvps > 0} />
              </div>

              {/* Win rate bar */}
              {stats.matches > 0 && (
                <div className="mt-5 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">Win rate</span>
                    <span className="text-[12px] font-semibold tabular-nums">
                      {Math.round((stats.wins / stats.matches) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-green-500 h-full transition-all"
                        style={{ width: `${(stats.wins / stats.matches) * 100}%` }}
                      />
                      <div
                        className="bg-muted-foreground/20 h-full transition-all"
                        style={{ width: `${(stats.draws / stats.matches) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Match history */}
        {stats && stats.matchHistory.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <div className="border-t border-dashed border-border/60 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold">Match History</span>
                <span className="text-[11px] text-muted-foreground/40">{stats.matchHistory.length} matches</span>
              </div>
              <div>
                {stats.matchHistory.map((match, i) => (
                  <MatchRow key={match.id} match={match} index={i} onPress={() => navigate(`/match/${match.id}`)} />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {stats && stats.matches === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-10 text-center"
          >
            <div className="border-t border-dashed border-border/60 pt-8">
              <Minus className="w-6 h-6 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/40">No match history yet</p>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
