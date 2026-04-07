import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Check } from "lucide-react";
import { upcomingMatch } from "@/api/base44Client";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function isInPast(date, time) {
  if (!date || !time) return false;
  const matchDT = new Date(`${date}T${time}`);
  return matchDT < new Date();
}

export default function ScheduleMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamA = [], teamB = [], selectedPlayers = [] } = location.state || {};

  const [date, setDate] = useState(getTodayDate());
  const [time, setTime] = useState("19:00");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const isPast = isInPast(date, time);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      if (isPast) {
        // Past match — go straight to result entry
        setSaved(true);
        setTimeout(() => navigate("/post-match", { state: { teamA, teamB, date, time } }), 600);
      } else {
        // Future match — save as upcoming
        await upcomingMatch.save({ teamA, teamB, date, time });
        setSaved(true);
        setTimeout(() => navigate("/upcoming"), 600);
      }
    } catch (err) {
      console.error("Failed to save match:", err);
      alert("Failed to save match. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : "";

  return (
    <div className="min-h-screen bg-background font-inter flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight">{isPast ? "Log Past Match" : "Schedule Match"}</h1>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 pt-12 pb-10 flex flex-col gap-12">
        {/* Intro label */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-3xl font-bold tracking-tight leading-tight">
            {isPast ? <>Log a past<br />match</> : <>When's the<br />next game?</>}
          </p>
          <p className="text-muted-foreground text-sm mt-2">
            {isPast ? "Enter the date and time the match was played." : "Pick a date and kick-off time."}
          </p>
        </motion.div>

        {/* Date picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date</span>
          </div>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-16 px-5 rounded-2xl bg-secondary text-base font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            />
          </div>
          {date && (
            <p className="text-sm text-muted-foreground pl-1">
              {displayDate}
              {isPast && <span className="ml-2 text-xs text-amber-500 font-medium">· Past match</span>}
            </p>
          )}
        </motion.div>

        {/* Time picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Kick-off Time</span>
          </div>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-16 px-5 rounded-2xl bg-secondary text-base font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
          />
        </motion.div>

        <div className="flex-1" />

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          disabled={!date || !time || saving}
          className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-base disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : saved ? (
            <><Check className="w-5 h-5" /> {isPast ? "Loading..." : "Saved!"}</>
          ) : (
            isPast ? "Enter Results" : "Confirm Match"
          )}
        </motion.button>
      </div>
    </div>
  );
}