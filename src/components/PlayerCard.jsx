import { motion } from "framer-motion";
import { User } from "lucide-react";

export default function PlayerCard({ player, selectable, selected, onSelect, onClick, darkKit }) {
  const handleClick = () => {
    if (selectable) {
      onSelect?.(player.id);
    } else {
      onClick?.(player);
    }
  };

  const imageSrc = darkKit && player.blackJerseyImage ? player.blackJerseyImage : player.image;

  return (
    <motion.div
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className={`
        relative cursor-pointer rounded-2xl overflow-hidden bg-secondary
        transition-all duration-300 ease-out
        ${selected ? "ring-2 ring-primary shadow-lg shadow-primary/10" : ""}
        ${selectable && !selected ? "opacity-70 hover:opacity-100" : ""}
      `}
    >
      <div className="aspect-square relative">
        {imageSrc ? (
          <motion.img
            key={imageSrc}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={imageSrc}
            alt={player.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <User className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}

        {selectable && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: selected ? 1 : 0 }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-primary flex items-center justify-center"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7L6 10L11 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>

      <div className="p-3 pb-4">
        <p className="font-semibold text-sm tracking-tight truncate">{player.name}</p>
        {!selectable && (
          <p className="text-xs text-muted-foreground mt-0.5">{player.position || "MID"}</p>
        )}
      </div>
    </motion.div>
  );
}