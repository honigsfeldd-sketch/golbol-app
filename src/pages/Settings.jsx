import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Pencil, User, Lock, Eye, EyeOff } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PlayerProfile from "../components/PlayerProfile";
import AddPlayerModal from "../components/AddPlayerModal";

const ADMIN_PASSWORD = "golbol2024";

export default function Settings() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profilePlayer, setProfilePlayer] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);

  // Admin auth state
  const [isAdmin, setIsAdmin] = useState(() => {
    return sessionStorage.getItem("golbol_admin") === "true";
  });
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAdminLogin = () => {
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      sessionStorage.setItem("golbol_admin", "true");
      setShowPasswordPrompt(false);
      setPasswordInput("");
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    sessionStorage.removeItem("golbol_admin");
  };

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
        {/* Admin ratings toggle */}
        <div className="mb-4 p-4 rounded-2xl bg-secondary">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">Player Ratings</p>
                <p className="text-xs text-muted-foreground">{isAdmin ? "Admin access enabled" : "Password required to view/edit"}</p>
              </div>
            </div>
            {isAdmin ? (
              <button
                onClick={handleAdminLogout}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 text-red-500 text-xs font-semibold hover:bg-red-500/20 transition-colors"
              >
                Lock
              </button>
            ) : (
              <button
                onClick={() => setShowPasswordPrompt(true)}
                className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
              >
                Unlock
              </button>
            )}
          </div>

          {/* Password prompt */}
          {showPasswordPrompt && !isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t border-border/40"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                    placeholder="Enter admin password"
                    className={`w-full h-10 px-3 pr-9 rounded-xl bg-background text-sm outline-none focus:ring-2 transition-all ${
                      passwordError ? "ring-2 ring-red-500/50 focus:ring-red-500/50" : "focus:ring-primary/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Eye className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="h-10 px-4 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-colors"
                >
                  Submit
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1.5">Incorrect password</p>
              )}
            </motion.div>
          )}
        </div>

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
                <p className="text-xs text-muted-foreground">
                  {player.position || "MID"}{isAdmin ? ` · Rating ${player.rating}` : ""}
                </p>
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
        isAdmin={isAdmin}
      />

      <AddPlayerModal
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditPlayer(null); }}
        onAdded={loadPlayers}
        editPlayer={editPlayer}
        isAdmin={isAdmin}
      />
    </div>
  );
}
