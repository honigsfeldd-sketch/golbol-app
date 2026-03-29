import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Shuffle, LayoutGrid, List } from "lucide-react";
import TeamsPitchView from "../components/TeamsPitchView";
import TeamsListView from "../components/TeamsListView";

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
          // Move b to teamB — swap with someone from teamB
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
          // Move b to teamA — swap with someone from teamA
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

export default function Teams() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlayers = location.state?.selectedPlayers || [];
  const [teamA, setTeamA] = useState([]);
  const [teamB, setTeamB] = useState([]);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [viewMode, setViewMode] = useState("pitch");

  useEffect(() => {
    if (!selectedPlayers.length) { navigate("/"); return; }
    const { teamA, teamB } = generateBalancedTeams(selectedPlayers);
    setTeamA(teamA); setTeamB(teamB);
  }, []);

  const handleShuffle = () => {
    const { teamA: a, teamB: b } = generateBalancedTeams(selectedPlayers);
    setTeamA(a); setTeamB(b); setShuffleKey(k => k + 1);
  };

  const totalA = teamA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = teamB.reduce((s, p) => s + (p.rating || 5), 0);
  const diff = Math.abs(totalA - totalB);

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
          {/* View toggle */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-full p-1">
            <button
              onClick={() => setViewMode("pitch")}
              className={`p-1.5 rounded-full transition-all ${viewMode === "pitch" ? "bg-background shadow-sm" : ""}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition-all ${viewMode === "list" ? "bg-background shadow-sm" : ""}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pb-10 pt-6 space-y-6">
        {/* Score bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-stretch gap-3"
        >
          <div className="flex-1 bg-secondary rounded-2xl p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">White</p>
            <p className="text-4xl font-bold tracking-tight">{totalA}</p>
            <p className="text-xs text-muted-foreground mt-1">{teamA.length} players</p>
          </div>
          <div className="flex flex-col items-center justify-center px-1 gap-1">
            <div className="w-px flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground">VS</span>
            <div className="w-px flex-1 bg-border" />
          </div>
          <div className="flex-1 bg-secondary rounded-2xl p-4 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Black</p>
            <p className="text-4xl font-bold tracking-tight">{totalB}</p>
            <p className="text-xs text-muted-foreground mt-1">{teamB.length} players</p>
          </div>
        </motion.div>

        {/* Balance indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2"
        >
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${diff === 0 ? "bg-primary/10 text-primary" : diff <= 3 ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${diff === 0 ? "bg-primary" : diff <= 3 ? "bg-yellow-500" : "bg-red-500"}`} />
            {diff === 0 ? "Perfectly balanced" : diff <= 3 ? `Diff: ${diff} pts` : `Diff: ${diff} pts — shuffle?`}
          </div>
        </motion.div>

        {/* Main view */}
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === "pitch"
              ? <TeamsPitchView teamA={teamA} teamB={teamB} shuffleKey={shuffleKey} />
              : <TeamsListView teamA={teamA} teamB={teamB} shuffleKey={shuffleKey} />
            }
          </motion.div>
        </AnimatePresence>

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
    </div>
  );
}