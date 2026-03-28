import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlayerProfile from "../components/PlayerProfile";
import AddPlayerModal from "../components/AddPlayerModal";

export default function Settings() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);

  const loadPlayers = async () => {
    const data = await base44.entities.Player.list("name");
    setPlayers(data);
    setLoading(false);
  };

  useEffect(() => { loadPlayers(); }, []);

  const handleEdit = (player) => {
    setEditPlayer(player);
    setShowAddModal(true);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-5 py-5">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage players</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-1.5"
        >
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => setProfilePlayer(player)}
              className="flex items-center gap-3 p-3 rounded-2xl bg-secondary hover:bg-muted transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {player.image ? (
                  <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{player.name}</p>
                <p className="text-xs text-muted-foreground">{player.position || "MID"} · Rating {player.rating}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleEdit(player); }}
                className="w-8 h-8 rounded-full bg-background flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      </div>

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
