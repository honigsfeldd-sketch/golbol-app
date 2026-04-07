import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, User, Share2, Pencil, X, ArrowRightLeft, Trash2, Check } from "lucide-react";
import { upcomingMatch } from "@/api/base44Client";
import { base44 } from "@/api/base44Client";
// Canvas-based share image (no html2canvas dependency)

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

// ---------- FORMATIONS ----------
const FORMATIONS = {
  "1-3-3": {
    label: "1-3-3",
    slots: [
      { x: 50, y: 8 },
      { x: 18, y: 40 },
      { x: 50, y: 40 },
      { x: 82, y: 40 },
      { x: 18, y: 78 },
      { x: 50, y: 78 },
      { x: 82, y: 78 },
    ],
  },
  "1-3-1-2": {
    label: "1-3-1-2",
    slots: [
      { x: 50, y: 8 },
      { x: 18, y: 36 },
      { x: 50, y: 36 },
      { x: 82, y: 36 },
      { x: 50, y: 58 },
      { x: 33, y: 82 },
      { x: 67, y: 82 },
    ],
  },
  "1-4-1-1": {
    label: "1-4-1-1",
    slots: [
      { x: 50, y: 8 },
      { x: 10, y: 36 },
      { x: 36, y: 36 },
      { x: 64, y: 36 },
      { x: 90, y: 36 },
      { x: 50, y: 58 },
      { x: 50, y: 82 },
    ],
  },
  "1-2-3-1": {
    label: "1-2-3-1",
    slots: [
      { x: 50, y: 8 },
      { x: 30, y: 34 },
      { x: 70, y: 34 },
      { x: 18, y: 58 },
      { x: 50, y: 58 },
      { x: 82, y: 58 },
      { x: 50, y: 82 },
    ],
  },
};
const FORMATION_KEYS = Object.keys(FORMATIONS);
const FIELD_GREEN = "#00925B";
const FIELD_LINES = "#0E9E68";

function toAbsolute(slot, team) {
  // Map slot coordinates to pitch percentages
  // Team A (top): y 3% (goal) → 46% (near midfield)
  // Team B (bottom): y 97% (goal) → 54% (near midfield)
  if (team === "A") {
    return { x: slot.x, y: 3 + (slot.y / 100) * 43 };
  } else {
    return { x: slot.x, y: 97 - (slot.y / 100) * 43 };
  }
}

function getSlots(formationKey, teamSize, players) {
  const formation = FORMATIONS[formationKey];
  if (!formation) return [];

  // Find GK index in team
  const gkIdx = players ? players.findIndex(p => p.position === "GK") : -1;

  const slots = formation.slots.slice(0, teamSize);
  // If team has a GK, ensure slot 0 is the GK slot (y=4, centered)
  if (gkIdx >= 0 && slots.length > 0) {
    slots[0] = { x: 50, y: 6 }; // fixed GK position at the goal
  }

  const extras = [];
  for (let i = slots.length; i < teamSize; i++) {
    extras.push({
      x: 20 + ((i - slots.length) * 30) % 80,
      y: 65 + Math.floor((i - slots.length) / 3) * 12,
    });
  }
  return [...slots, ...extras];
}

// Sort team so GK is always index 0
function sortTeamGKFirst(team) {
  const sorted = [...team];
  const gkIdx = sorted.findIndex(p => p.position === "GK");
  if (gkIdx > 0) {
    const [gk] = sorted.splice(gkIdx, 1);
    sorted.unshift(gk);
  }
  return sorted;
}

// ---------- HOOKS ----------
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

// ---------- COMPONENTS ----------
function CountdownDigit({ value }) {
  return (
    <span className="text-[40px] font-extralight tabular-nums tracking-tight leading-none text-foreground">
      {value}
    </span>
  );
}

function PlayerDot({ player, pctX, pctY, isBlack, isSelected, onTap }) {
  const imgSrc = isBlack && player.blackJerseyImage ? player.blackJerseyImage : player.image;

  return (
    <div
      style={{
        position: "absolute",
        left: `${pctX}%`,
        top: `${pctY}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isSelected ? 40 : 10,
        touchAction: "none",
        transition: "left 0.5s cubic-bezier(0.4, 0, 0.2, 1), top 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      className="cursor-pointer select-none"
      onClick={onTap}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: isSelected ? 1.15 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        className={`w-[46px] h-[46px] rounded-full overflow-hidden shadow-md transition-shadow duration-200 ${
          isSelected ? "ring-2 ring-yellow-400 ring-offset-1 ring-offset-transparent" : ""
        }`}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={player.name} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isBlack ? "bg-zinc-800" : "bg-white/30"}`}>
            <User className="w-4 h-4 text-white/70" />
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FormationPills({ label, selected, onChange, side }) {
  const isTop = side === "top";
  return (
    <div className={`flex items-center gap-1 px-1 ${isTop ? "justify-start" : "justify-end"}`}>
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mr-1">{label}</span>
      {FORMATION_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
            selected === key
              ? "bg-white/20 text-white"
              : "text-white/35 active:text-white/70"
          }`}
        >
          {FORMATIONS[key].label}
        </button>
      ))}
    </div>
  );
}

// ---------- MAIN PAGE ----------
export default function UpcomingMatch() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [matchId, setMatchId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [lineupA, setLineupA] = useState([]);
  const [lineupB, setLineupB] = useState([]);
  const [formationA, setFormationA] = useState("1-3-3");
  const [formationB, setFormationB] = useState("1-3-3");
  const [selected, setSelected] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [allPlayers, setAllPlayers] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Load upcoming match from Supabase
  useEffect(() => {
    (async () => {
      try {
        const match = await upcomingMatch.get();
        if (match) {
          setMatchId(match.id);
          setLineupA(sortTeamGKFirst(match.teamA || []));
          setLineupB(sortTeamGKFirst(match.teamB || []));
          setDate(match.date);
          setTime(match.time);
        }
      } catch (err) {
        console.error("Failed to load upcoming match:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load all players for edit mode (replace player)
  const loadAllPlayers = async () => {
    const data = await base44.entities.Player.list("name");
    setAllPlayers(data);
  };

  const openEditMode = async () => {
    await loadAllPlayers();
    setEditMode(true);
  };

  // Save edits to Supabase
  const saveEdits = async (newA, newB) => {
    if (!matchId) return;
    setSavingEdit(true);
    try {
      await upcomingMatch.update(matchId, { teamA: newA || lineupA, teamB: newB || lineupB });
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    } catch (err) {
      console.error("Failed to save edit:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Move player between teams
  const movePlayer = (player, fromTeam) => {
    let newA, newB;
    if (fromTeam === "A") {
      newA = sortTeamGKFirst(lineupA.filter(p => String(p.id) !== String(player.id)));
      newB = sortTeamGKFirst([...lineupB, player]);
    } else {
      newB = sortTeamGKFirst(lineupB.filter(p => String(p.id) !== String(player.id)));
      newA = sortTeamGKFirst([...lineupA, player]);
    }
    setLineupA(newA);
    setLineupB(newB);
    saveEdits(newA, newB);
  };

  // Remove player from team
  const removePlayer = (player, fromTeam) => {
    let newA = lineupA, newB = lineupB;
    if (fromTeam === "A") {
      newA = lineupA.filter(p => String(p.id) !== String(player.id));
      setLineupA(newA);
    } else {
      newB = lineupB.filter(p => String(p.id) !== String(player.id));
      setLineupB(newB);
    }
    saveEdits(newA, newB);
  };

  // Replace player with another from squad
  const replacePlayer = (oldPlayer, newPlayer, team) => {
    let newA = lineupA, newB = lineupB;
    if (team === "A") {
      newA = sortTeamGKFirst(lineupA.map(p => String(p.id) === String(oldPlayer.id) ? newPlayer : p));
      setLineupA(newA);
    } else {
      newB = sortTeamGKFirst(lineupB.map(p => String(p.id) === String(oldPlayer.id) ? newPlayer : p));
      setLineupB(newB);
    }
    saveEdits(newA, newB);
  };

  const countdown = useCountdown(date, time);
  const weather = useWeather(date, time);

  const totalA = lineupA.reduce((s, p) => s + (p.rating || 5), 0);
  const totalB = lineupB.reduce((s, p) => s + (p.rating || 5), 0);

  const displayDate = date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
    : "—";
  const displayTime = time
    ? new Date(`2000-01-01T${time}`).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const slotsA = getSlots(formationA, lineupA.length, lineupA);
  const slotsB = getSlots(formationB, lineupB.length, lineupB);

  // Load an image as a promise
  const loadImg = (src) =>
    new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
    });

  // Draw a circle-clipped image on canvas
  const drawCircleImg = (ctx, img, cx, cy, r) => {
    if (!img) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#bbb";
      ctx.fill();
      return;
    }
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    // Draw image covering the circle (center-crop)
    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;
    ctx.drawImage(img, sx, sy, size, size, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    // Shadow ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const S = 3; // scale factor for retina
      const W = 390 * S;
      const PITCH_W_PX = 342 * S;
      const PITCH_H_PX = Math.round(342 * 1.4) * S;
      const PITCH_R = 20 * S;
      const DOT_R = 23 * S; // player circle radius (matches 46px interactive)
      const T = 24 * S; // top padding
      const HEADER_H = T + 140 * S;
      const PITCH_TOP = HEADER_H;
      const PITCH_LEFT = (W - PITCH_W_PX) / 2; // centered
      const TOTAL_H = PITCH_TOP + PITCH_H_PX + 50 * S;

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = TOTAL_H;
      const ctx = canvas.getContext("2d");

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, TOTAL_H);

      // --- Header text (3 columns with padding from edges) ---
      const textColor = "#1a1a1a";
      const labelColor = "#999999";
      const colPad = 30 * S; // padding from edges
      const colW = (W - colPad * 2) / 3;
      const col1 = colPad + colW / 2;     // ~30% from left
      const col2 = W / 2;                  // center
      const col3 = W - colPad - colW / 2;  // ~30% from right
      const labelY = T + 16 * S;
      const valueY = T + 40 * S;

      ctx.textAlign = "center";

      // Date
      ctx.fillStyle = labelColor;
      ctx.font = `600 ${11 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("DATE", col1, labelY);
      ctx.fillStyle = textColor;
      ctx.font = `600 ${15 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText(displayDate, col1, valueY);

      // Kick-off
      ctx.fillStyle = labelColor;
      ctx.font = `600 ${11 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("KICK-OFF", col2, labelY);
      ctx.fillStyle = textColor;
      ctx.font = `600 ${15 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText(displayTime, col2, valueY);

      // Weather
      ctx.fillStyle = labelColor;
      ctx.font = `600 ${11 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("WEATHER", col3, labelY);
      ctx.fillStyle = textColor;
      ctx.font = `600 ${15 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText(weather ? `${weather.icon} ${weather.temp}°` : "…", col3, valueY);

      // Location
      ctx.fillStyle = "#aaaaaa";
      ctx.font = `400 ${11 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText(LOCATION, W / 2, T + 66 * S);

      // White vs Black
      ctx.fillStyle = textColor;
      ctx.font = `700 ${14 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("WHITE", W / 2 - 50 * S, T + 100 * S);
      ctx.fillStyle = "#cccccc";
      ctx.font = `400 ${12 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("vs", W / 2, T + 100 * S);
      ctx.fillStyle = textColor;
      ctx.font = `700 ${14 * S}px Inter, system-ui, sans-serif`;
      ctx.fillText("BLACK", W / 2 + 50 * S, T + 100 * S);

      // --- Draw pitch (rounded rect) ---
      ctx.fillStyle = FIELD_GREEN;
      ctx.beginPath();
      ctx.moveTo(PITCH_LEFT + PITCH_R, PITCH_TOP);
      ctx.lineTo(PITCH_LEFT + PITCH_W_PX - PITCH_R, PITCH_TOP);
      ctx.arcTo(PITCH_LEFT + PITCH_W_PX, PITCH_TOP, PITCH_LEFT + PITCH_W_PX, PITCH_TOP + PITCH_R, PITCH_R);
      ctx.lineTo(PITCH_LEFT + PITCH_W_PX, PITCH_TOP + PITCH_H_PX - PITCH_R);
      ctx.arcTo(PITCH_LEFT + PITCH_W_PX, PITCH_TOP + PITCH_H_PX, PITCH_LEFT + PITCH_W_PX - PITCH_R, PITCH_TOP + PITCH_H_PX, PITCH_R);
      ctx.lineTo(PITCH_LEFT + PITCH_R, PITCH_TOP + PITCH_H_PX);
      ctx.arcTo(PITCH_LEFT, PITCH_TOP + PITCH_H_PX, PITCH_LEFT, PITCH_TOP + PITCH_H_PX - PITCH_R, PITCH_R);
      ctx.lineTo(PITCH_LEFT, PITCH_TOP + PITCH_R);
      ctx.arcTo(PITCH_LEFT, PITCH_TOP, PITCH_LEFT + PITCH_R, PITCH_TOP, PITCH_R);
      ctx.closePath();
      ctx.fill();

      // Pitch lines
      ctx.strokeStyle = FIELD_LINES;
      ctx.lineWidth = 2 * S;
      const px = (pct) => PITCH_LEFT + (pct / 300) * PITCH_W_PX;
      const py = (pct) => PITCH_TOP + (pct / 420) * PITCH_H_PX;

      // Outer boundary
      ctx.strokeRect(px(12), py(12), (276 / 300) * PITCH_W_PX, (396 / 420) * PITCH_H_PX);
      // Half line
      ctx.beginPath(); ctx.moveTo(px(12), py(210)); ctx.lineTo(px(288), py(210)); ctx.stroke();
      // Center circle
      ctx.beginPath(); ctx.arc(px(150), py(210), (42 / 300) * PITCH_W_PX, 0, Math.PI * 2); ctx.stroke();
      // Center dot
      ctx.beginPath(); ctx.arc(px(150), py(210), 3 * S, 0, Math.PI * 2); ctx.fillStyle = FIELD_LINES; ctx.fill();
      // Penalty areas
      ctx.lineWidth = 1.5 * S;
      ctx.strokeRect(px(72), py(12), (156 / 300) * PITCH_W_PX, (58 / 420) * PITCH_H_PX);
      ctx.strokeRect(px(108), py(12), (84 / 300) * PITCH_W_PX, (26 / 420) * PITCH_H_PX);
      ctx.strokeRect(px(72), py(350), (156 / 300) * PITCH_W_PX, (58 / 420) * PITCH_H_PX);
      ctx.strokeRect(px(108), py(382), (84 / 300) * PITCH_W_PX, (26 / 420) * PITCH_H_PX);

      // --- Load all player images ---
      const allPlayers = [
        ...slotsA.map((slot, idx) => ({ slot, idx, team: "A", player: lineupA[idx] })),
        ...slotsB.map((slot, idx) => ({ slot, idx, team: "B", player: lineupB[idx] })),
      ].filter((p) => p.player);

      const imgPromises = allPlayers.map((p) => {
        const src = p.team === "B" ? (p.player.blackJerseyImage || p.player.image) : p.player.image;
        return loadImg(src);
      });
      const loadedImgs = await Promise.all(imgPromises);

      // --- Draw players ---
      allPlayers.forEach((p, i) => {
        const abs = toAbsolute(p.slot, p.team);
        const cx = PITCH_LEFT + (abs.x / 100) * PITCH_W_PX;
        const cy = PITCH_TOP + (abs.y / 100) * PITCH_H_PX;
        drawCircleImg(ctx, loadedImgs[i], cx, cy, DOT_R);
      });

      // --- Export & share ---
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const file = new File([blob], "golbol-lineup.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        const whiteNames = lineupA.map(p => p.nickname || p.name).join("\n");
        const blackNames = lineupB.map(p => p.nickname || p.name).join("\n");
        const shareText = `🚨🚨🚨🚨\n⚽ גולבול - ${displayDate} | ${displayTime}\n📍 ${LOCATION}\n\n🤍 White vs Black 🖤\n\nקבוצה 1: לבן 🤍🤍🤍\n${whiteNames}\n\nקבוצה 2: שחור 🖤🖤🖤\n${blackNames}`;
        await navigator.share({ files: [file], title: "Golbol Lineup", text: shareText });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "golbol-lineup.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Share failed:", err);
    }
    setSharing(false);
  }, [sharing, lineupA, lineupB, slotsA, slotsB, displayDate, displayTime, weather]);

  // Tap-to-swap
  const handlePlayerTap = (team, idx) => {
    if (!selected) {
      setSelected({ team, idx });
      return;
    }
    if (selected.team === team && selected.idx === idx) {
      setSelected(null);
      return;
    }
    let newA, newB;
    if (selected.team === team) {
      const arr = team === "A" ? [...lineupA] : [...lineupB];
      [arr[selected.idx], arr[idx]] = [arr[idx], arr[selected.idx]];
      if (team === "A") { setLineupA(arr); newA = arr; newB = lineupB; }
      else { setLineupB(arr); newA = lineupA; newB = arr; }
    } else {
      const fromArr = selected.team === "A" ? [...lineupA] : [...lineupB];
      const toArr = selected.team === "A" ? [...lineupB] : [...lineupA];
      const temp = fromArr[selected.idx];
      fromArr[selected.idx] = toArr[idx];
      toArr[idx] = temp;
      if (selected.team === "A") {
        setLineupA(fromArr); setLineupB(toArr);
        newA = fromArr; newB = toArr;
      } else {
        setLineupB(fromArr); setLineupA(toArr);
        newA = toArr; newB = fromArr;
      }
    }
    setSelected(null);
    saveEdits(newA, newB);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!matchId || (lineupA.length === 0 && lineupB.length === 0)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl">
          <div className="max-w-lg mx-auto px-6 py-4 flex items-center">
            <button onClick={() => navigate("/")} className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors">
              <ArrowLeft className="w-4 h-4 text-foreground/70" />
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <MapPin className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">No upcoming match</p>
          <p className="text-sm text-muted-foreground mt-1">Create teams from the home screen to schedule a match</p>
        </div>
      </div>
    );
  }

  // Players available for replacement (not already in either team)
  const usedIds = new Set([...lineupA, ...lineupB].map(p => String(p.id)));
  const availablePlayers = allPlayers.filter(p => !usedIds.has(String(p.id)));

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
          <div className="flex items-center gap-2">
            {savedIndicator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1 text-xs font-medium text-primary"
              >
                <Check className="w-3.5 h-3.5" /> Saved
              </motion.div>
            )}
            <button
              onClick={openEditMode}
              className="w-9 h-9 rounded-full bg-secondary/60 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <Pencil className="w-4 h-4 text-foreground/70" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 pb-32">

        {/* Countdown — compact */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="pt-4 pb-4"
        >
          {countdown ? (
            <div className="text-center">
              <div className="flex items-baseline justify-center">
                <CountdownDigit value={countdown.hours} />
                <span className="text-[26px] font-extralight text-foreground/20 mx-0.5">:</span>
                <CountdownDigit value={countdown.minutes} />
                <span className="text-[26px] font-extralight text-foreground/20 mx-0.5">:</span>
                <CountdownDigit value={countdown.seconds} />
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-medium mt-1.5 uppercase tracking-[0.2em]">
                Until kick-off
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">No match scheduled</p>
          )}
        </motion.div>

        {/* Match details — right under countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-5"
        >
          <div className="grid grid-cols-3 gap-3 px-1">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Date</span>
              <span className="text-[12px] font-medium text-foreground/80 text-center">{displayDate}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Kick-off</span>
              <span className="text-[12px] font-medium text-foreground/80">{displayTime}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40 mb-1">Weather</span>
              <span className="text-[12px] font-medium text-foreground/80">
                {weather ? `${weather.icon} ${weather.temp}°` : "…"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 justify-center">
            <MapPin className="w-3 h-3 text-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/50">{LOCATION}</span>
          </div>
        </motion.div>

        {/* Dashed divider */}
        <div className="border-t border-dashed border-border/60 mb-5" />

        {/* Teams balance */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex items-center justify-between mb-4 px-2"
        >
          <div className="flex flex-col items-start">
            <span className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground/50 mb-1">White</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-light tabular-nums text-foreground">{totalA}</span>
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
              <span className="text-2xl font-light tabular-nums text-foreground">{totalB}</span>
            </div>
          </div>
        </motion.div>

        {/* PITCH with Lineup */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="space-y-2"
        >
          {/* Formation selector - White (above pitch) */}
          <div className="bg-zinc-100 rounded-2xl px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mr-1.5 shrink-0">White</span>
            {FORMATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setFormationA(key)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  formationA === key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-400 active:text-zinc-600"
                }`}
              >
                {FORMATIONS[key].label}
              </button>
            ))}
          </div>

          {/* The pitch */}
          <div
            className="relative w-full rounded-3xl overflow-hidden"
            style={{
              aspectRatio: "10 / 14",
              background: FIELD_GREEN,
            }}
          >
            {/* Grass stripes */}
            <div className="absolute inset-0 opacity-[0.05]" style={{
              backgroundImage: `repeating-linear-gradient(180deg, transparent 0%, transparent 7.14%, rgba(255,255,255,0.5) 7.14%, rgba(255,255,255,0.5) 14.28%)`,
            }} />

            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 420" preserveAspectRatio="none">
              <rect x="12" y="12" width="276" height="396" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
              <line x1="12" y1="210" x2="288" y2="210" stroke={FIELD_LINES} strokeWidth="2" />
              <circle cx="150" cy="210" r="42" fill="none" stroke={FIELD_LINES} strokeWidth="2" />
              <circle cx="150" cy="210" r="3" fill={FIELD_LINES} />
              <rect x="72" y="12" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <rect x="108" y="12" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <circle cx="150" cy="56" r="2" fill={FIELD_LINES} />
              <rect x="72" y="350" width="156" height="58" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <rect x="108" y="382" width="84" height="26" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <circle cx="150" cy="364" r="2" fill={FIELD_LINES} />
              <path d="M12,22 A10,10 0 0,1 22,12" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M278,12 A10,10 0 0,1 288,22" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M12,398 A10,10 0 0,0 22,408" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
              <path d="M278,408 A10,10 0 0,0 288,398" fill="none" stroke={FIELD_LINES} strokeWidth="1.5" />
            </svg>

            {/* Swap hint */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-3 left-0 right-0 z-[60] flex justify-center"
                >
                  <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                    Tap another player to swap
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Team A (White) — top half */}
            {slotsA.map((slot, idx) => {
              const player = lineupA[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "A");
              return (
                <PlayerDot
                  key={`a-${player.id}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={false}
                  isSelected={selected?.team === "A" && selected?.idx === idx}
                  onTap={() => handlePlayerTap("A", idx)}
                />
              );
            })}

            {/* Team B (Black) — bottom half */}
            {slotsB.map((slot, idx) => {
              const player = lineupB[idx];
              if (!player) return null;
              const abs = toAbsolute(slot, "B");
              return (
                <PlayerDot
                  key={`b-${player.id}`}
                  player={player}
                  pctX={abs.x}
                  pctY={abs.y}
                  isBlack={true}
                  isSelected={selected?.team === "B" && selected?.idx === idx}
                  onTap={() => handlePlayerTap("B", idx)}
                />
              );
            })}
          </div>

          {/* Formation selector - Black (below pitch) */}
          <div className="bg-zinc-900/80 rounded-2xl px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 mr-1.5 shrink-0">Black</span>
            {FORMATION_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => setFormationB(key)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  formationB === key
                    ? "bg-white/20 text-white"
                    : "text-white/35 active:text-white/70"
                }`}
              >
                {FORMATIONS[key].label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Share & End Match buttons */}
        <div className="flex gap-3 mt-6">
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleShare}
            disabled={sharing}
            className="h-14 px-5 rounded-2xl bg-secondary hover:bg-muted transition-colors flex items-center justify-center gap-2 font-semibold text-sm disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            {sharing ? "..." : "Share Lineup"}
          </motion.button>

        {/* End Match button */}
        {lineupA.length > 0 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/post-match", { state: { teamA: lineupA, teamB: lineupB, date, time, formationA, formationB } })}
              className="flex-1 h-14 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-colors flex items-center justify-center font-semibold text-sm"
            >
              End Match
            </motion.button>
        )}
        </div>
      </div>

      {/* Edit Teams Modal */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => { if (e.target === e.currentTarget) setEditMode(false); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-lg bg-background rounded-t-3xl max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                <h2 className="text-base font-semibold">Edit Teams</h2>
                <div className="flex items-center gap-2">
                  {savingEdit && <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin" />}
                  <button
                    onClick={() => setEditMode(false)}
                    className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* White team */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      White ({lineupA.length})
                    </div>
                    <div className="space-y-1.5">
                      {lineupA.map((player) => (
                        <div key={player.id} className="flex items-center gap-1.5">
                          <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl bg-secondary/40">
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-zinc-200">
                              {player.image ? (
                                <img src={player.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-zinc-400" /></div>
                              )}
                            </div>
                            <span className="text-xs font-medium truncate">{player.nickname || player.name}</span>
                          </div>
                          <button onClick={() => movePlayer(player, "A")} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-muted shrink-0">
                            <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => removePlayer(player, "A")} className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 shrink-0">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Black team */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Black ({lineupB.length})
                    </div>
                    <div className="space-y-1.5">
                      {lineupB.map((player) => (
                        <div key={player.id} className="flex items-center gap-1.5">
                          <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-xl bg-secondary/40">
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-zinc-800">
                              {player.blackJerseyImage || player.image ? (
                                <img src={player.blackJerseyImage || player.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><User className="w-3 h-3 text-zinc-500" /></div>
                              )}
                            </div>
                            <span className="text-xs font-medium truncate">{player.nickname || player.name}</span>
                          </div>
                          <button onClick={() => movePlayer(player, "B")} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center hover:bg-muted shrink-0">
                            <ArrowRightLeft className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button onClick={() => removePlayer(player, "B")} className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center hover:bg-red-500/20 shrink-0">
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Available players to add */}
                {availablePlayers.length > 0 && (
                  <div className="mt-6">
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Add Player
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {availablePlayers.map((player) => (
                        <div key={player.id} className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const newA = sortTeamGKFirst([...lineupA, player]);
                              setLineupA(newA);
                              saveEdits(newA, lineupB);
                            }}
                            className="px-2 py-1 rounded-lg bg-secondary/60 hover:bg-secondary text-[10px] font-medium transition-colors"
                          >
                            {player.nickname || player.name} → W
                          </button>
                          <button
                            onClick={() => {
                              const newB = sortTeamGKFirst([...lineupB, player]);
                              setLineupB(newB);
                              saveEdits(lineupA, newB);
                            }}
                            className="px-2 py-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-white text-[10px] font-medium transition-colors"
                          >
                            B
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-4 border-t border-border/40">
                <button
                  onClick={() => setEditMode(false)}
                  className="w-full h-12 rounded-2xl bg-foreground text-background font-semibold text-sm hover:bg-foreground/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
