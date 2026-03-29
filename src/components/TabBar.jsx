import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const tabs = [
  {
    path: "/",
    label: "Home",
    // SF Symbol: square.grid.2x2
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    path: "/upcoming",
    label: "Upcoming",
    // SF Symbol: calendar
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    path: "/history",
    label: "History",
    // SF Symbol: clock.arrow.circlepath
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l4 2" />
      </svg>
    ),
  },
  {
    path: "/settings",
    label: "Settings",
    // SF Symbol: gearshape
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 1.8 : 1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

// Routes where tab bar should be hidden
const HIDDEN_ROUTES = ["/teams", "/schedule", "/lineup", "/post-match", "/player", "/match"];

export default function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pressedTab, setPressedTab] = useState(null);

  // Hide tab bar on certain routes
  const isHidden = HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r));

  const currentPath = location.pathname;

  if (isHidden) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        transition={{
          type: "spring",
          stiffness: 380,
          damping: 30,
          mass: 0.8,
        }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)",
        }}
      >
        <motion.nav
          animate={{
            height: 64,
            paddingLeft: 6,
            paddingRight: 6,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 32,
          }}
          className="pointer-events-auto flex items-center gap-0 mx-4"
          style={{
            borderRadius: 32,
            background: "rgba(255, 255, 255, 0.72)",
            backdropFilter: "saturate(180%) blur(20px)",
            WebkitBackdropFilter: "saturate(180%) blur(20px)",
            boxShadow: `
              0 0 0 0.5px rgba(0, 0, 0, 0.06),
              0 2px 6px rgba(0, 0, 0, 0.04),
              0 8px 24px rgba(0, 0, 0, 0.08),
              0 0 40px rgba(255, 255, 255, 0.15) inset
            `,
          }}
        >
          {tabs.map((tab) => {
            const isActive = tab.path === "/"
              ? currentPath === "/"
              : currentPath.startsWith(tab.path);
            const isPressed = pressedTab === tab.path;

            return (
              <motion.button
                key={tab.path}
                onClick={() => {
                  if (!isActive) navigate(tab.path);
                }}
                onTapStart={() => setPressedTab(tab.path)}
                onTap={() => setPressedTab(null)}
                onTapCancel={() => setPressedTab(null)}
                animate={{
                  scale: isPressed ? 0.92 : 1,
                }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                className="relative flex flex-col items-center justify-center outline-none"
                style={{
                  minWidth: 68,
                  padding: "6px 12px",
                  borderRadius: 22,
                  transition: "min-width 0.3s ease, padding 0.3s ease",
                }}
              >
                {/* Active indicator - subtle background */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 28,
                      }}
                      className="absolute inset-0"
                      style={{
                        borderRadius: 22,
                        background: "rgba(0, 0, 0, 0.06)",
                      }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon */}
                <div
                  className="relative z-10"
                  style={{
                    color: isActive
                      ? "#1a1a1a"
                      : "rgba(60, 60, 67, 0.5)",
                    transition: "color 0.25s ease",
                  }}
                >
                  {tab.icon(isActive)}
                </div>

                {/* Label */}
                <span
                  className="relative z-10"
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.01em",
                    color: isActive
                      ? "#1a1a1a"
                      : "rgba(60, 60, 67, 0.5)",
                    lineHeight: "14px",
                    marginTop: 2,
                    transition: "color 0.25s ease",
                  }}
                >
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </motion.nav>
      </motion.div>
    </AnimatePresence>
  );
}
