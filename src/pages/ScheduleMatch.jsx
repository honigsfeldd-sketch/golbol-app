import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock } from "lucide-react";

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function ScheduleMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamA = [], teamB = [], selectedPlayers = [] } = location.state || {};

  const [date, setDate] = useState(getTomorrowDate());
  const [time, setTime] = useState("19:00");

  const handleConfirm = () => {
    navigate("/lineup", { state: { teamA, teamB, selectedPlayers, date, time } });
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
          <h1 className="text-base font-semibold tracking-tight">Schedule Match</h1>
        </div>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-5 pt-12 pb-10 flex flex-col gap-12">
        {/* Intro label */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-3xl font-bold tracking-tight leading-tight">
            When's the<br />next game?
          </p>
          <p className="text-muted-foreground text-sm mt-2">Pick a date and kick-off time.</p>
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
              min={new Date().toISOString().slice(0, 10)}
              className="w-full h-16 px-5 rounded-2xl bg-secondary text-base font-semibold outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            />
          </div>
          {date && (
            <p className="text-sm text-muted-foreground pl-1">{displayDate}</p>
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
          disabled={!date || !time}
          className="w-full h-14 rounded-2xl bg-foreground text-background font-semibold text-base disabled:opacity-30 transition-opacity"
        >
          Confirm Match
        </motion.button>
      </div>
    </div>
  );
}