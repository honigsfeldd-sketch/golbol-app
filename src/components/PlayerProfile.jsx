import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { User, Pencil, Trash2, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const positionLabels = { GK: "Goalkeeper", DEF: "Defender", MID: "Midfielder", FWD: "Forward" };
const positionColors = { GK: "#F59E0B", DEF: "#3B82F6", MID: "#8B5CF6", FWD: "#EF4444" };

function RatingRing({ rating }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (rating / 10) * circ;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg className="absolute inset-0 rotate-[-90deg]" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#EAEAEA" strokeWidth="4" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold leading-none">{rating}</span>
        <span className="text-[9px] text-muted-foreground font-medium">/10</span>
      </div>
    </div>
  );
}

export default function PlayerProfile({ player, open, onClose, onEdit, onDeleted }) {
  if (!player) return null;

  const handleDelete = async () => {
    await base44.entities.Player.delete(player.id);
    onDeleted();
    onClose();
  };

  const posColor = positionColors[player.position] || "#8B5CF6";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-0 shadow-2xl rounded-3xl p-0 overflow-hidden gap-0">
        {/* Hero image */}
        <div className="relative h-72 bg-muted">
          {player.image ? (
            <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <User className="w-20 h-20 text-muted-foreground/20" />
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          {/* Position badge */}
          <div
            className="absolute top-4 left-4 px-2.5 py-1 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ background: `${posColor}cc` }}
          >
            {positionLabels[player.position] || "Midfielder"}
          </div>

          {/* Name */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">{player.name}</h2>
          </div>
        </div>

        {/* Content */}
        <div className="bg-background p-6 space-y-6">
          {/* Rating */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Rating</p>
              <p className="text-sm text-muted-foreground mt-1">
                {player.rating >= 8 ? "⚡ Elite" : player.rating >= 6 ? "✦ Good" : "▸ Average"}
              </p>
            </div>
            <RatingRing rating={player.rating || 5} />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { onEdit(player); onClose(); }}
              className="flex-1 h-11 rounded-xl bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleDelete}
              className="flex-1 h-11 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </motion.button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}