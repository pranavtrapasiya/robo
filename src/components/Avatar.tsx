"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Character eye representations based on the spec
export const EYE_STATE_TEXTS: Record<string, string> = {
  happy: "(^ ^)",
  normal: "(◕ ◕)",
  thinking: "(•_•)",
  sleeping: "(- -)",
  surprised: "(O O)",
  excited: "(* *)",
  confused: "(•?•)",
  sad: "(╥ ╥)",
  listening: "(◕ ◕)",
  speaking: "(◕ ◕)",
  neutral: "(◕ ◕)",
};

interface AvatarProps {
  state:
    | "happy"
    | "sad"
    | "thinking"
    | "listening"
    | "sleeping"
    | "surprised"
    | "excited"
    | "confused"
    | "normal"
    | "Idle"
    | "Happy"
    | "Thinking" | "Listening" | "Speaking" | "Sleeping";
  size?: "sm" | "md" | "lg" | "xl";
}

export default function Avatar({ state, size = "md" }: AvatarProps) {
  // Normalize the state to lowercase for matching Kiki's specs
  const normState = state.toLowerCase();

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-36 h-36",
    lg: "w-52 h-52",
    xl: "w-72 h-72",
  };

  // Select the ASCII eye pattern
  const eyeText = EYE_STATE_TEXTS[normState] || EYE_STATE_TEXTS.normal;

  // Head bobbing/tilting animations based on states
  const getHeadAnimation = () => {
    switch (normState) {
      case "sleeping":
        return {
          y: [0, 6, 0],
          rotate: [0, -1.5, 1.5, 0],
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        };
      case "thinking":
        return {
          y: [0, -4, 0],
          rotate: [0, 3, -3, 0],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        };
      case "listening":
        return {
          y: [0, -2, 0],
          scale: [1, 1.01, 1],
          transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        };
      case "speaking":
        return {
          y: [0, -4, 2, -3, 0],
          transition: { duration: 0.8, repeat: Infinity, ease: "linear" },
        };
      case "happy":
      case "excited":
        return {
          y: [0, -10, 0],
          scaleY: [1, 0.96, 1.04, 1],
          transition: { duration: 0.7, repeat: Infinity, ease: "easeInOut" },
        };
      case "sad":
        return {
          y: [0, 4, 0],
          rotate: [0, -1, 1, 0],
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        };
      case "confused":
        return {
          rotate: [0, -4, 4, 0],
          y: [0, -2, 0],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        };
      case "surprised":
        return {
          scale: [1, 1.03, 1],
          y: [0, -3, 0],
          transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
        };
      default:
        return {
          y: [0, -5, 0],
          transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
        };
    }
  };

  const getCheekAnimation = () => {
    if (normState === "happy" || normState === "excited" || normState === "speaking") {
      return {
        scale: [1, 1.2, 1],
        opacity: [0.5, 0.9, 0.5],
        transition: { duration: 1.6, repeat: Infinity },
      };
    }
    return { scale: 1, opacity: 0.4 };
  };

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]}`}>
      {/* SENSORY RING WAVES FOR LISTENING STATE */}
      {normState === "listening" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <motion.div
            className="absolute rounded-full border-2 border-cyan-400/40"
            initial={{ width: "90%", height: "90%", opacity: 0.8 }}
            animate={{ width: "160%", height: "160%", opacity: 0 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute rounded-full border border-violet-400/30"
            initial={{ width: "80%", height: "80%", opacity: 0.6 }}
            animate={{ width: "135%", height: "135%", opacity: 0 }}
            transition={{ duration: 1.8, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
          />
        </div>
      )}

      {/* FLOATING ZZZ FOR SLEEPING STATE */}
      <AnimatePresence>
        {normState === "sleeping" && (
          <div className="absolute top-0 right-0 w-12 h-12 pointer-events-none text-cyan-400 font-bold select-none text-lg">
            <motion.span
              className="absolute text-sm"
              initial={{ opacity: 0, y: 15, x: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -25, x: 10, scale: 1.2 }}
              transition={{ duration: 3, repeat: Infinity, delay: 0 }}
            >
              z
            </motion.span>
            <motion.span
              className="absolute text-base"
              initial={{ opacity: 0, y: 15, x: -5, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -45, x: 15, scale: 1.4 }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            >
              Z
            </motion.span>
            <motion.span
              className="absolute text-lg font-black"
              initial={{ opacity: 0, y: 15, x: -10, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -65, x: 8, scale: 1.6 }}
              transition={{ duration: 3, repeat: Infinity, delay: 2 }}
            >
              Z
            </motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING SPARKLES FOR THINKING STATE */}
      <AnimatePresence>
        {normState === "thinking" && (
          <div className="absolute -top-6 inset-x-0 flex justify-center space-x-1.5 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-violet-400 shadow-md"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.2, 1],
                  backgroundColor: ["#a78bfa", "#f59e0b", "#06b6d4"],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* MAIN ROBOT SVG */}
      <motion.svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_12px_24px_rgba(124,77,255,0.15)] dark:drop-shadow-[0_12px_32px_rgba(0,194,255,0.25)]"
      >
        {/* ROBOT NECK */}
        <path
          d="M68 116H92V132H68V116Z"
          fill="url(#neck-grad)"
          stroke="#475569"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* ROBOT EARS */}
        {/* Left Ear */}
        <motion.path
          d="M20 62H32V88H20V62Z"
          fill="url(#ear-grad-l)"
          stroke="#475569"
          strokeWidth="3.5"
          strokeLinejoin="round"
          animate={{ scaleX: normState === "listening" ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <circle cx="26" cy="62" r="3.5" fill="#FFB300" />
        
        {/* Right Ear */}
        <motion.path
          d="M128 62H140V88H128V62Z"
          fill="url(#ear-grad-r)"
          stroke="#475569"
          strokeWidth="3.5"
          strokeLinejoin="round"
          animate={{ scaleX: normState === "listening" ? [1, 1.15, 1] : 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <circle cx="134" cy="62" r="3.5" fill="#FFB300" />

        {/* ANTENNA */}
        <g>
          <line x1="80" y1="36" x2="80" y2="18" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
          <motion.circle
            cx="80"
            cy="12"
            r="8.5"
            fill={normState === "listening" ? "#00C2FF" : normState === "thinking" ? "#FFB300" : "#7C4DFF"}
            animate={{
              scale: normState === "sleeping" ? [0.9, 1, 0.9] : [1, 1.35, 1],
              opacity: normState === "sleeping" ? 0.4 : [0.8, 1, 0.8],
            }}
            transition={{
              duration: normState === "listening" ? 0.8 : normState === "sleeping" ? 3 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </g>

        {/* ROBOT HEAD */}
        <motion.g animate={getHeadAnimation() as any}>
          {/* Head Body Shell */}
          <rect
            x="28"
            y="32"
            width="104"
            height="86"
            rx="26"
            fill="url(#head-shell-grad)"
            stroke="url(#border-grad)"
            strokeWidth="4.5"
          />

          {/* OLED Glowing Screen */}
          <rect
            x="36"
            y="40"
            width="88"
            height="62"
            rx="14"
            fill="#080614"
            stroke="#2A2447"
            strokeWidth="3"
          />

          {/* Grid lines inside OLED screen for high-tech aesthetic */}
          <line x1="36" y1="52" x2="124" y2="52" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
          <line x1="36" y1="68" x2="124" y2="68" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />
          <line x1="36" y1="84" x2="124" y2="84" stroke="#ffffff" strokeOpacity="0.02" strokeWidth="1" />

          {/* ROSY BLUSHING CHEEKS */}
          <motion.circle
            cx="48"
            cy="76"
            r="4.5"
            fill="#FF4D80"
            animate={getCheekAnimation()}
          />
          <motion.circle
            cx="112"
            cy="76"
            r="4.5"
            fill="#FF4D80"
            animate={getCheekAnimation()}
          />

          {/* ROBOT EYES CONTROLLER (ASCII GLOW DISPLAY) */}
          <g>
            <motion.text
              x="80"
              y="68"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={normState === "sad" ? "#F43F5E" : normState === "excited" ? "#EAB308" : "#00C2FF"}
              fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
              fontSize="24"
              fontWeight="900"
              style={{
                filter: normState === "sad"
                  ? "drop-shadow(0 0 5px rgba(244,63,94,0.8))"
                  : normState === "excited"
                  ? "drop-shadow(0 0 5px rgba(234,179,8,0.8))"
                  : "drop-shadow(0 0 6px rgba(0,194,255,0.9))"
              }}
              animate={
                normState === "thinking"
                  ? { x: [-1.5, 1.5, -1.5], y: [-0.5, 0.5, -0.5] }
                  : normState === "excited"
                  ? { scale: [1, 1.12, 1], y: [-1, -3, -1] }
                  : { scaleY: [1, 1, 0.05, 1, 1] }
              }
              transition={
                normState === "thinking"
                  ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
                  : normState === "excited"
                  ? { duration: 0.6, repeat: Infinity }
                  : { duration: 4.5, repeat: Infinity, repeatDelay: 3 }
              }
            >
              {eyeText}
            </motion.text>
          </g>

          {/* MOUTH CONTROLLER */}
          <g>
            {normState === "speaking" ? (
              // Ripple mouth shape for active vocal speaking
              <motion.path
                d="M 70 86 Q 75 92 80 86 T 90 86"
                stroke="#FFB300"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                animate={{
                  d: [
                    "M 70 86 Q 75 94 80 86 T 90 86",
                    "M 70 86 Q 75 78 80 86 T 90 86",
                    "M 70 86 Q 75 92 80 82 T 90 86",
                    "M 70 86 Q 75 94 80 86 T 90 86",
                  ],
                }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
              />
            ) : normState === "happy" || normState === "excited" ? (
              // Big smiley curve
              <path
                d="M 68 83 Q 80 97 92 83"
                stroke="#FFB300"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
            ) : normState === "sleeping" ? (
              // Silent line
              <path
                d="M 76 85 H 84"
                stroke="#FFB300"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ) : normState === "sad" ? (
              // Downward curve
              <path
                d="M 70 87 Q 80 80 90 87"
                stroke="#FFB300"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            ) : normState === "confused" ? (
              // Squiggly line
              <path
                d="M 72 85 Q 77 82 80 85 T 88 85"
                stroke="#FFB300"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              // Normal slight smile
              <path
                d="M 72 84 Q 80 90 88 84"
                stroke="#FFB300"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        </motion.g>

        {/* GRADIENT DEFINITIONS */}
        <defs>
          <linearGradient id="head-shell-grad" x1="28" y1="32" x2="132" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="60%" stopColor="#312E81" />
            <stop offset="100%" stopColor="#4338CA" />
          </linearGradient>

          <linearGradient id="border-grad" x1="28" y1="32" x2="132" y2="118" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#7C4DFF" />
            <stop offset="50%" stopColor="#00C2FF" />
            <stop offset="100%" stopColor="#FFB300" />
          </linearGradient>

          <linearGradient id="neck-grad" x1="68" y1="116" x2="92" y2="132" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          <linearGradient id="ear-grad-l" x1="20" y1="62" x2="32" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
          <linearGradient id="ear-grad-r" x1="128" y1="62" x2="140" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>
      </motion.svg>
    </div>
  );
}
