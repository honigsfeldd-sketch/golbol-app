import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, User } from "lucide-react";

const LOCATION = "גולבול, אוניברסיטת תל אביב";
const LAT = 32.1133;
const LON = 34.8044;

const WMO_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mostly clear", "🌤️"], 2: ["Partly cloudy", "⛅"], 3: ["Overcast", "☁️"],
  45: ["Foggy", "🌫️"], 48: ["Foggy", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Heavy drizzle", "🌧️"],
  61: ["Light rain", "🌧️"], 63: ["Rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  71: ["Light snow", "🌨️"], 73: ["Snow", "❄️"], 75: ["Heavy snow", "❄️"],
  80: ["Showers", "🌦️"], 81: ["Showers", "🌦️"], 82: ["Heavy showers", "🌧️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm", "⛈️"], 99: ["Thunderstorm", "⛈️"],
};

function useWeather(matchDate, matchTime) {
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    if (!matchDate || !matchTime) return;
    const hour = parseInt(matchTime.split(":")[0], 10);
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&hourly=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&start_date=${matchDate}&end_date=${matchDate}`)
      .then(r => r.json())
      .then(data => {
        const idx = Math.min(hour, (data.hourly?.time?.length || 1) - 1);
        const code = data.hourly.weathercode[idx];
        const [condition, icon] = WMO_CODES[code] || ["Clear", "☀️"];
        setWeather({
          temp: Math.round(data.hourly.temperature_2m[idx]),
          condition,
          icon,
          wind: Math.round(data.hourly.windspeed_10m[idx]),
          humidity: data.hourly.relativehumidity_2m[idx],
        });
      })
      .catch(() => setWeather({ temp: "—", condition: "Unavailable", icon: "🌡️", wind: "—", humidity: "—" }));
  }, [matchDate, matchTime]);
  return weather;
}

function useCountdown(date, time) {
  const getRemaining = () => {
    if (!date || !time) return null;
    const target = new Date(`${date}T${time}:00`);
    const diff = target - new Date();
    if (diff <= 0) return { hours: "00", minutes: "00", seconds: "00" };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return {
      hours: String(h).padStart(2, "0"),
      minutes: String(m).padStart(2, "0"),
      seconds: String(s).padStart(2, "0"),
    };
  };
  const [r, setR] = useState(getRemaining);
  useEffect(() => {
    const t = setInterval(() => setR(getRemaining()), 1000);
    return () => clearInterval(t);
  }, [date, time]);
  return r;
}

function PitchPlayer({ player, index, blackJersey }) {
  const imgSrc = blackJersey && player.blackJerseyImage ? player.blackJerseyImage : player.image;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col items-center gap-1.5"
    >
      <div className="relative">
        <div className="w-11 h-11 rounded-full overflow-hidden border-[1.5px] border-white/30 shadow-sm">
          {imgSrc ? (
            <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center ${blackJersey ? "bg-black/40" : "bg-white/15"}`}>
              <User className="w-4 h-4 text-white/50" />
            </div>
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <span className="text-[8px] font-semibold text-white">{player.rating}</span>
        </div>
      </div>
      <span className="text-[9px] font-medium text-white/80 text-center max-w-[52px] truncate leading-tight">
        {player.name.split(" ")[0]}
      </span>
    </motion.div>
  );
}

function PitchHalf({ players, flipped, blackJersey }) {
  const rows = [];
  const n = players.length;
  if (n <= 2) {
    rows.push(players);
  } else if (n <= 4) {
    rows.push(players.slice(0, 1), players.slice(1));
  } else if (n <= 6) {
    rows.push(players.slice(0, 2), players.slice(2, 4), players.slice(4));
  } else {
    rows.push(players.slice(0, 1), players.slice(1, 4), players.slice(4, 7), players.slice(7));
  }
  const ordered = flipped ? [...rows].reverse() : rows;

  return (
    <div className="flex-1 flex flex-col justify-around items-center py-4 gap-2">
      {ordered.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-4 flex-wrap">
          {row.map((p, i) => <PitchPlayer key={p.id} player={p} index={ri * 4 + i} blackJersey={blackJersey} />)}
        </div>
      ))}
    </div>
  );
}

function CountdownDigit({ value }) {
  return (
    <span className="text-[64px] font-extralight tabular-nums tracking-tight leading-none text-foreground">
      {value}
    </span>
  );
}

export default function UpcomingMatch() {
  const location = useLocation();
  const navigate = useNavigate();
  const { teamA = [], teamB = [], date, time } = location.state || {};
  const countdown = useCountdown(date, time);
  const weather = useWeather(date, time);

  const totalA = teamA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = teamB.reduce((s, p) => s + (p.rating || 5), 0);

  const displayDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
    : "—";
  const displayTime = time
    ? new Date(`2000-01-01T${time}`).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground/70" />
          </button>
          <div className="w-9" />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-32">

        {/* Countdown — the hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="pt-8 pb-12"
        >
          {countdown ? (
            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <CountdownDigit value={countdown.hours} />
                <span className="text-[40px] font-extralight text-foreground/20 mx-1 -translate-y-0.5">:</span>
                <CountdownDigit value={countdown.minutes} />
                <span className="text-[40px] font-extralight text-foreground/20 mx-1 -translate-y-0.5">:</span>
                <CountdownDigit value={countdown.seconds} />
              </div>
              <p className="text-[11px] text-muted-foreground/60 font-medium mt-3 uppercase tracking-[0.2em]">
                Until kick-off
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">No match scheduled</p>
          )}
        </motion.div>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-border/60 mb-10" />

        {/* Teams balance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex items-center justify-between mb-12 px-2"
        >
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">White</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-light tabular-nums text-foreground">{totalA}</span>
              <span className="text-[10px] font-medium text-muted-foreground/40">pts</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-medium text-muted-foreground/30">vs</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">Black</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground/40">pts</span>
              <span className="text-3xl font-light tabular-nums text-foreground">{totalB}</span>
            </div>
          </div>
        </motion.div>

        {/* PITCH */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full rounded-[24px] overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #2d8a4e 0%, #236b3c 50%, #2d8a4e 100%)",
            minHeight: 520
          }}
        >
          <div className="relative w-full" style={{ minHeight: 520 }}>
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
              viewBox="0 0 340 520"
              preserveAspectRatio="none"
            >
              <rect x="12" y="12" width="316" height="496" rx="4" fill="none" stroke="white" strokeWidth="1.5" />
              <line x1="12" y1="260" x2="328" y2="260" stroke="white" strokeWidth="1.5" />
              <circle cx="170" cy="260" r="44" fill="none" stroke="white" strokeWidth="1.5" />
              <circle cx="170" cy="260" r="3" fill="white" />
              <rect x="95" y="12" width="150" height="70" fill="none" stroke="white" strokeWidth="1" />
              <rect x="130" y="12" width="80" height="30" fill="none" stroke="white" strokeWidth="1" />
              <rect x="95" y="438" width="150" height="70" fill="none" stroke="white" strokeWidth="1" />
              <rect x="130" y="478" width="80" height="30" fill="none" stroke="white" strokeWidth="1" />
            </svg>

            <div className="relative z-10 flex flex-col h-full" style={{ minHeight: 520 }}>
              <div className="flex-1">
                <div className="flex items-center justify-center pt-5 pb-1">
                  <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">White</span>
                </div>
                <PitchHalf players={teamA} flipped={false} blackJersey={false} />
              </div>

              <div className="flex justify-center py-1 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              </div>

              <div className="flex-1">
                <PitchHalf players={teamB} flipped={true} blackJersey={true} />
                <div className="flex items-center justify-center pb-5 pt-1">
                  <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white/30">Black</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Match details — quiet footer-like section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="mt-10"
        >
          <div className="border-t border-dashed border-border/60 pt-8">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5">Date</span>
                <span className="text-[13px] font-medium text-foreground/80">{displayDate}</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5">Kick-off</span>
                <span className="text-[13px] font-medium text-foreground/80">{displayTime}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1.5">Weather</span>
                <span className="text-[13px] font-medium text-foreground/80">
                  {weather ? `${weather.temp}° ${weather.condition}` : "…"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mt-5 justify-center">
              <MapPin className="w-3 h-3 text-muted-foreground/30" />
              <span className="text-[11px] text-muted-foreground/50">{LOCATION}</span>
            </div>
          </div>
        </motion.div>

        {/* End Match button */}
        {teamA.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-10"
          >
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/post-match", { state: { teamA, teamB, date, time } })}
              className="w-full h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center font-semibold text-sm"
            >
              End Match
            </motion.button>
          </motion.div>
        )}

      </div>
    </div>
  );
}
