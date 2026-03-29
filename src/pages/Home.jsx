import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Users, X, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import PlayerCard from "../components/PlayerCard";
import PlayerProfile from "../components/PlayerProfile";
import AddPlayerModal from "../components/AddPlayerModal";

export default function Home() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [darkKit, setDarkKit] = useState(false);

  const handlePasteFromClipboard = async () => {
    let text;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      alert("לא ניתן לגשת ללוח. אנא אשר הרשאת גישה.");
      return;
    }
    if (!text || !text.trim()) return;

    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // Stop before "מזמינים" (reserves/standby) section
    const stopKeywords = ["מזמינים", "ממתינים", "רזרבה", "המתנה"];
    const cutoffIndex = lines.findIndex(l => stopKeywords.some(kw => l.includes(kw)));
    const activeLines = cutoffIndex >= 0 ? lines.slice(0, cutoffIndex) : lines;

    // Extract names — remove numbering like "1.", "1)", "1 -" etc.
    const names = activeLines.map(l => l.replace(/^\d+[\.\)\-\s]*/, "").trim()).filter(Boolean);
    // Filter out non-name lines (headers, dates, location info)
    const filteredNames = names.filter(l => {
      if (/^(יום|במגרש|מגרש|שעה|\d{1,2}:\d{2})/.test(l)) return false;
      if (l.includes("!!") || l.includes("??")) return false;
      return true;
    });

    const matched = [];
    const unmatched = [];

    for (const name of filteredNames) {
      const normalizedName = name.replace(/[^\u0590-\u05FFa-zA-Z\s]/g, "").trim();
      if (!normalizedName) continue;

      // Two-pass matching: exact first, then fuzzy
      const exactMatch = players.find(p => {
        const nick = (p.nickname || "").trim();
        const aliases = p.nicknameAliases || [];
        const inputWords = normalizedName.split(/\s+/).filter(Boolean);
        if (nick && nick === normalizedName) return true;
        if (aliases.some(a => a === normalizedName || inputWords.includes(a))) return true;
        const nickWords = nick.split(/\s+/).filter(Boolean);
        if (nick && inputWords.some(w => nickWords.includes(w))) return true;
        return false;
      });
      const found = exactMatch || players.find(p => {
        const nick = (p.nickname || "").trim();
        const fullName = (p.name || "").trim().toLowerCase();
        const normalizedLower = normalizedName.toLowerCase();
        if (nick && (nick.includes(normalizedName) || normalizedName.includes(nick))) return true;
        if (fullName === normalizedLower || fullName.includes(normalizedLower) || normalizedLower.includes(fullName)) return true;
        const firstName = fullName.split(" ")[0];
        if (firstName === normalizedLower) return true;
        return false;
      });

      if (found && !matched.find(m => m.id === found.id)) {
        matched.push(found);
      } else if (!found) {
        unmatched.push(normalizedName);
      }
    }

    if (matched.length > 0) {
      setSelectionMode(true);
      setSelectedIds(new Set(matched.map(p => p.id)));
    }
  };

  const loadPlayers = async () => {
    const data = await base44.entities.Player.list("name");
    setPlayers(data);
    setLoading(false);
  };

  useEffect(() => { loadPlayers(); }, []);

  const toggleSelection = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerate = () => {
    const selected = players.filter((p) => selectedIds.has(p.id));
    navigate("/teams", { state: { selectedPlayers: selected } });
  };

  const handleEdit = (player) => {
    setEditPlayer(player);
    setShowAddModal(true);
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-5 py-5">
          <AnimatePresence mode="wait">
            {selectionMode ? (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between"
              >
                <button onClick={exitSelectionMode} className="p-2 -ml-2 rounded-full hover:bg-secondary transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold">
                  {selectedIds.size} <span className="text-muted-foreground">selected</span>
                </span>
                <Button
                  onClick={handleGenerate}
                  disabled={selectedIds.size < 4}
                  size="sm"
                  className="rounded-full px-5 h-9 bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Generate Teams
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight">Squad</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{players.length} players</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setDarkKit((v) => !v)}
                      className="rounded-full w-10 h-10 flex items-center justify-center bg-secondary hover:bg-muted transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: darkKit ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 transition-colors duration-300 ${darkKit ? "bg-foreground border-foreground" : "bg-transparent border-muted-foreground/40"}`}>
                          {darkKit && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-full h-full rounded-full flex items-center justify-center"
                            >
                              <div className="w-2 h-2 rounded-full bg-background" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    </motion.button>
                    <Button
                      onClick={handlePasteFromClipboard}
                      size="icon"
                      variant="ghost"
                      className="rounded-full w-10 h-10 bg-secondary hover:bg-muted"
                    >
                      <ClipboardPaste className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={() => setShowAddModal(true)}
                      size="icon"
                      variant="ghost"
                      className="rounded-full w-10 h-10 bg-secondary hover:bg-muted"
                    >
                      <Plus className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {players.length >= 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5">
                    <Button
                      onClick={() => setSelectionMode(true)}
                      className="w-full h-13 rounded-2xl text-base font-semibold bg-foreground text-background hover:bg-foreground/90"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      Create Teams
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Players Grid */}
      <div className="max-w-lg mx-auto px-5 pb-28">
        {players.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">No players yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first player to get started</p>
            <Button
              onClick={() => setShowAddModal(true)}
              className="mt-6 rounded-full px-6 h-11 bg-foreground text-background hover:bg-foreground/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Player
            </Button>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 gap-3 mt-2">
            {players.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                selectable={selectionMode}
                selected={selectedIds.has(player.id)}
                onSelect={toggleSelection}
                onClick={(player) => navigate(`/player/${player.id}`, { state: { player, darkKit } })}
                darkKit={darkKit}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      <PlayerProfile
        player={profilePlayer}
        open={!!profilePlayer}
        onClose={() => setProfilePlayer(null)}
        onEdit={handleEdit}
        onDeleted={loadPlayers}
      />

      <AddPlayerModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditPlayer(null); }}
        onAdded={loadPlayers}
        editPlayer={editPlayer}
      />
    </div>
  );
}
