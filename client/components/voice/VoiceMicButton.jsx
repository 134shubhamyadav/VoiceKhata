"use client";
import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import FloatingGlow from "../animations/FloatingGlow";
import PulseWave from "../animations/PulseWave";

export default function VoiceMicButton({ onClick, isActive = false }) {
  return (
    <div className="relative w-[62px] h-[62px] flex items-center justify-center z-30">
      {/* Precision ambient backlighting */}
      <FloatingGlow />
      {isActive && <PulseWave />}
      
      {/* Sleek tactical click container */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        animate={
          isActive
            ? { scale: [1, 1.02, 1] }
            : { scale: [1, 1.008, 1] }
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onClick={onClick}
        className="relative z-10 w-[62px] h-[62px] rounded-[18px] bg-slate-900 dark:bg-indigo-600 shadow-[0_4px_12px_rgba(79,70,229,0.15)] flex items-center justify-center cursor-pointer border border-white/5 select-none outline-none focus:outline-none focus:ring-0 active:bg-slate-800"
      >
        {/* Soft elegant highlight reflection */}
        <div className="absolute inset-0.5 rounded-[16px] bg-white/5 pointer-events-none" />

        <div className="flex items-center justify-center w-full h-full">
          <Mic size={20} className="text-white select-none pointer-events-none" />
        </div>
      </motion.button>
    </div>
  );
}
