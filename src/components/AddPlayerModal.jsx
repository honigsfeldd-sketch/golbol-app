import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { Camera, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const positions = [
  { value: "GK", label: "GK", full: "Goalkeeper", color: "bg-yellow-100 text-yellow-700" },
  { value: "DEF", label: "DEF", full: "Defender", color: "bg-blue-100 text-blue-700" },
  { value: "MID", label: "MID", full: "Midfielder", color: "bg-purple-100 text-purple-700" },
  { value: "FWD", label: "FWD", full: "Forward", color: "bg-red-100 text-red-700" },
];

export default function AddPlayerModal({ open, onClose, onAdded, editPlayer }) {
  const [name, setName] = useState("");
  const [position, setPosition] = useState("MID");
  const [rating, setRating] = useState(5);
  const [image, setImage] = useState("");
  const [blackJerseyImage, setBlackJerseyImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingBlack, setUploadingBlack] = useState(false);

  useEffect(() => {
    if (open) {
      setName(editPlayer?.name || "");
      setPosition(editPlayer?.position || "MID");
      setRating(editPlayer?.rating || 5);
      setImage(editPlayer?.image || "");
      setBlackJerseyImage(editPlayer?.blackJerseyImage || "");
    }
  }, [open, editPlayer]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const data = { name: name.trim(), position, rating, image: image || undefined, blackJerseyImage: blackJerseyImage || undefined };
    if (editPlayer) await base44.entities.Player.update(editPlayer.id, data);
    else await base44.entities.Player.create(data);
    setSaving(false);
    onAdded();
    onClose();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setImage(file_url);
    setUploading(false);
  };

  const handleBlackJerseyUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBlack(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBlackJerseyImage(file_url);
    setUploadingBlack(false);
  };

  const ratingLabels = { 1: "Beginner", 2: "Beginner", 3: "Below avg", 4: "Below avg", 5: "Average", 6: "Average", 7: "Good", 8: "Very good", 9: "Elite", 10: "World class" };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm border-0 shadow-2xl rounded-3xl p-0 overflow-hidden gap-0">
        {/* Top photo area — two jersey slots */}
        <div className="relative h-32 bg-secondary flex items-center justify-center gap-6">
          {/* White jersey */}
          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-white hover:opacity-80 transition-opacity relative">
                {image
                  ? <img src={image} alt="" className="w-full h-full object-cover" />
                  : uploading
                    ? <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                    : <Camera className="w-6 h-6 text-muted-foreground/60" />
                }
              </div>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">White</span>
          </div>

          {/* Black jersey */}
          <div className="flex flex-col items-center gap-1">
            <label className="cursor-pointer">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-zinc-800 hover:opacity-80 transition-opacity">
                {blackJerseyImage
                  ? <img src={blackJerseyImage} alt="" className="w-full h-full object-cover" />
                  : uploadingBlack
                    ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    : <Camera className="w-6 h-6 text-white/50" />
                }
              </div>
              <input type="file" accept="image/*" onChange={handleBlackJerseyUpload} className="hidden" />
            </label>
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Black</span>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5 bg-background">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Name</p>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Player name"
              className="w-full h-12 px-4 rounded-xl bg-secondary text-base font-medium placeholder:text-muted-foreground/40 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Position pills */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Position</p>
            <div className="grid grid-cols-4 gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${position === pos.value ? pos.color + " scale-105" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rating</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold tabular-nums">{rating}</span>
                <span className="text-xs text-muted-foreground">{ratingLabels[rating]}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${n <= rating ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full h-13 rounded-2xl bg-foreground text-background text-sm font-semibold disabled:opacity-40 transition-opacity flex items-center justify-center"
          >
            {saving
              ? <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              : editPlayer ? "Update Player" : "Add Player"
            }
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}